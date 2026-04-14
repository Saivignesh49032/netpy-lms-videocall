'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Video, Play, Clock, Calendar, X, Download } from 'lucide-react';

interface Recording {
  id: string;
  duration_seconds: number | null;
  status: string;
  created_at: string;
  meetings: { id: string; title: string; scheduled_at: string | null } | null;
  users: { full_name: string | null; email: string } | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export default function OrgAdminRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('/api/recordings');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load recordings');
      setRecordings(data.recordings ?? []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchRecordings(); }, [fetchRecordings]);

  const handlePlay = async (recording: Recording) => {
    setLoadingId(recording.id);
    try {
      const res = await fetch(`/api/recordings/${recording.id}/url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to get playback URL');
      setPlayingUrl(data.url);
      setPlayingTitle(recording.meetings?.title ?? 'Recording');
    } catch (err: any) {
      toast({ title: 'Playback Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Video Player Modal */}
      {playingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-900">
              <p className="text-white font-semibold text-sm truncate">{playingTitle}</p>
              <button
                onClick={() => { setPlayingUrl(null); setPlayingTitle(''); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <video ref={videoRef} src={playingUrl} controls autoPlay className="w-full max-h-[70vh] bg-black" />
            <div className="flex gap-2 p-3 bg-gray-900 justify-end">
              <a
                href={playingUrl}
                download
                className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-stone-800">Recordings</h1>
        <p className="text-stone-500">All recorded sessions from your organisation's classes.</p>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-stone-200">
          <Video className="h-12 w-12 text-stone-200" />
          <p className="text-stone-600 font-medium">No recordings yet.</p>
          <p className="text-stone-400 text-sm">Recordings will appear here after staff end recorded sessions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recordings.map(rec => (
            <div key={rec.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
              <div className="w-full h-28 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg flex items-center justify-center">
                <Video className="h-10 w-10 text-stone-300" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 text-sm line-clamp-2">{rec.meetings?.title ?? 'Untitled Recording'}</p>
                {rec.users?.full_name && <p className="text-xs text-gray-400">by {rec.users.full_name}</p>}
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />{new Date(rec.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />{formatDuration(rec.duration_seconds)}
                </span>
              </div>
              <button
                onClick={() => handlePlay(rec)}
                disabled={loadingId === rec.id}
                className="w-full mt-auto flex items-center justify-center gap-2 py-2 bg-stone-700 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {loadingId === rec.id
                  ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Play className="h-4 w-4" />
                }
                {loadingId === rec.id ? 'Loading...' : 'Play Recording'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
