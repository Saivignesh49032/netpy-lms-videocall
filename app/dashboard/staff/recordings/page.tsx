'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';

export default function StaffRecordingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Recordings</h1>
        <p className="text-emerald-600">Access recordings from past sessions.</p>
      </div>

      <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-emerald-200">
        <Video className="h-12 w-12 text-emerald-200" />
        <p className="text-emerald-700 font-medium">No recordings available yet.</p>
        <p className="text-emerald-400 text-sm">Recordings will appear here after meetings with recording enabled.</p>
      </div>
    </div>
  );
}
