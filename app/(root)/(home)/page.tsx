'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useUser();
  const router = useRouter();
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);

  const createMeeting = async () => {
    try {
      const res = await fetch('/api/meetings/create', { method: 'POST' });
      const data = await res.json();

      // ============== JSON VS INTERFACE SWITCH ==============
      // To see the JSON output, keep lines 19-20 uncommented and comment out line 23:
      setJsonOutput(JSON.stringify(data, null, 2));
      return;

      // To see the actual Video UI interface instead, uncomment this line:
      /* router.push(`/meeting/${data.meetingId}`); */
      // ======================================================

    } catch (e) {
      console.error(e);
    }
  };

  const joinMeeting = () => {
    let meetingId = prompt("Enter Meeting ID:");
    if (!meetingId) return;

    // In case the user pasted the full URL instead of just the ID:
    if (meetingId.includes('meeting/')) {
      meetingId = meetingId.split('meeting/')[1];
    } else if (meetingId.includes('/')) {
      meetingId = meetingId.split('/').pop() || meetingId;
    }

    // ============== JSON VS INTERFACE SWITCH ==============
    // To see JSON response for a join token, uncomment line 46 and comment out line 49:
    /* fetch(`/api/meetings/join?id=${meetingId}`).then(r => r.json()).then(data => setJsonOutput(JSON.stringify(data, null, 2))); */

    // To route straight to the meeting interface, leave this uncommented:
    router.push(`/meeting/${meetingId}`);
    // ======================================================
  };

  const getRecordings = async () => {
    // ============== JSON VS INTERFACE SWITCH ==============
    // This is purely a server-side read so it will only output JSON:
    const meetingId = prompt("Enter the Meeting ID you want to fetch REAL recordings for (leave blank to test error):", "");
    if (meetingId === null) return; // Cancelled

    try {
      const res = await fetch(`/api/meetings/recordings?meetingId=${meetingId}`);
      const data = await res.json();
      setJsonOutput(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e);
    }
    // ======================================================
  };

  const scheduleMeeting = async () => {
    try {
      const desc = prompt("Enter a class name/description:", "Advanced Mathematics");
      if (!desc) return;

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      const defaultString = defaultDate.toISOString().slice(0, 16);

      const scheduledStr = prompt("Enter scheduled date and time (YYYY-MM-DDTHH:MM):", defaultString);
      if (!scheduledStr) return;

      const startsAt = new Date(scheduledStr).toISOString();

      const res = await fetch('/api/meetings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, startsAt })
      });
      const data = await res.json();

      // ============== JSON VS INTERFACE SWITCH ==============
      // This is purely a server-side creation for a future event:
      setJsonOutput(JSON.stringify(data, null, 2));
      // ======================================================
    } catch (e) {
      console.error(e);
    }
  };

  const getUpcoming = async () => {
    // ============== JSON VS INTERFACE SWITCH ==============
    // This is purely a server-side read so it will only output JSON:
    const res = await fetch('/api/meetings/upcoming');
    const data = await res.json();
    setJsonOutput(JSON.stringify(data, null, 2));
    // ======================================================
  };

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="flex flex-col gap-6 p-10 bg-white min-h-screen text-black items-start">
      <h1 className="text-3xl font-bold">LMS Video API Sandbox</h1>
      <p className="text-gray-600">
        You are currently logged in as: <span className="font-bold text-blue-600">{user?.role?.toUpperCase()}</span>
      </p>

      {/* Role Testing Helper */}
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded text-sm max-w-lg mb-4">
        <strong>Dev Note:</strong> This role was manually selected during Sign-Up. In production, the LMS handles authentication and simply passes the role via API payload.
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={createMeeting}
          disabled={!isTeacher}
          className={`px-4 py-2 text-white font-medium rounded transition-colors ${isTeacher ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Create Meeting {isTeacher ? '' : '(Teacher Only)'}
        </button>

        <button
          onClick={scheduleMeeting}
          disabled={!isTeacher}
          className={`px-4 py-2 text-white font-medium rounded transition-colors ${isTeacher ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Schedule Meeting {isTeacher ? '' : '(Teacher Only)'}
        </button>

        <button
          onClick={joinMeeting}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded transition-colors hover:bg-green-700"
        >
          Join Meeting
        </button>

        <button
          onClick={getUpcoming}
          className="px-4 py-2 bg-orange-600 text-white font-medium rounded transition-colors hover:bg-orange-700"
        >
          Upcoming Meetings
        </button>

        <button
          onClick={getRecordings}
          disabled={!isTeacher}
          className={`px-4 py-2 text-white font-medium rounded transition-colors ${isTeacher ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Get Recordings {isTeacher ? '' : '(Teacher Only)'}
        </button>
      </div>

      {jsonOutput && (
        <div className="w-full max-w-3xl">
          <h3 className="font-bold mb-2 text-lg">JSON Response Output:</h3>
          <pre className="bg-gray-100 p-4 border rounded overflow-auto shadow-inner text-sm">
            {jsonOutput}
          </pre>
          <button onClick={() => setJsonOutput(null)} className="mt-2 text-red-500 text-sm hover:underline font-medium">Clear Output</button>
        </div>
      )}
    </div>
  );
}
