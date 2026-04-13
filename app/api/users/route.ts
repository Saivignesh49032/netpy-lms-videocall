import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// GET: List all users on the platform (super_admin only)
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await adminDb
      .from('users')
      .select('id, email, full_name, role, is_active, joined_at, organisations(name)')
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
