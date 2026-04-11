'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export default function UserProfile() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/sign-in');
    router.refresh();
  };

  return (
    <Button 
      variant="secondary" 
      onClick={handleSignOut}
      className="bg-dark-3 text-white hover:bg-dark-4"
    >
      Sign Out
    </Button>
  );
}
