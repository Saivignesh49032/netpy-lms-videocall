import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Filter for meetings where starts_at is greater than current time
    const { data: upcoming, error } = await supabase
      .from('lms_meetings')
      .select('*')
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'success',
      count: upcoming ? upcoming.length : 0,
      upcomingMeetings: upcoming
    });
  } catch (e: any) {
    console.error("API Error:", e);
    return NextResponse.json({ status: 'error', message: e.message }, { status: 500 });
  }
}
