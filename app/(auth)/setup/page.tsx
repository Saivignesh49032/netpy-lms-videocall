'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

export default function SetupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, orgName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to setup platform');
      }

      toast({
        title: 'Platform Initialized!',
        description: 'Super Admin created successfully. Redirecting...',
      });

      router.push('/');
      router.refresh();

    } catch (err: any) {
      toast({
        title: 'Setup Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-dark-2 bg-hero bg-cover">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl bg-dark-1 p-8 shadow-md">
        <div className="flex items-center gap-2">
          <Image src="/icons/logo.svg" width={32} height={32} alt="logo" />
          <h1 className="text-2xl font-bold text-white">Platform Setup</h1>
        </div>
        
        <p className="text-sm text-gray-400">
          Initialize the LMS by creating the first Super Admin and platform organization. This page works only once.
        </p>

        <form onSubmit={handleSetup} className="flex flex-col gap-4">
          <Input className="bg-dark-3 text-white border-none" type="text" placeholder="Platform Name (Org)" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          <Input className="bg-dark-3 text-white border-none" type="text" placeholder="Your Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input className="bg-dark-3 text-white border-none" type="email" placeholder="Super Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input className="bg-dark-3 text-white border-none" type="password" placeholder="Secure Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

          <Button type="submit" disabled={loading} className="mt-2 bg-blue-1 hover:bg-blue-600">
            {loading ? 'Initializing...' : 'Bootstrap Platform'}
          </Button>
        </form>
      </div>
    </main>
  );
}
