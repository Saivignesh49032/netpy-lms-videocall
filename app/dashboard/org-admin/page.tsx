'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Building2, Users, BookOpen, GraduationCap } from 'lucide-react';

export default function OrgAdminDashboard() {
  const [stats, setStats] = useState({ staff: 0, students: 0, batches: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/directory?role=staff').then(r => r.json()),
      fetch('/api/directory?role=student').then(r => r.json()),
      fetch('/api/batches').then(r => r.json()),
    ]).then(([staffData, studentData, batchData]) => {
      setStats({
        staff: staffData.users?.length || 0,
        students: studentData.users?.length || 0,
        batches: batchData.batches?.length || 0,
      });
    }).catch(err => {
      toast({ title: 'Error loading data', description: err.message, variant: 'destructive' });
    }).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-800">Organisation Overview</h1>
        <p className="text-stone-500 mt-1">Manage your institution's staff, students, and curriculum.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-blue-500 rounded-r-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-lg"><Users className="text-blue-500 h-6 w-6" /></div>
          <div>
            <p className="text-stone-500 text-sm">Staff Members</p>
            <p className="text-3xl font-bold text-stone-900">{stats.staff}</p>
          </div>
        </div>
        <div className="bg-white border-l-4 border-emerald-500 rounded-r-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg"><GraduationCap className="text-emerald-500 h-6 w-6" /></div>
          <div>
            <p className="text-stone-500 text-sm">Students Enrolled</p>
            <p className="text-3xl font-bold text-stone-900">{stats.students}</p>
          </div>
        </div>
        <div className="bg-white border-l-4 border-amber-500 rounded-r-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg"><BookOpen className="text-amber-500 h-6 w-6" /></div>
          <div>
            <p className="text-stone-500 text-sm">Active Batches</p>
            <p className="text-3xl font-bold text-stone-900">{stats.batches}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-stone-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" className="border-stone-300" onClick={() => window.location.href = '/dashboard/org-admin/staff'}>
            <Users className="h-4 w-4 mr-2" /> Manage Staff
          </Button>
          <Button variant="outline" className="border-stone-300" onClick={() => window.location.href = '/dashboard/org-admin/students'}>
            <GraduationCap className="h-4 w-4 mr-2" /> Manage Students
          </Button>
          <Button variant="outline" className="border-stone-300" onClick={() => window.location.href = '/dashboard/org-admin/batches'}>
            <BookOpen className="h-4 w-4 mr-2" /> Manage Batches
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
