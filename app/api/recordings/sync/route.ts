import { NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/recordings/sync
 * 
 * Manually pulls recordings from Stream Cloud and saves any new ones
 * into the Supabase database. This bypasses the webhook flow and is
 * safe to call multiple times (idempotent).
 *
 * Only Staff, Org Admins, and Super Admins can trigger a sync.
 */
export async function POST() {
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

    if (!profile || profile.role === 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const streamClient = new StreamClient(
      process.env.NEXT_PUBLIC_STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!,
      { timeout: 30000 }
    );
    const adminDb = createAdminClient();

    // Fetch last 20 calls from Stream
    const { calls } = await streamClient.video.queryCalls({
      sort: [{ field: 'created_at', direction: -1 }],
      limit: 20,
    });

    let synced = 0;
    let skipped = 0;

    for (const callState of calls) {
      const callId = callState.call.id;

      let recordings;
      try {
        const res = await streamClient.video.call('default', callId).listRecordings();
        recordings = res.recordings;
      } catch {
        continue;
      }

      if (recordings.length === 0) continue;

      // Find the matching meeting in Supabase
      const { data: meeting } = await adminDb
        .from('meetings')
        .select('id, org_id, host_id')
        .eq('stream_call_id', callId)
        .single();

      if (!meeting) { skipped++; continue; }

      // Org-scoped: non-super-admins only sync their own org's recordings
      if (profile.role !== 'super_admin' && meeting.org_id !== profile.org_id) {
        skipped++;
        continue;
      }

      for (const rec of recordings) {
        const fileKey = rec.url ?? rec.filename ?? `${callId}/recording.mp4`;
        const durationMs = rec.end_time && rec.start_time
          ? new Date(rec.end_time).getTime() - new Date(rec.start_time).getTime()
          : null;

        // Check if already saved
        const { data: existing } = await adminDb
          .from('recordings')
          .select('id')
          .eq('file_key', fileKey)
          .maybeSingle();

        if (existing) { skipped++; continue; }

        const { error } = await adminDb.from('recordings').insert({
          meeting_id:          meeting.id,
          org_id:              meeting.org_id,
          host_id:             meeting.host_id,
          stream_recording_id: rec.session_id ?? null,
          file_key:            fileKey,
          duration_seconds:    durationMs ? Math.round(durationMs / 1000) : null,
          status:              'ready',
        });

        if (!error) synced++;
      }
    }

    return NextResponse.json({ success: true, synced, skipped });
  } catch (err: any) {
    console.error('Recording sync failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
