'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MessageSquareText } from 'lucide-react';

export default function StudentDoubtsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-sky-900">My Doubts</h1>
        <p className="text-sky-600">Questions you&apos;ve asked in live sessions will appear here.</p>
      </div>

      <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-sky-200">
        <MessageSquareText className="h-12 w-12 text-sky-200" />
        <p className="text-sky-700 font-medium">No doubts posted yet.</p>
        <p className="text-sky-400 text-sm">Join a live class and use the Q&A panel to ask questions.</p>
      </div>
    </div>
  );
}
