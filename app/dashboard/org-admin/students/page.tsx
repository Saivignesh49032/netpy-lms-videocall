'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Copy } from 'lucide-react';

export default function StudentsDirectoryPage() {
  const [data, setData] = useState({ users: [], invites: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const fetchDirectory = async () => {
    try {
      const res = await fetch('/api/directory?role=student');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDirectory(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'student' }),
      });
      const resData = await res.json();
      
      if (!res.ok) throw new Error(resData.error);
      
      toast({ title: 'Invite Created', description: 'The invite link is ready below.' });
      setEmail('');
      fetchDirectory();
    } catch (err: any) {
      toast({ title: 'Failed to invite', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/accept?token=${token}`);
    toast({ title: 'Copied!', description: 'Invite link copied to clipboard.' });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Students Directory</h1>
        <p className="text-gray-500">Manage enrolled students and send platform invites.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Enrolled Students</CardTitle></CardHeader>
            <CardContent>
              {data.users.length === 0 ? <p className="text-gray-500 text-sm">No students added yet.</p> : (
                <div className="rounded border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">Name</th>
                        <th className="px-6 py-3 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                      {data.users.map((u: any) => (
                        <tr key={u.id}>
                          <td className="px-6 py-4">{u.full_name || 'Pending Name'}</td>
                          <td className="px-6 py-4">{u.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pending Invites</CardTitle></CardHeader>
            <CardContent>
              {data.invites.filter((i:any) => !i.used_at).length === 0 ? <p className="text-gray-500 text-sm">No pending invites.</p> : (
                <div className="rounded border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y">
                      {data.invites.filter((i:any) => !i.used_at).map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="px-6 py-4 flex flex-col">
                            <span className="font-medium text-sm">{inv.email}</span>
                            <span className="text-xs text-stone-400">Expires: {new Date(inv.expires_at).toLocaleDateString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)}>
                              <Copy className="h-4 w-4 mr-2" /> Copy Link
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader><CardTitle>Invite Student</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email Address</label>
                  <Input type="email" placeholder="student@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                </div>
                <Button type="submit" disabled={isSubmitting || !email} className="w-full">
                  {isSubmitting ? 'Generating...' : 'Generate Invite Link'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
