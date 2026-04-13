'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { GraduationCap } from 'lucide-react';

export default function StaffStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/directory?role=student')
      .then(r => r.json())
      .then(d => setStudents(d.users || []))
      .catch(err => toast({ title: 'Error', description: err.message, variant: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">My Students</h1>
        <p className="text-emerald-600">Students enrolled in your batches.</p>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-3 bg-white rounded-2xl border border-dashed border-emerald-200">
          <GraduationCap className="h-12 w-12 text-emerald-200" />
          <p className="text-emerald-700 font-medium">No students enrolled yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s: any) => (
                <tr key={s.id} className="hover:bg-emerald-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.full_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{s.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
