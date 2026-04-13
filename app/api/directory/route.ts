import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleString = searchParams.get('role'); // comma separated e.g. "staff,student"
    const roles = roleString ? roleString.split(',') : ['staff', 'student'];

    // RLS handles the isolation logic natively, so we just select from users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, role, joined_at, is_active')
      .in('role', roles)
      .order('joined_at', { ascending: false });

    if (usersError) throw usersError;

    // Fetch invites
    const { data: invites, error: invitesError } = await supabase
      .from('invite_tokens')
      .select('id, email, role, created_at, expires_at, used_at, token')
      .in('role', roles)
      .order('created_at', { ascending: false });

    if (invitesError) throw invitesError;

    return NextResponse.json({ users, invites });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
