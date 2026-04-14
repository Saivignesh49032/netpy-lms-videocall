import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let query = supabase
      .from('recordings')
      .select(`
        id,
        stream_recording_id,
        file_key,
        duration_seconds,
        status,
        created_at,
        meetings(id, title, scheduled_at),
        users!recordings_host_id_fkey(full_name, email)
      `)
      .eq('status', 'ready')
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (profile.role === 'super_admin') {
      // Super admin sees everything
    } else if (profile.role === 'org_admin' || profile.role === 'staff') {
      // Scoped to their org
      query = query.eq('org_id', profile.org_id);
    } else if (profile.role === 'student') {
      // Students only see recordings from their org
      query = query.eq('org_id', profile.org_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ recordings: data });
  } catch (err: any) {
    console.error('Recordings GET failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
