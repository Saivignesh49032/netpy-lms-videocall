'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';

export type Organization = {
  id: string;
  name: string;
  logoUrl: string | null;
  createdBy: string | null;
  createdAt: string;
};

export const useOrg = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrg = async () => {
      // Don't try loading until user is mapped. If no orgId, return null early.
      if (!userLoaded) return;
      if (!user?.orgId) {
        if (isMounted) {
          setOrg(null);
          setIsLoaded(true);
        }
        return;
      }

      setIsLoaded(false);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', user.orgId)
        .single();
        
      if (!isMounted) return;

      if (data) {
        setOrg({
          id: data.id,
          name: data.name,
          logoUrl: data.logo_url,
          createdBy: data.created_by,
          createdAt: data.created_at,
        });
      } else {
        setOrg(null);
        if (error) console.error("Error fetching org:", error);
      }
      
      setIsLoaded(true);
    };

    fetchOrg();

    return () => {
      isMounted = false;
    };
  }, [user?.orgId, userLoaded]);

  return { org, isLoaded };
};
