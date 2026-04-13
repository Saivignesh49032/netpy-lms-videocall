'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

export function AuthForm({ type }: { type: 'sign-in' | 'sign-up' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let error = null;

    if (type === 'sign-in') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
    } else {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Sign ups are by invitation only.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: type === 'sign-in' ? 'Welcome back!' : 'Account created!',
      });
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl bg-dark-1 p-8 shadow-md">
      <div className="flex items-center gap-2">
        <Image src="/icons/logo.svg" width={32} height={32} alt="logo" />
        <h1 className="text-2xl font-bold text-white">LMS Proxy System</h1>
      </div>
      
      <h2 className="text-xl font-semibold text-white">
        {type === 'sign-in' ? 'Sign In' : 'Create Account'}
      </h2>
      
      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 shadow-sm">
          <Input
            className="w-full bg-dark-3 border-none text-white focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-blue-1"
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Input
            className="w-full bg-dark-3 border-none text-white focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-blue-1"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {type === 'sign-up' && (
          <div className="p-4 bg-red-500 bg-opacity-20 text-red-100 rounded text-sm text-center">
            Sign ups are currently by invitation only. Please contact an administrator.
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={loading}
          className="mt-2 bg-blue-1 hover:bg-blue-600"
        >
          {loading ? 'Processing...' : type === 'sign-in' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="text-center text-sm text-gray-400">
        {type === 'sign-in' ? null : (
          <p>
            Already have an account?{' '}
            <span 
              className="cursor-pointer text-blue-1 hover:underline"
              onClick={() => router.push('/sign-in')}
            >
              Sign in
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
