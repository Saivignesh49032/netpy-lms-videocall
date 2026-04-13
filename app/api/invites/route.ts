import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInviteToken, validateToken } from '@/lib/invite';
import { permissions, Role } from '@/lib/permissions';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { email, role, orgId } = body;

    const currentRole = currentUser.role as Role;
    if (role === 'org_admin' && !permissions.canAddOrgAdmins(currentRole)) throw new Error('Cannot add org admins');
    if (role === 'staff' && !permissions.canAddStaff(currentRole)) throw new Error('Cannot add staff');
    if (role === 'student' && !permissions.canAddStudents(currentRole)) throw new Error('Cannot add students');

    const targetOrgId = orgId || currentUser.org_id;
    if (targetOrgId !== currentUser.org_id && currentRole !== 'super_admin') {
      throw new Error('Can only invite to your own organization');
    }

    const inviteUrl = await createInviteToken(email, role, targetOrgId, user.id);

    return NextResponse.json({ 
      success: true, 
      inviteUrl,
      message: 'Invite created. Hand off this link to the user.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { token, action } = await request.json();
    if (action === 'validate' && token) {
      const res = await validateToken(token);
      if (!res.valid) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true, invite: res.data });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
