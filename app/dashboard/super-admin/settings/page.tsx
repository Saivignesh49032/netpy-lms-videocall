'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Building2, ShieldCheck, Settings2 } from 'lucide-react';

export default function SuperAdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Platform Settings</h1>
        <p className="text-slate-400">Configure global platform behaviour and policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg"><ShieldCheck className="h-5 w-5 text-purple-400" /></div>
            <CardTitle className="text-slate-100 text-base">Authentication</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-2">
            <p>✅ Invite-only registration enabled</p>
            <p>✅ Email confirmation bypassed (admin creation)</p>
            <p>✅ RLS enforced across all tables</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg"><Building2 className="h-5 w-5 text-blue-400" /></div>
            <CardTitle className="text-slate-100 text-base">Multi-Tenancy</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-2">
            <p>✅ Tenant data isolation via RLS</p>
            <p>✅ Org-scoped user directories</p>
            <p>✅ Cross-org visibility for Super Admins</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg"><Users className="h-5 w-5 text-emerald-400" /></div>
            <CardTitle className="text-slate-100 text-base">Role Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-2">
            <p>Super Admin → Org Admin → Staff → Student</p>
            <p>✅ Strict capability matrix enforced</p>
            <p>✅ DB + API-level permission checks</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg"><Settings2 className="h-5 w-5 text-amber-400" /></div>
            <CardTitle className="text-slate-100 text-base">Features</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-400 text-sm space-y-2">
            <p>✅ Live whiteboard (GetStream)</p>
            <p>✅ Real-time Q&A panel (Supabase)</p>
            <p>✅ In-meeting chat</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
