'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setVideoClient(undefined);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!API_KEY) throw new Error('Stream API key is missing');

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user.id,
        name: user.email?.split('@')[0] || user.id,
        image: `https://getstream.io/random_svg/?id=${user.id}&name=${user.email}`,
      },
      tokenProvider,
      options: {
        timeout: 15000, 
      },
    });

    setVideoClient(client);
  }, [user]);

  if (user === undefined) return <Loader />;
  if (user === null) return <>{children}</>;
  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
