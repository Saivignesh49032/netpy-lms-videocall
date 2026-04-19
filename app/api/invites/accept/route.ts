import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user: sessionUser } } = await supabase.auth.getUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { token, fullName } = body as Partial<{ token: string; fullName: string }>;

    if (typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // 1. Identify the user. Prefer the session, but fallback to searching by email if we have a valid token.
    let userId = sessionUser?.id;
    let userEmail = sessionUser?.email;

    if (!userId) {
      // Fallback: Validate token first to get the email
      const { data: tokenData, error: tokenError } = await adminDb
        .from('invite_tokens')
        .select('email')
        .eq('token', token.trim())
        .single();
      
      if (tokenError || !tokenData) {
        return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 });
      }

      // Look up the auth user by email
      const { data: authUsers } = await adminDb.auth.admin.listUsers();
      const matchingUser = authUsers?.users.find(u => u.email?.toLowerCase() === tokenData.email.toLowerCase());
      
      if (!matchingUser) {
        return NextResponse.json({ error: 'User account not found. Please sign up first.' }, { status: 404 });
      }

      userId = matchingUser.id;
      userEmail = matchingUser.email;
    }

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Could not identify user to complete invite.' }, { status: 401 });
    }

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    const { error: rpcError } = await adminDb.rpc('consume_invite_token_and_create_user_profile', {
      p_token: token.trim(),
      p_user_id: userId,
      p_email: userEmail,
      p_full_name: fullName.trim(),
    });

    if (rpcError) {
      console.error('Invite acceptance failed:', {
        userId,
        email: userEmail,
        error: rpcError,
      });

      const isClientError =
        rpcError.message?.includes('Invalid or expired token') ||
        rpcError.message?.includes('duplicate key');

      return NextResponse.json(
        { error: isClientError ? 'Failed to create user profile' : 'Internal server error' },
        { status: isClientError ? 400 : 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Invite accepted successfully' });
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    console.error('Invite accept route failed:', normalizedError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
