'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Building2, KeyRound } from 'lucide-react';
import Loader from '@/components/Loader';

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState('');

  if (!token) {
    return (
      <div className="flex flex-col items-center p-8 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
        <p className="text-gray-500">No invitation token was provided in the URL.</p>
        <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !fullName.trim()) return;

    setIsSubmitting(true);
    setErrorObj('');
    const supabase = createClient();

    try {
      // Read invite info first secretly? No wait, users create their account via auth using token validation inside
      // But wait we need their email?! 
      // Supabase Signup requires email. Let's ask them to enter it, or fetch it.
      // Better: we can validate the token via API first to retrieve the email, then auth.signUp them.
      
      const valRes = await fetch('/api/invites', { 
        method: 'PATCH', // custom method just to validate without consuming?
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'validate' })
      });
      const valData = await valRes.json();
      if (!valRes.ok) throw new Error(valData.error);
      const email = valData.invite.email;

      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 3. Confirm the invite mapping internally
      const confirmRes = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName }),
      });
      const confirmData = await confirmRes.json();
      
      if (!confirmRes.ok) throw new Error(confirmData.error);

      toast({ title: 'Welcome to Netpy LMS!' });
      
      // Attempt login immediately
      await supabase.auth.signInWithPassword({ email, password });
      
      router.push('/dashboard');

    } catch (err: any) {
      setErrorObj(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAccept} className="w-full max-w-md mx-auto space-y-5 bg-white p-8 rounded-2xl shadow-xl mt-12">
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="bg-sky-100 p-3 rounded-full">
          <Building2 className="h-6 w-6 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center">Join Organization</h1>
        <p className="text-gray-500 text-sm text-center">Complete your account setup as invited by your administrator.</p>
      </div>

      {errorObj && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-100">
          {errorObj}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
        <Input 
          placeholder="e.g. John Doe" 
          value={fullName} 
          onChange={e => setFullName(e.target.value)} 
          required 
          disabled={isSubmitting} 
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Set Your Password</label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <Input 
            type="password"
            placeholder="Minimum 6 characters" 
            className="pl-10"
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            minLength={6}
            disabled={isSubmitting} 
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-sky-600 hover:bg-sky-700 py-6 text-base shadow-md">
        {isSubmitting ? 'Creating Account...' : 'Accept Invitation'}
      </Button>
    </form>
  );
}

export default function InviteAcceptPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16 px-4">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-extrabold text-sky-900 tracking-tight">Netpy LMS</h2>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader /></div>}>
        <InviteForm />
      </Suspense>
    </div>
  );
}
