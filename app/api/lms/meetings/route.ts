import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateApiKey, badRequestResponse } from '@/lib/api-auth';
import { buildMeetingResponse, logApiCall } from '@/lib/lms-api';

export async function GET(request: Request) {
  const auth = validateApiKey(request);
  if (!auth.valid) return auth.response;

  const { searchParams } = new URL(request.url);
  const org_id = searchParams.get('org_id');
  
  if (!org_id) {
    return badRequestResponse('org_id is required as a query parameter');
  }

  const status = searchParams.get('status');
  const host_email = searchParams.get('host_email');
  const from_date = searchParams.get('from_date');
  const to_date = searchParams.get('to_date');
  const subject = searchParams.get('subject');
  
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const adminDb = createAdminClient();

  let query = adminDb
    .from('meetings')
    .select('*, users!meetings_host_id_fkey(full_name, email), subjects!inner(name)', { count: 'exact' })
    .eq('org_id', org_id);

  if (status) {
    query = query.eq('status', status);
  }

  if (host_email) {
    query = query.eq('users.email', host_email.toLowerCase());
  }

  if (subject) {
    query = query.eq('subjects.name', subject);
  }

  if (from_date) {
    const fromParsed = new Date(from_date);
    if (!isNaN(fromParsed.getTime())) {
      query = query.gte('scheduled_at', fromParsed.toISOString());
    }
  }

  if (to_date) {
    const toParsed = new Date(to_date);
    if (!isNaN(toParsed.getTime())) {
      query = query.lte('scheduled_at', toParsed.toISOString());
    }
  }

  query = query.order('scheduled_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const responseMeetings = (data || []).map(m => buildMeetingResponse(m, false));

  await logApiCall('lms_list_meetings', org_id, '/api/lms/meetings', { limit, offset, filters: { status, host_email, subject } });

  return NextResponse.json({
    success: true,
    total: count || 0,
    limit,
    offset,
    meetings: responseMeetings
  });
}
