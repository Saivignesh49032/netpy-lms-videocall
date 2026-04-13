'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Copy, Building2, Users, ShieldCheck } from 'lucide-react';

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  org_admin: 'bg-blue-100 text-blue-800',
  staff: 'bg-emerald-100 text-emerald-800',
  student: 'bg-sky-100 text-sky-800',
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ orgs: 0, users: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);

  // Invite super admin
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/organisations').then(r => r.json()),
    ]).then(([ud, od]) => {
      setUsers(ud.users || []);
      setOrgs(od.organisations || []);
      setStats({ orgs: od.organisations?.length || 0, users: ud.users?.length || 0 });
    }).finally(() => setIsLoading(false));
  }, []);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteOrgId) return;
    setIsInviting(true);
    setInviteLink('');
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: 'super_admin', orgId: inviteOrgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLink(data.inviteUrl);
      toast({ title: 'Invite created!', description: 'Copy the link below and share it securely.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsInviting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Copied!', description: 'Invite link copied to clipboard.' });
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Platform Overview</h1>
        <p className="text-slate-400 mt-1">Super Admin — full platform visibility and control.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-purple-500/20 p-3 rounded-lg"><ShieldCheck className="text-purple-400 h-6 w-6" /></div>
          <div>
            <p className="text-slate-400 text-sm">Super Admins</p>
            <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'super_admin').length}</p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-lg"><Building2 className="text-blue-400 h-6 w-6" /></div>
          <div>
            <p className="text-slate-400 text-sm">Organisations</p>
            <p className="text-3xl font-bold text-white">{stats.orgs}</p>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-emerald-500/20 p-3 rounded-lg"><Users className="text-emerald-400 h-6 w-6" /></div>
          <div>
            <p className="text-slate-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-white">{stats.users}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All users table */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700 text-slate-100">
            <CardHeader>
              <CardTitle className="text-slate-100">All Platform Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-slate-500 text-sm">No users yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Org</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm text-slate-200">{u.full_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-400">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role] || ''}`}>
                              {u.role?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">{u.organisations?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invite Super Admin panel */}
        <div className="flex flex-col gap-4">
          <Card className="bg-slate-800 border-slate-700 text-slate-100">
            <CardHeader>
              <CardTitle className="text-slate-100">Invite Super Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteAdmin} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@platform.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    disabled={isInviting}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Organisation</label>
                  <select
                    value={inviteOrgId}
                    onChange={e => setInviteOrgId(e.target.value)}
                    className="w-full rounded-md bg-slate-700 border border-slate-600 text-white px-3 py-2 text-sm"
                    disabled={isInviting}
                  >
                    <option value="">Select an org...</option>
                    {orgs.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={isInviting || !inviteEmail || !inviteOrgId} className="w-full bg-purple-600 hover:bg-purple-700">
                  {isInviting ? 'Generating...' : 'Generate Invite Link'}
                </Button>
              </form>

              {inviteLink && (
                <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-400 mb-2">Share this link securely:</p>
                  <p className="text-xs text-emerald-400 break-all mb-3">{inviteLink}</p>
                  <Button size="sm" variant="outline" className="w-full border-slate-600" onClick={copyLink}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Link
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
