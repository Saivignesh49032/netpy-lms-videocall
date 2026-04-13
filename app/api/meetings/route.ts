import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { StreamClient } from '@stream-io/node-sdk';

const adminDb = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: List meetings for the current user's org
export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // RLS automatically scopes org_id
    const { data, error } = await supabase
      .from('meetings')
      .select('*, subjects(name), users!meetings_host_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ meetings: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new structured meeting
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('role, org_id, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !['super_admin', 'org_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Only staff or above can create meetings' }, { status: 403 });
    }

    const body = await request.json();
    const { title, meetingType, subjectId, scheduledAt, description } = body;

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    // Create Stream call
    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    const callId = crypto.randomUUID();
    const call = streamClient.video.call('default', callId);
    await call.getOrCreate({
      data: {
        created_by_id: user.id,
        custom: { title, description: description || '' },
        settings_override: { recording: { mode: 'disabled' } },
        ...(scheduledAt ? { starts_at: new Date(scheduledAt).toISOString() } : {}),
      },
    });

    // Persist meeting in Supabase  
    const { data: meeting, error: meetingError } = await adminDb()
      .from('meetings')
      .insert({
        org_id: profile.org_id,
        host_id: user.id,
        stream_call_id: callId,
        title,
        description,
        subject_id: subjectId || null,
        meeting_type: meetingType || 'instant',
        status: scheduledAt ? 'scheduled' : 'live',
        scheduled_at: scheduledAt || null,
      })
      .select()
      .single();

    if (meetingError) throw meetingError;

    return NextResponse.json({
      success: true,
      meeting,
      meetingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/meeting/${callId}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
