import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { archiveRecording } from '@/lib/archiver';

/**
 * Stream Webhook Handler
 * 
 * Stream sends POST to this endpoint on recording events.
 * Configure this URL in Stream Dashboard → Webhooks:
 *   https://yourdomain.com/api/webhooks/stream
 * 
 * Event handled: call.recording_ready
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get('x-signature');
    const secret = process.env.STREAM_API_SECRET || process.env.STREAM_WEBHOOK_SECRET;

    // Webhook Security Signature Verification
    if (secret) {
      if (!sig) {
        console.error('[Stream Webhook] Missing x-signature header while secret is configured');
        return NextResponse.json({ error: 'Unauthorized: Missing signature' }, { status: 401 });
      }
      
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      
      if (sig !== expectedSig) {
        console.error('[Stream Webhook] Invalid signature detected');
        return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('[Stream Webhook] Running without signature verification. Set STREAM_API_SECRET for production.');
    }

    const body = JSON.parse(rawBody);

    // Log all events for debugging
    console.log('[Stream Webhook] Event received:', body.type, JSON.stringify(body).slice(0, 500));

    // Only handle recording_ready events
    if (body.type !== 'call.recording_ready') {
      return NextResponse.json({ received: true });
    }

    const { call_cid, recording } = body;

    if (!call_cid || !recording) {
      console.error('[Stream Webhook] Missing call_cid or recording in payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // call_cid format: "default:CALL_UUID"
    const streamCallId = call_cid.split(':')[1];

    if (!streamCallId) {
      console.error('[Stream Webhook] Could not parse streamCallId from:', call_cid);
      return NextResponse.json({ error: 'Invalid call_cid' }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Find the meeting this recording belongs to
    const { data: meeting, error: meetingError } = await adminDb
      .from('meetings')
      .select('id, org_id, host_id')
      .eq('stream_call_id', streamCallId)
      .maybeSingle();

    if (meetingError || !meeting) {
      console.error('[Stream Webhook] Meeting not found for stream_call_id:', streamCallId, meetingError);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // The recording.url from Stream is the file location.
    // Sanitize URL: strip query params to get a stable, consistent key
    const rawUrl = recording.url ?? recording.filename ?? `recordings/${streamCallId}/${recording.session_id ?? 'recording'}.mp4`;
    const fileKey = rawUrl.split('?')[0];
    const sessionId = recording.session_id ?? recording.id ?? null;

    // Idempotency check by session_id (most stable), fallback to file_key
    const { data: matched } = await adminDb
      .from('recordings')
      .select('id')
      .or(
        sessionId
          ? `stream_recording_id.eq.${encodeURIComponent(sessionId)},file_key.eq.${encodeURIComponent(fileKey)}`
          : `file_key.eq.${encodeURIComponent(fileKey)}`
      )
      .limit(1);

    const existing = matched && matched.length > 0 ? matched[0] : null;

    if (existing) {
      console.log('[Stream Webhook] Recording already exists, skipping:', fileKey);
      return NextResponse.json({ success: true, duplicated: true });
    }

    let durationSeconds: number | null = null;
    if (recording.end_time && recording.start_time) {
      const start = new Date(recording.start_time).getTime();
      const end = new Date(recording.end_time).getTime();
      if (!isNaN(start) && !isNaN(end)) {
        durationSeconds = Math.round((end - start) / 1000);
      }
    }

    // Insert recording metadata into Supabase
    const { data: newRecord, error: insertError } = await adminDb
      .from('recordings')
      .insert({
        meeting_id: meeting.id,
        org_id: meeting.org_id,
        host_id: meeting.host_id,
        stream_recording_id: recording.session_id ?? recording.id ?? null,
        file_key: fileKey,
        duration_seconds: durationSeconds,
        status: 'ready',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Stream Webhook] Failed to insert recording:', insertError);
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
    }

    console.log('[Stream Webhook] Recording saved for meeting:', meeting.id);

    // 🚀 Trigger background archival pipeline (non-blocking) - using existing sessionId from above
    if (sessionId) {
      archiveRecording(newRecord.id, fileKey, sessionId, meeting.id).catch(err => {
        console.error('[Archiver Trigger] Failed:', err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Stream Webhook] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
