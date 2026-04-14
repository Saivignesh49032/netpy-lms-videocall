import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { permissions, Role } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS will automatically filter batches to the user's organization
    const { data, error } = await supabase
      .from('batches')
      .select('*, batch_members(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ batches: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check custom permissions profile to see if they can create batches
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (!permissions.canCreateBatches(profile.role as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!profile.org_id) {
      return NextResponse.json({ error: 'User is not assigned to an organization' }, { status: 400 });
    }

    const { name, description } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // Insert batch safely
    const { data, error } = await supabase
      .from('batches')
      .insert({
        name,
        description,
        org_id: profile.org_id,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, batch: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
