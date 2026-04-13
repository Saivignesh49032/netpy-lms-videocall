import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Check if any users exist in the system at all
    // Or if there is a super admin
    const { count, error: countError } = await adminDb
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Safety: only allow setup if DB is empty
    if (count !== null && count > 0) {
      return NextResponse.json({ error: 'Setup is locked. Users already exist in the system.' }, { status: 403 });
    }

    const { email, password, fullName, orgName } = await request.json();

    // 1. Create Supabase Auth User explicitly via Admin API to bypass email confirmation rules
    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) throw authError;

    // 2. Create the platform organisation first with a null created_by to avoid circular foreign key constraint
    const { data: orgData, error: orgError } = await adminDb
      .from('organisations')
      .insert({
        name: orgName,
        created_by: null // temporarily null
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 3. Create Super Admin User row now that we have the orgId
    const { error: userError } = await adminDb
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        role: 'super_admin',
        org_id: orgData.id
      });

    if (userError) throw userError;

    // 4. Update the organisation to link the created_by back to the super admin
    await adminDb
      .from('organisations')
      .update({ created_by: authData.user.id })
      .eq('id', orgData.id);

    return NextResponse.json({ success: true, message: 'Super Admin and Platform Organization created!' });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
