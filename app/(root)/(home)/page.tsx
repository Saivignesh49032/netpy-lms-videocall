'use client';

import { useState } from 'react';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import MeetingCreationForm from '@/components/MeetingCreationForm';
import { Button } from '@/components/ui/button';
import { Video, Plus, LogIn } from 'lucide-react';

export default function Home() {
  const { user, isStaffOrAbove, isLoaded } = useRole();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  // Redirect to /dashboard if authenticated
  if (isLoaded && user) {
    router.replace('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-6 p-8">
      {showForm && <MeetingCreationForm onClose={() => setShowForm(false)} />}

      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Netpy LMS</h1>
        <p className="text-gray-500 mt-2">Video Meet & Learn Platform</p>
      </div>

      <div className="flex gap-4">
        {isStaffOrAbove && (
          <Button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            <Plus className="h-4 w-4" /> New Meeting
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            const id = prompt('Enter Meeting ID or URL:');
            if (!id) return;
            const callId = id.includes('/') ? id.split('/').pop() : id;
            router.push(`/meeting/${callId}`);
          }}
          className="gap-2"
        >
          <LogIn className="h-4 w-4" /> Join Meeting
        </Button>
      </div>
    </div>
  );
}
