'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Copy, UserPlus, Check } from 'lucide-react';

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  org_admin: 'bg-blue-100 text-blue-800',
  staff: 'bg-emerald-100 text-emerald-800',
  student: 'bg-sky-100 text-sky-800',
};

const INVITE_ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full platform access' },
  { value: 'org_admin', label: 'Org Admin', desc: 'Manages an organisation' },
  { value: 'staff', label: 'Staff / Teacher', desc: 'Runs classes and meetings' },
  { value: 'student', label: 'Student', desc: 'Attends sessions' },
];

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('org_admin');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, orgsRes] = await Promise.all([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/organisations').then(r => r.json()),
      ]);
      setUsers(usersRes.users ?? []);
      setInvites(usersRes.invites ?? []);
      setOrgs(orgsRes.organisations ?? []);
    } catch {
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resendInvite = async (inviteId: string) => {
    setResendingId(inviteId);
    try {
      const res = await fetch('/api/invites/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Success', description: 'Invitation email resent!' });
    } catch (err: any) {
      toast({ title: 'Resend failed', description: err.message, variant: 'destructive' });
    } finally {
      setResendingId(null);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    // super_admin doesn't need an org
    const needsOrg = !['super_admin'].includes(inviteRole);
    if (needsOrg && !inviteOrgId) {
      toast({ title: 'Select an organisation', variant: 'destructive' });
      return;
    }

    setIsInviting(true);
    setInviteLink('');
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          orgId: inviteOrgId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create invite');

      if (data?.inviteUrl) {
        const fullLink = data.fullInviteUrl ?? `${window.location.origin}${data.inviteUrl}`;
        setInviteLink(fullLink);
        setInviteEmail('');
        
        if (data.emailSent) {
          toast({ title: '✅ Invite sent!', description: 'Email sent successfully.' });
        } else {
          toast({ 
            title: '⚠️ Email Failed (Link Ready)', 
            description: 'The invite link was created, but the email could not be sent (likely due to Resend testing limits). Please copy and share the link below manually.',
            variant: 'default',
          });
        }
        fetchData();
      } else {
        throw new Error('Failed to generate invite link from server response.');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsInviting(false);
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

  const needsOrg = !['super_admin'].includes(inviteRole);

  if (isLoading) return <div className="flex justify-center p-8"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Platform Users</h1>
        <p className="text-slate-400">Invite and manage all users across the platform.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users & Invites Tables */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="text-slate-100">All Active Users ({users.length})</CardTitle></CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-slate-500 text-sm">No active users on the platform yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="min-w-full divide-y divide-slate-700 text-sm">
                    <thead className="bg-slate-900">
                      <tr>
                        {['Name', 'Email', 'Role', 'Organisation'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-slate-200 font-medium">{u.full_name || '—'}</td>
                          <td className="px-4 py-3 text-slate-400">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-600'}`}>
                              {(u.role ?? '').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 truncate max-w-[120px]">
                            {u.organisations?.name || 'Platform Level'}
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
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="text-slate-100">Pending Invitations ({invites.length})</CardTitle></CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <p className="text-slate-500 text-sm">No pending invitations.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="min-w-full divide-y divide-slate-700 text-sm">
                    <thead className="bg-slate-900">
                      <tr>
                        {['Email', 'Role', 'Org', 'Expires', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {invites.map((inv: any) => (
                        <tr key={inv.id} className="hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-slate-200">{inv.email}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[inv.role]}`}>
                              {(inv.role ?? '').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 truncate max-w-[100px]">
                            {inv.organisations?.name || 'Platform'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              disabled={resendingId === inv.id}
                              className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 font-semibold text-xs h-8"
                              onClick={() => resendInvite(inv.id)}
                            >
                              {resendingId === inv.id ? '...' : 'Resend'}
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

        {/* Invite Panel */}
        <div>
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-purple-400" /> Invite User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                {/* Role Select */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Role</label>
                  <div className="grid grid-cols-1 gap-2">
                    {INVITE_ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => { setInviteRole(r.value); setInviteOrgId(''); }}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          inviteRole === r.value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-200">{r.label}</p>
                        <p className="text-xs text-slate-500">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                    disabled={isInviting}
                    required
                  />
                </div>

                {/* Organisation (hidden for super_admin role) */}
                {needsOrg && (
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Organisation</label>
                    <select
                      value={inviteOrgId}
                      onChange={e => setInviteOrgId(e.target.value)}
                      className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100"
                      disabled={isInviting}
                    >
                      <option value="">Select an org...</option>
                      {orgs.map((org: any) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isInviting || !inviteEmail || (needsOrg && !inviteOrgId)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isInviting ? 'Sending Invite...' : 'Send Invite Email'}
                </Button>
              </form>

              {/* Generated Link */}
              {inviteLink && (
                <div className="mt-4 rounded-lg border border-slate-600 bg-slate-900 p-3">
                  <p className="text-xs text-slate-400 mb-2">Share this link as backup:</p>
                  <p className="break-all text-xs text-emerald-400 mb-3">{inviteLink}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300"
                    onClick={copyLink}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2 text-emerald-400" /> : <Copy className="h-4 w-4 mr-2" />}
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
