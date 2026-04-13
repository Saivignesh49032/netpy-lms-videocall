'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      // the directory API without 'role' parameter returns all users if super admin
      const res = await fetch('/api/directory');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users || []);
    } catch (err: any) {
      toast({ title: 'Error fetching users', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) return <div className="p-8 flex justify-center"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Users</h1>
        <p className="text-gray-500">Cross-organization directory of all registered accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500 text-sm">No users found on the platform yet.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Organization ID</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{u.full_name || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">{u.org_id || 'Platform Level'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.is_active ? 
                          <span className="text-emerald-500 font-semibold px-2">Active</span> : 
                          <span className="text-gray-400 font-semibold px-2">Inactive</span>
                        }
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
  );
}
