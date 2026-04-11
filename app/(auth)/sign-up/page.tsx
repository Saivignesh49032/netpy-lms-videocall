import { AuthForm } from '@/components/AuthForm';

export default function SignUp() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-dark-2 bg-hero bg-cover">
      <AuthForm type="sign-up" />
    </main>
  );
}
