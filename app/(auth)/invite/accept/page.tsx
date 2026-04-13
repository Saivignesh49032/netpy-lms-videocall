import { validateToken } from '@/lib/invite';
import { InviteAcceptForm } from '@/components/users/InviteAcceptForm';
import { redirect } from 'next/navigation';

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const token = searchParams.token as string;

  if (!token) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-dark-2 bg-hero bg-cover">
        <div className="bg-dark-1 p-8 rounded shadow text-white text-center">
          <h1 className="text-xl font-bold text-red-500 mb-2">Invalid Invite Link</h1>
          <p className="text-gray-400">Please make sure you copied the correct link from your administrator.</p>
        </div>
      </main>
    );
  }

  const result = await validateToken(token);

  if (!result.valid || !result.data) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-dark-2 bg-hero bg-cover">
         <div className="bg-dark-1 p-8 rounded shadow text-white text-center max-w-sm">
          <h1 className="text-xl font-bold text-red-500 mb-4">Invite Expired or Used</h1>
          <p className="text-gray-400 text-sm">{result.error}</p>
        </div>
      </main>
    );
  }

  const inviteMap = {
    token: result.data.token,
    email: result.data.email,
    role: result.data.role
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-dark-2 bg-hero bg-cover">
      <InviteAcceptForm invite={inviteMap} />
    </main>
  );
}
