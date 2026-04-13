'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

interface InviteData {
  token: string;
  email: string;
  role: string;
  orgName?: string;
}

export function InviteAcceptForm({ invite }: { invite: InviteData }) {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign up user Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invite.email,
      password: password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      return toast({
        title: 'Signup Error',
        description: authError?.message || 'Failed to create account.',
        variant: 'destructive',
      });
    }

    // 2. We trigger the API to insert the user profile securely
    const res = await fetch('/api/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: invite.token,
        fullName: fullName
      })
    });

    const body = await res.json();

    setLoading(false);

    if (!res.ok) {
      toast({
        title: 'Profile Error',
        description: body.error || 'Failed to link profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Account created and verified.',
      });
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl bg-dark-1 p-8 shadow-md text-white">
      <div className="flex items-center gap-2">
        <Image src="/icons/logo.svg" width={32} height={32} alt="logo" />
        <h1 className="text-2xl font-bold">LMS Accept Invite</h1>
      </div>
      
      <p className="text-sm text-gray-300">
        You have been invited to join as a <span className="font-bold text-blue-400 capitalize">{invite.role}</span>.
      </p>

      <form onSubmit={handleAccept} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Email Address</label>
          <Input className="w-full bg-dark-3 border-none text-gray-400" type="email" value={invite.email} disabled />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Full Name</label>
          <Input
            className="w-full bg-dark-3 border-none text-white focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-blue-1"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Create Password</label>
          <Input
            className="w-full bg-dark-3 border-none text-white focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-blue-1"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        
        <Button 
          type="submit" 
          disabled={loading}
          className="mt-2 bg-blue-1 hover:bg-blue-600 font-bold"
        >
          {loading ? 'Creating Account...' : 'Accept Invite & Join'}
        </Button>
      </form>
    </div>
  );
}
