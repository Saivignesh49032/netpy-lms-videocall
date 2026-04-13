'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings2, Lock, Bell } from 'lucide-react';

export default function OrgAdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-800">Organisation Settings</h1>
        <p className="text-stone-500">Manage your institution's configuration and policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-stone-200">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-stone-100 p-2 rounded-lg"><Settings2 className="h-5 w-5 text-stone-600" /></div>
            <CardTitle className="text-stone-800 text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="text-stone-500 text-sm space-y-2">
            <p>✅ Organisation profile active</p>
            <p>✅ Invite-based onboarding</p>
            <p>✅ Multi-batch student grouping</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-stone-200">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-stone-100 p-2 rounded-lg"><Lock className="h-5 w-5 text-stone-600" /></div>
            <CardTitle className="text-stone-800 text-base">Access Control</CardTitle>
          </CardHeader>
          <CardContent className="text-stone-500 text-sm space-y-2">
            <p>✅ Staff can create meetings</p>
            <p>✅ Students can post Q&A questions</p>
            <p>✅ Only staff can pin/answer Q&A</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
