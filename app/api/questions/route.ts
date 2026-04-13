import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// GET: List questions for a meeting (by stream_call_id)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    if (!callId) return NextResponse.json({ error: 'callId is required' }, { status: 400 });

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Resolve stream_call_id → meeting id
    const { data: meeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('stream_call_id', callId)
      .single();

    if (!meeting) return NextResponse.json({ questions: [] });

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*, users!questions_asked_by_fkey(full_name, email), question_replies(*, users!question_replies_replied_by_fkey(full_name, email))')
      .eq('meeting_id', meeting.id)
      .order('is_pinned', { ascending: false })
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ questions, meetingId: meeting.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Ask a new question
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { meetingId, text } = await request.json();
    if (!meetingId || !text?.trim()) return NextResponse.json({ error: 'meetingId and text are required' }, { status: 400 });

    const { data, error } = await supabase
      .from('questions')
      .insert({ meeting_id: meetingId, asked_by: user.id, text })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, question: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update question (pin, mark answered, upvote)
export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { questionId, action } = await request.json();
    if (!questionId || !action) return NextResponse.json({ error: 'questionId and action are required' }, { status: 400 });

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const isStaff = ['super_admin', 'org_admin', 'staff'].includes(profile?.role);

    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'upvote') {
      // Anyone can upvote — increment
      const { data: q } = await adminDb.from('questions').select('upvotes').eq('id', questionId).single();
      await adminDb.from('questions').update({ upvotes: (q?.upvotes || 0) + 1 }).eq('id', questionId);
    } else if (action === 'pin' && isStaff) {
      const { data: q } = await adminDb.from('questions').select('is_pinned').eq('id', questionId).single();
      await adminDb.from('questions').update({ is_pinned: !q?.is_pinned }).eq('id', questionId);
    } else if (action === 'answer' && isStaff) {
      await adminDb.from('questions').update({ is_answered: true }).eq('id', questionId);
    } else {
      return NextResponse.json({ error: 'Action not permitted' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
