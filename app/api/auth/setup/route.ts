import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getErrorMessage } from '@/lib/utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SetupPayload = {
  email: string;
  password: string;
  fullName: string;
  orgName: string;
};

function validateSetupPayload(body: unknown): { data?: SetupPayload; error?: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object.' };
  }

  const { email, password, fullName, orgName } = body as Partial<SetupPayload>;

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    return { error: 'A valid email address is required.' };
  }

  if (typeof password !== 'string' || password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  if (typeof fullName !== 'string' || fullName.trim().length === 0) {
    return { error: 'Full name is required.' };
  }

  if (typeof orgName !== 'string' || orgName.trim().length === 0) {
    return { error: 'Organization name is required.' };
  }

  return {
    data: {
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      orgName: orgName.trim(),
    },
  };
}

export async function POST(request: Request) {
  let authUserId: string | null = null;
  let authUserDeleted = false;

  try {
    let parsedBody: unknown;

    try {
      parsedBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { data: payload, error: validationError } = validateSetupPayload(parsedBody);
    if (!payload) {
      return NextResponse.json({ error: validationError ?? 'Invalid request payload.' }, { status: 422 });
    }

    const adminDb = createAdminClient();

    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Authentication failed: user missing or invalid');
    }

    authUserId = authData.user.id;

    const { data: bootstrapResult, error: bootstrapError } = await adminDb.rpc('bootstrap_initial_platform', {
      p_user_id: authData.user.id,
      p_email: payload.email,
      p_full_name: payload.fullName,
      p_org_name: payload.orgName,
    });

    if (bootstrapError) {
      const isLocked = bootstrapError.message?.includes('Setup is locked');

      try {
        await adminDb.auth.admin.deleteUser(authData.user.id);
        authUserDeleted = true;
      } catch (cleanupError) {
        console.error('Failed to clean up auth user after setup bootstrap error:', {
          userId: authData.user.id,
          error: getErrorMessage(cleanupError),
        });
      }

      if (isLocked) {
        return NextResponse.json(
          { error: 'Setup is locked. Users already exist in the system.' },
          { status: 403 }
        );
      }

      throw bootstrapError;
    }

    if (!bootstrapResult) {
      throw new Error('Setup failed: bootstrap transaction returned no result.');
    }

    return NextResponse.json({ success: true, message: 'Super Admin and Platform Organization created!' });
  } catch (error) {
    console.error('Platform setup failed:', error);

    if (authUserId && !authUserDeleted) {
      try {
        await createAdminClient().auth.admin.deleteUser(authUserId);
      } catch (cleanupError) {
        console.error('Failed to clean up auth user after setup failure:', {
          userId: authUserId,
          error: getErrorMessage(cleanupError),
        });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
