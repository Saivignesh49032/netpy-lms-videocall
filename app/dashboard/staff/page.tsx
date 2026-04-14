'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import MeetingCreationForm from '@/components/MeetingCreationForm';
import { Video, Calendar, GraduationCap } from 'lucide-react';

export default function StaffDashboard() {
  const [stats, setStats] = useState({ students: 0, batches: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getJsonOrThrow = async (response: Response) => {
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText ?? `Request failed with status ${response.status}`);
      }
      return data;
    };

    Promise.all([
      fetch('/api/directory?role=student').then(getJsonOrThrow),
      fetch('/api/batches').then(getJsonOrThrow),
    ]).then(([studentData, batchData]) => {
      setStats({
        students: studentData.users?.length || 0,
        batches: batchData.batches?.length || 0,
      });
    }).catch(err => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }).finally(() => setIsLoading(false));
  }, [toast]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-8">
      {showForm && <MeetingCreationForm onClose={() => setShowForm(false)} />}

      <div>
        <h1 className="text-3xl font-bold text-emerald-900">My Teaching Hub</h1>
        <p className="text-emerald-600 mt-1">Start a class, view your schedule, and track your students.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border-l-4 border-emerald-500 rounded-r-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-lg"><GraduationCap className="text-emerald-500 h-6 w-6" /></div>
          <div>
            <p className="text-stone-500 text-sm">My Students</p>
            <p className="text-3xl font-bold text-stone-900">{stats.students}</p>
          </div>
        </div>
        <div className="bg-white border-l-4 border-teal-500 rounded-r-xl p-6 shadow-sm flex items-center gap-4">
          <div className="bg-teal-50 p-3 rounded-lg"><Calendar className="text-teal-500 h-6 w-6" /></div>
          <div>
            <p className="text-stone-500 text-sm">Active Batches</p>
            <p className="text-3xl font-bold text-stone-900">{stats.batches}</p>
          </div>
        </div>
      </div>

      {/* Start a meeting CTA */}
      <button
        onClick={() => setShowForm(true)}
        className="block w-full text-left"
      >
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-8 rounded-2xl shadow-lg flex justify-between items-center group hover:shadow-xl transition-all">
          <div>
            <h3 className="text-2xl font-bold">Start Instant Class</h3>
            <p className="text-emerald-100 mt-1">Launch a live video session right now</p>
          </div>
          <div className="bg-white/20 group-hover:bg-white/30 p-4 rounded-full transition-all">
            <Video className="h-8 w-8" />
          </div>
        </div>
      </button>
    </div>
  );
}
