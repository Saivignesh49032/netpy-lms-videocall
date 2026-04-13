'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';

export default function StudentRecordingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-sky-900">Recordings</h1>
        <p className="text-sky-600">Recordings from your past sessions will be available here.</p>
      </div>

      <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-sky-200">
        <Video className="h-12 w-12 text-sky-200" />
        <p className="text-sky-700 font-medium">No recordings available yet.</p>
        <p className="text-sky-400 text-sm">Recordings from your sessions will appear here after the class ends.</p>
      </div>
    </div>
  );
}
