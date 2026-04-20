'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Role } from '@/lib/permissions';
import { useUserContext } from '@/components/providers/UserProvider';

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
  // Try to consume the hydrated server context first
  const hydratedUser = useUserContext();
  
  // If we already have server data, we populate state instantly.
  // Otherwise, we default to fallback behavior (null, false).
  const [profile, setProfile] = useState<UserProfile | null>(hydratedUser?.user || null);
  const [isLoaded, setIsLoaded] = useState(hydratedUser?.isLoaded || false);

  useEffect(() => {
    // If the server successfully hydrated the profile, we don't need to double-fetch on mount.
    // However, we STILL want the auth listener running in case they log out or update their DB row.
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
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!isMounted) return;

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to fetch user profile:', error);
          setProfile(null);
          return;
        }

        if (data) {
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

    // ONLY fetch if we didn't get hydrated data
    if (!hydratedUser?.isLoaded || !hydratedUser?.user) {
      fetchUserAndProfile();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchUserAndProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [hydratedUser?.isLoaded, hydratedUser?.user]); // Dependencies

  return { user: profile, isLoaded };
};
