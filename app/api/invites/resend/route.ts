import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInviteEmail } from '@/lib/email';
import { Role } from '@/lib/permissions';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user: currentUserAuth }, error: authError } = await supabase.auth.getUser();

  if (authError || !currentUserAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the inviter's profile
  const { data: inviter } = await supabase
    .from('users')
    .select('role, full_name, org_id')
    .eq('id', currentUserAuth.id)
    .single();

  if (!inviter) {
    return NextResponse.json({ error: 'Inviter profile not found' }, { status: 404 });
  }

  try {
    const { inviteId } = await request.json();
    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    // Fetch the invite token
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 400 });
    }

    // Permission Check: only super_admins can resend arbitrary invites
    // Others can only resend invites they created or within their org
    if (inviter.role !== 'super_admin' && invite.org_id !== inviter.org_id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch org name for the email if applicable
    let orgName: string | undefined;
    if (invite.org_id && invite.org_id !== 'platform') {
      const { data: org } = await supabase
        .from('organisations')
        .select('name')
        .eq('id', invite.org_id)
        .single();
      orgName = org?.name;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const fullInviteUrl = `${appUrl}/invite/accept?token=${invite.token}`;

    // Re-send the email
    await sendInviteEmail({
      toEmail: invite.email,
      role: invite.role,
      inviteUrl: fullInviteUrl,
      invitedByName: inviter.full_name ?? undefined,
      orgName,
    });

    return NextResponse.json({ success: true, message: 'Invitation email resent successfully.' });
  } catch (err: any) {
    console.error('[Invite Resend] Failed:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
