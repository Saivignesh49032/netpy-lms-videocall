'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoaded(true);
    };
    fetchUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { 
    user: user ? { 
      id: user.id, 
      username: user.email?.split('@')[0], 
      imageUrl: user.user_metadata?.avatar_url || `https://getstream.io/random_svg/?id=${user.id}&name=${user.email}`,
      role: user.user_metadata?.role || 'student'
    } : null, 
    isLoaded 
  };
};
