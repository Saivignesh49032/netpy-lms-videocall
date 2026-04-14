import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be authenticated with Supabase first.' }, { status: 401 });
    }

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

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'Authenticated user email is missing' }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const { error: rpcError } = await adminDb.rpc('consume_invite_token_and_create_user_profile', {
      p_token: token.trim(),
      p_user_id: user.id,
      p_email: user.email,
      p_full_name: fullName.trim(),
    });

    if (rpcError) {
      console.error('Invite acceptance failed:', {
        userId: user.id,
        email: user.email,
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
