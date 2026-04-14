'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { GraduationCap, Copy, UserPlus, Check } from 'lucide-react';

export default function StaffStudentsPage() {
  const [data, setData] = useState<{ users: any[]; invites: any[] }>({ users: [], invites: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fetchDirectory = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => { fetchDirectory(); }, [fetchDirectory]);

  const handleInvite = async (e: FormEvent) => {
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

      const fullLink = resData.fullInviteUrl ?? `${window.location.origin}${resData.inviteUrl}`;
      setInviteLink(fullLink);
      setEmail('');
      toast({ title: '✅ Invite sent!', description: 'Email sent to student.' });
      fetchDirectory();
    } catch (err: any) {
      toast({ title: 'Failed to invite', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  const pendingInvites = data.invites.filter((i: any) => !i.used_at);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">My Students</h1>
        <p className="text-emerald-600">Invite and manage students in your classes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lists */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Active Students */}
          <Card className="border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <GraduationCap className="h-5 w-5" />
                Active Students ({data.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <p className="text-gray-400 text-sm">No students yet. Invite one below!</p>
              ) : (
                <div className="rounded-lg border border-emerald-100 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-emerald-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                      {data.users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-emerald-50/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.full_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <Card className="border-amber-100">
              <CardHeader><CardTitle className="text-amber-700 text-base">Pending Invites ({pendingInvites.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {pendingInvites.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-4 py-2">
                      <span className="text-sm text-gray-700">{inv.email}</span>
                      <span className="text-xs text-amber-600">Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Invite Form */}
        <div>
          <Card className="border-emerald-100 sticky top-28">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <UserPlus className="h-5 w-5" /> Invite Student
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Student Email</label>
                  <Input
                    type="email"
                    placeholder="student@school.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {isSubmitting ? 'Sending...' : '📧 Send Invite Email'}
                </Button>
              </form>

              {inviteLink && (
                <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-600 mb-2">Backup invite link:</p>
                  <p className="break-all text-xs text-gray-600 mb-3">{inviteLink}</p>
                  <Button size="sm" variant="outline" className="w-full border-emerald-200" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
