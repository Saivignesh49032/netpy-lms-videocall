import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: List subjects for the current org (for meeting form dropdown)
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, code')
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ subjects: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new subject
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'org_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only admins can create subjects' }, { status: 403 });
    }

    const { name, code } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code, org_id: profile.org_id, created_by: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, subject: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
