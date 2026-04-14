'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';

export default function OrganisationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const { toast } = useToast();

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/organisations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrgs(Array.isArray(data.organisations) ? data.organisations : []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast({ title: 'Success', description: 'Organisation created successfully.' });
      setNewOrgName('');
      fetchOrgs();
    } catch (err: any) {
      toast({ title: 'Failed to create', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Organisations</h1>
          <p className="text-gray-500">Manage multi-tenant institutions on the platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Organisations</CardTitle>
            </CardHeader>
            <CardContent>
              {orgs.length === 0 ? (
                <p className="text-sm text-gray-500">No organisations found.</p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orgs.map((org) => (
                        <tr key={org.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(org.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {org.users?.[0]?.count || 0}
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
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add Organisation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label htmlFor="organisation-name" className="text-sm font-medium block mb-1">Organisation Name</label>
                  <Input 
                    id="organisation-name"
                    placeholder="e.g. Harvard University" 
                    value={newOrgName} 
                    onChange={(e) => setNewOrgName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting || !newOrgName.trim()} className="w-full">
                  {isSubmitting ? 'Creating...' : 'Create Institution'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
