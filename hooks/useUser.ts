'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Role } from '@/lib/permissions';

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  imageUrl: string;
  role: Role;
  orgId: string | null;
};

export const useUser = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const fetchUserAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          if (isMounted) {
            setProfile(null);
            setIsLoaded(true);
          }
          return;
        }

        const authUser = session.user;
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!isMounted) return;

        if (data) {
          // Exists in DB
          setProfile({
            id: data.id,
            email: data.email || authUser.email || '',
            username: data.full_name || authUser.email?.split('@')[0] || '',
            fullName: data.full_name || '',
            imageUrl: data.avatar_url || `https://getstream.io/random_svg/?id=${data.id}&name=${authUser.email}`,
            role: (data.role as Role) || 'student',
            orgId: data.org_id,
          });
        } else {
          // Fallback (e.g. just invited but not inserted yet)
          setProfile({
            id: authUser.id,
            email: authUser.email || '',
            username: authUser.email?.split('@')[0] || '',
            fullName: '',
            imageUrl: `https://getstream.io/random_svg/?id=${authUser.id}&name=${authUser.email}`,
            role: (authUser.user_metadata?.role as Role) || 'student',
            orgId: null,
          });
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        if (isMounted) setProfile(null);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    fetchUserAndProfile();

    // Listen sequentially matching the state
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchUserAndProfile(); // re-fetch profile completely
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user: profile, isLoaded };
};
