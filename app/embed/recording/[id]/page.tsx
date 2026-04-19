'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function SecureEmbedPlayer() {
  const params = useParams();
  const rawId = params.id;
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : null;

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUrl() {
      if (!id) {
        setError('No recording ID provided');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/recordings/${id}/url`);
        
        // Safety: check res.ok before attempting to parse as JSON
        let data: any = null;
        try {
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          throw new Error('Invalid response from server');
        }

        if (!res.ok) {
          if (res.status === 401) {
            setError('Please log into the LMS platform to view this recording.');
          } else if (res.status === 403) {
            setError('You do not have permission to view this specific recording.');
          } else {
            setError(data?.error || 'Failed to authenticate');
          }
          return;
        }

        setVideoUrl(data.url);
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchUrl();
  }, [id]);

  if (loading) {
    return (
      <div className="flex bg-black h-screen w-full items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col bg-black h-screen w-full items-center justify-center text-white p-6 text-center">
        <Lock className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Restricted Access</h2>
        <p className="text-gray-400">{error}</p>
        <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-800">Powered by Netpy LMS</p>
      </div>
    );
  }

  return (
    <div className="bg-black w-full h-screen overflow-hidden flex items-center justify-center">
      <video 
        src={videoUrl!} 
        controls 
        controlsList="nodownload" 
        autoPlay 
        playsInline
        className="w-full h-full outline-none"
      />
    </div>
  );
}
