import { NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get('meetingId');
  
  if (!meetingId) {
    return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
  }

  const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    return NextResponse.json({ error: 'API Keys missing' }, { status: 500 });
  }

  try {
    const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
    const call = client.video.call('default', meetingId);
    
    // Fetch REAL recordings from the GetStream server for this specific meeting
    const response = await call.listRecordings();

    return NextResponse.json({
      status: 'success',
      meetingId,
      recordingsCount: response.recordings.length,
      recordings: response.recordings
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message || 'Failed to fetch recordings'
    }, { status: 500 });
  }
}
