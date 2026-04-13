'use client';

import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/Loader';

export default function DashboardDirector() {
  const { role, isLoaded } = useRole();
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  // Safety: if still not loaded after 5 seconds, redirect to sign-in
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isLoaded) setTimedOut(true);
    }, 5000);
    return () => clearTimeout(t);
  }, [isLoaded]);

  useEffect(() => {
    if (timedOut) {
      router.push('/sign-in');
      return;
    }
    if (!isLoaded) return;

    if (!role) {
      router.push('/sign-in');
    } else {
      router.push(`/dashboard/${role.replace(/_/g, '-')}`);
    }
  }, [role, isLoaded, timedOut, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader />
      {timedOut && <p className="text-sm text-gray-400">Taking too long... redirecting.</p>}
    </div>
  );
}
