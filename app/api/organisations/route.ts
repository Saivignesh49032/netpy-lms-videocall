import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const MAX_ORG_NAME_LENGTH = 120;

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('organisations')
      .select('*, users!users_org_id_fkey(count)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ organisations: data });
  } catch (error) {
    console.error('Organisations GET route failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name } = body as Partial<{ name: string }>;

    if (typeof name !== 'string') {
      return NextResponse.json({ error: 'Name must be a string' }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (trimmedName.length > MAX_ORG_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${MAX_ORG_NAME_LENGTH} characters or fewer` },
        { status: 400 }
      );
    }

    const { data, error } = await createAdminClient()
      .from('organisations')
      .insert({ name: trimmedName, created_by: user.id })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, organisation: data });
  } catch (error) {
    console.error('Organisations POST route failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
