'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

export default function StaffSchedulePage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? res.statusText ?? `Request failed with status ${res.status}`);
      // Show only scheduled upcoming
      const upcoming = (data.meetings || []).filter((m: any) => m.status === 'scheduled');
      setMeetings(upcoming);
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Schedule</h1>
        <p className="text-emerald-600">Your upcoming scheduled sessions.</p>
      </div>

      {meetings.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-emerald-200">
          <Calendar className="h-12 w-12 text-emerald-200" />
          <p className="text-emerald-700 font-medium">No scheduled meetings.</p>
          <p className="text-emerald-400 text-sm">Go to Meetings and create a scheduled session.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {meetings.map(m => {
            const scheduledDate = m.scheduled_at ? new Date(m.scheduled_at) : null;
            const formattedScheduledAt =
              scheduledDate && !Number.isNaN(scheduledDate.getTime())
                ? scheduledDate.toLocaleString()
                : 'TBD';

            return (
              <Card key={m.id} className="bg-white border-emerald-100">
                <CardContent className="pt-5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-gray-900">{m.title}</p>
                    {m.subjects?.name && <p className="text-sm text-emerald-600">{m.subjects.name}</p>}
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formattedScheduledAt}
                    </span>
                  </div>
                  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">Scheduled</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
