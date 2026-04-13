import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { validateToken, markTokenUsed } from '@/lib/invite';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    // 1. Get the currently authenticated user (they just signed up via auth)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be authenticated with Supabase first.' }, { status: 401 });
    }

    const { token, fullName } = await request.json();
    if (!token) return NextResponse.json({ error: 'Token missing' }, { status: 400 });

    // 2. Validate token
    const tokenCheck = await validateToken(token);
    if (!tokenCheck.valid || !tokenCheck.data) {
      return NextResponse.json({ error: tokenCheck.error }, { status: 400 });
    }

    const inviteData = tokenCheck.data;

    // Security check: Make sure the email they signed up with matches the invite email
    if (user.email !== inviteData.email) {
      return NextResponse.json({ error: 'Auth email does not match invite email' }, { status: 400 });
    }

    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Insert into users table
    const { error: insertError } = await adminDb
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: inviteData.role,
        org_id: inviteData.org_id,
        invited_by: inviteData.invited_by
      });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create user profile: ' + insertError.message }, { status: 500 });
    }

    // 4. Mark token as used
    await markTokenUsed(inviteData.id);

    return NextResponse.json({ success: true, message: 'Invite accepted successfully' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
