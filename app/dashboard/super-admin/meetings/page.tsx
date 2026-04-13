'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ExternalLink, Video } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  live: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-700',
  ended: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-yellow-100 text-yellow-700',
};

export default function SuperAdminMeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/meetings')
      .then(r => r.json())
      .then(d => setMeetings(d.meetings || []))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">All Meetings</h1>
        <p className="text-slate-400">Platform-wide view of all scheduled and past meetings.</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-slate-100">Meeting Log</CardTitle></CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Video className="h-10 w-10 text-slate-600" />
              <p className="text-slate-500">No meetings have been created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-900">
                  <tr>
                    {['Title', 'Subject', 'Host', 'Type', 'Status', 'Created', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {meetings.map(m => (
                    <tr key={m.id} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium">{m.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{m.subjects?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{m.users?.full_name || m.users?.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400 capitalize">{m.meeting_type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[m.status] || ''}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {m.status !== 'ended' && m.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 h-7"
                            onClick={() => router.push(`/meeting/${m.stream_call_id}`)}>
                            <ExternalLink className="h-3 w-3 mr-1" /> Join
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
