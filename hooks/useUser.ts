'use client';

import { useEffect, useState } from 'react';
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
    const supabase = createClient();
    let isMounted = true;
    
    const fetchProfile = async (authUser: User) => {
      // 1. First, check if there is a record in the 'users' table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (!isMounted) return;

      if (data) {
        // Enriched user from our RBAC database
        setProfile({
          id: data.id,
          email: data.email || authUser.email || '',
          username: data.full_name || authUser.email?.split('@')[0] || '',
          fullName: data.full_name || '',
          imageUrl: data.avatar_url || `https://getstream.io/random_svg/?id=${data.id}&name=${authUser.email}`,
          role: (data.role as Role) || 'student',
          orgId: data.org_id
        });
      } else {
        // 2. Fallback for before migration / Super Admin bootstrap
        // If no user record exists, we read from metadata (the legacy way)
        setProfile({
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.email?.split('@')[0] || '',
          fullName: '',
          imageUrl: authUser.user_metadata?.avatar_url || `https://getstream.io/random_svg/?id=${authUser.id}&name=${authUser.email}`,
          role: (authUser.user_metadata?.role as Role) || 'student',
          orgId: null
        });
      }
      setIsLoaded(true);
    };

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        if (isMounted) {
          setProfile(null);
          setIsLoaded(true);
        }
      }
    };
    
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (session?.user) {
          // If profile isn't loaded or user changed
          if (!profile || profile.id !== session.user.id) {
            setIsLoaded(false); 
            await fetchProfile(session.user);
          }
        } else {
          setProfile(null);
          setIsLoaded(true);
        }
      }
    );
    
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { 
    user: profile,
    isLoaded 
  };
};
