'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import Loader from '@/components/Loader';
import { Video, Play, Clock, Calendar, X, Download, RefreshCw, Code, Trash2, AlertTriangle, HardDrive, Cloud } from 'lucide-react';

interface Recording {
  id: string;
  duration_seconds: number | null;
  status: string;
  created_at: string;
  file_key: string;
  stream_recording_id: string | null;
  meetings: { id: string; title: string; scheduled_at: string | null } | null;
  users: { full_name: string | null; email: string } | null;
}

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds < 0) return '—';
  if (totalSeconds === 0) return '0s';
  
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function StaffRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const copyEmbedCode = async () => {
    if (!playingId) return;
    const embedStaticUrl = `${window.location.origin}/embed/recording/${playingId}`;
    const code = `<iframe src="${embedStaticUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(code);
        toast({ title: "Copied!", description: "Embed code copied to clipboard." });
      } catch (err: any) {
        toast({ title: "Copy failed", description: err.message || "Unable to copy to clipboard", variant: 'destructive' });
      }
    } else {
      toast({ title: "Copy failed", description: "Clipboard API not available", variant: 'destructive' });
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/recordings/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Sync failed');
      toast({ title: `✅ Sync Complete`, description: `${data.synced} new recording(s) found.` });
      await fetchRecordings();
    } catch (err: any) {
      toast({ title: 'Sync Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/recordings/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to delete recording');
      setRecordings(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Recording deleted.' });
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
    } finally {
      if (id === playingId) {
        setPlayingUrl(null);
        setPlayingId(null);
        setPlayingTitle('');
      }
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

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

  // Initial load
  useEffect(() => { fetchRecordings(); }, [fetchRecordings]);

  // Supabase Realtime: auto-add new recordings as they arrive
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('recordings-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recordings' },
        (payload) => {
          fetchRecordings();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRecordings, toast]);

  const handlePlay = async (recording: Recording) => {
    setLoadingId(recording.id);
    try {
      const res = await fetch(`/api/recordings/${recording.id}/url`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to get playback URL');
      setPlayingId(recording.id);
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
                onClick={() => { setPlayingUrl(null); setPlayingTitle(''); setPlayingId(null); }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <video
              ref={videoRef}
              src={playingUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh] bg-black"
            />
            <div className="flex gap-2 p-3 bg-gray-900 justify-end">
              <button
                onClick={copyEmbedCode}
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded-lg border border-blue-800 hover:bg-blue-900/30"
              >
                <Code className="h-3.5 w-3.5" /> Copy Embed Code
              </button>
              <a
                href={playingUrl}
                download
                className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg border border-emerald-800 hover:bg-emerald-900/30"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Recordings</h1>
          <p className="text-emerald-600">All recorded sessions from your classes. Updates automatically.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Recordings'}
        </button>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-emerald-200">
          <Video className="h-12 w-12 text-emerald-200" />
          <p className="text-emerald-700 font-medium">No recordings yet.</p>
          <p className="text-emerald-400 text-sm">Recordings appear automatically when a session ends.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recordings.map(rec => (
            <div key={rec.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
              {/* Thumbnail */}
              <div className="w-full h-28 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-lg flex items-center justify-center">
                <Video className="h-10 w-10 text-emerald-300" />
              </div>

              <div className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                  {rec.meetings?.title ?? 'Untitled Recording'}
                </p>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(rec.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(rec.duration_seconds)}
                </span>
                <span className={`mt-1 flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border 
                  ${!rec.file_key?.startsWith('http') ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}
                >
                  {!rec.file_key?.startsWith('http') ? <><HardDrive className="h-3 w-3" /> Saved Permanently</> : <><Cloud className="h-3 w-3" /> On Stream</>}
                </span>
              </div>

              {/* Confirm Delete Prompt */}
              {confirmDeleteId === rec.id ? (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Delete this recording? This cannot be undone.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(rec.id)}
                      disabled={deletingId === rec.id}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                    >
                      {deletingId === rec.id ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handlePlay(rec)}
                    disabled={loadingId === rec.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                  >
                    {loadingId === rec.id ? (
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {loadingId === rec.id ? 'Loading...' : 'Play'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(rec.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
