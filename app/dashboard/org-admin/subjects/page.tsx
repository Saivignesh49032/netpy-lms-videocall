'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';

export default function OrgAdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubjects(data.subjects || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Subject created!' });
      setName(''); setCode('');
      fetchSubjects();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Subjects / Courses</h1>
        <p className="text-gray-500">Add subjects to your institution. Staff can tag meetings to subjects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Subject Catalogue</CardTitle></CardHeader>
            <CardContent>
              {subjects.length === 0 ? <p className="text-gray-500 text-sm">No subjects added yet.</p> : (
                <div className="rounded border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                      {subjects.map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-6 py-4 text-sm font-mono text-gray-500">{s.code || '—'}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Add Subject</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Subject Name *</label>
                <Input placeholder="e.g. Advanced Mathematics" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Subject Code</label>
                <Input placeholder="e.g. MATH301" value={code} onChange={e => setCode(e.target.value)} disabled={isSubmitting} />
              </div>
              <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full">
                {isSubmitting ? 'Adding...' : 'Add Subject'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
