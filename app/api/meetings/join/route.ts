import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: 'Missing meeting id' }, { status: 400 });

  return NextResponse.json({
    status: 'success',
    meetingId: id,
    action: 'join',
    // The LMS would securely receive these tokens/URLs to give to the student/teacher
    videoUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/meeting/${id}`
  });
}
