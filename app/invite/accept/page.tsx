'use client';

import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Building2, KeyRound, Mail, User } from 'lucide-react';
import Loader from '@/components/Loader';
import { getErrorMessage } from '@/lib/utils';

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState('');
  const [existingSession, setExistingSession] = useState<any>(null);

  // Validate token immediately to fetch the assigned email
  useEffect(() => {
    async function validateInitialToken() {
      if (!token) {
        setIsValidating(false);
        return;
      }
      
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setExistingSession(session);

        const valRes = await fetch('/api/invites', { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'validate' })
        });
        const valData = await valRes.json();
        
        if (!valRes.ok) {
          setErrorObj(valData.error || 'Invalid or expired token.');
        } else {
          setInviteEmail(valData.invite.email);
        }
      } catch (err: any) {
        console.error('[Invite Validation Error]:', err);
        setErrorObj(err.message || 'Connecting to server failed. Please ensure your internet is active and the server is running.');
      } finally {
        setIsValidating(false);
      }
    }

    validateInitialToken();
  }, [token]);

  if (!token) {
    return (
      <div className="flex flex-col items-center p-8 text-center bg-white rounded-2xl shadow-xl mt-12 w-full max-w-md mx-auto">
        <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
        <p className="text-gray-500">No invitation token was provided in the URL.</p>
        <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-xl mt-12 w-full max-w-md mx-auto min-h-[300px]">
        <Loader />
        <p className="mt-4 text-sm text-gray-500">Verifying secure invitation...</p>
      </div>
    );
  }

  const handleAccept = async (e: FormEvent) => {
    e.preventDefault();
    setErrorObj('');

    if (password !== confirmPassword) {
      setErrorObj('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorObj('Password must be at least 8 characters long.');
      return;
    }

    if (!fullName.trim()) {
      setErrorObj('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // 1. Register the user with Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: inviteEmail,
        password,
      });

      if (authError) throw authError;

      // 2. Confirm the invite mapping internally to create profile
      const confirmRes = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName }),
      });
      const confirmData = await confirmRes.json().catch(() => null);
      
      if (!confirmRes.ok) {
        // Cleanup orphaned auth user on fail
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const { data: { user } } = await supabase.auth.getUser();
          
          await fetch('/api/auth/delete-user', { 
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user?.id })
          }).finally(() => clearTimeout(timeoutId));
        } catch (cleanupError: any) {
          console.error('Failed to clean up orphaned auth user:', cleanupError);
        }

        throw new Error(confirmData?.error || 'Failed to confirm invite.');
      }

      toast({ title: 'Welcome to Netpy LMS!' });
      
      // 3. Attempt login immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email: inviteEmail, 
        password 
      });
      
      if (signInError || !signInData.user) {
        throw signInError ?? new Error('Unable to sign in after accepting the invite. Please login manually.');
      }

      router.push('/dashboard');

    } catch (err) {
      const message = getErrorMessage(err, 'Failed to accept invitation.');
      setErrorObj(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptLoggedIn = async () => {
    setIsSubmitting(true);
    try {
      const confirmRes = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName: existingSession?.user?.user_metadata?.full_name || 'Existing User' }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Failed to link account');
      
      toast({ title: 'Success', description: 'Your account has been linked to this organization.' });
      router.push('/dashboard');
    } catch (err: any) {
      setErrorObj(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (errorObj && !inviteEmail) {
    // Show hard error block if token is completely invalid (no email retrieved)
    return (
      <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-xl mt-12 w-full max-w-md mx-auto text-center border-t-4 border-red-500">
        <div className="bg-red-50 p-3 rounded-full mb-4">
          <KeyRound className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Invalid</h2>
        <p className="text-gray-600 mb-6">{errorObj}</p>
        <Button className="w-full bg-gray-900 hover:bg-gray-800" onClick={() => router.push('/')}>
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleAccept} className="w-full max-w-md mx-auto space-y-6 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mt-8">
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="bg-sky-50 shadow-inner p-3.5 rounded-2xl">
          <Building2 className="h-7 w-7 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 text-center tracking-tight">Setup Your Account</h1>
        <p className="text-gray-500 text-sm text-center px-4">Complete your account setup to join the platform.</p>
      </div>

      {errorObj && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
           <span>{errorObj}</span>
        </div>
      )}

      {existingSession && existingSession.user.email === inviteEmail ? (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
             <p className="text-emerald-800 text-sm leading-relaxed">
               You are already logged in as <strong>{inviteEmail}</strong>. 
               Click below to link your existing account to this organization and continue to your dashboard.
             </p>
          </div>
          <Button 
            onClick={handleAcceptLoggedIn}
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-[15px] font-semibold text-white rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Linking Account...' : 'Continue to Dashboard →'}
          </Button>
          <button 
            type="button"
            onClick={async () => {
               const supabase = createClient();
               await supabase.auth.signOut();
               window.location.reload();
            }}
            className="w-full text-gray-400 hover:text-gray-600 text-xs font-medium"
          >
            Not you? Sign out and create a new account
          </button>
        </div>
      ) : existingSession ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2x p-5 text-center">
          <p className="text-amber-800 text-sm mb-4">
            You are logged in as <strong>{existingSession.user.email}</strong>, which does not match the invited email.
          </p>
          <Button 
            variant="outline" 
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-100"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.reload();
            }}
          >
            Sign out to accept invite
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="email"
                  value={inviteEmail} 
                  disabled
                  className="pl-10 bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="e.g. Jane Smith" 
                  className="pl-10 focus:ring-sky-500 focus:border-sky-500"
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  required 
                  disabled={isSubmitting} 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Create Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="password"
                  placeholder="Min. 8 characters" 
                  className="pl-10 focus:ring-sky-500 focus:border-sky-500"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={8}
                  disabled={isSubmitting} 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="password"
                  placeholder="Re-type your password" 
                  className="pl-10 focus:ring-sky-500 focus:border-sky-500"
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={8}
                  disabled={isSubmitting} 
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-sky-600 hover:bg-sky-700 py-6 text-[15px] font-semibold text-white rounded-xl shadow-lg shadow-sky-200 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? 'Creating Account...' : 'Accept Invitation & Login'}
          </Button>
        </>
      )}
    </form>
  );
}

export default function InviteAcceptPage() {
  return (
    <div className="min-h-screen bg-[#fafcff] flex flex-col pt-12 px-4 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-100 blur-[100px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50 blur-[100px] opacity-60 pointer-events-none" />
      
      <div className="text-center mb-2 relative z-10 w-full">
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-700 to-emerald-600 tracking-tight">Netpy LMS</h2>
      </div>
      
      <div className="relative z-10 w-full">
        <Suspense fallback={<div className="flex justify-center p-12 mt-12"><Loader /></div>}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  );
}
