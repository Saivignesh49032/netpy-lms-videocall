'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Video, Calendar, X } from 'lucide-react';

interface Subject { id: string; name: string; code?: string; }

interface Props {
  onClose: () => void;
  onCreated?: (meeting: any) => void;
}

const getLocalDateTimeString = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function MeetingCreationForm({ onClose, onCreated }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsError, setSubjectsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<'instant' | 'scheduled'>('instant');
  const [subjectId, setSubjectId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setSubjectsError('');
        const res = await fetch('/api/subjects');

        if (!res.ok) {
          throw new Error(`Failed to load subjects (${res.status})`);
        }

        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setSubjects([]);
        setSubjectsError('Could not load subjects. You can still create a meeting without one.');
      }
    };

    loadSubjects();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          meetingType,
          subjectId: subjectId || null,
          scheduledAt: meetingType === 'scheduled' ? scheduledAt : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (!data.meeting) {
        toast({ title: 'Error', description: 'Meeting data missing.', variant: 'destructive' });
        return;
      }

      toast({ title: 'Meeting Created!', description: meetingType === 'instant' ? 'Joining now...' : 'Scheduled successfully.' });

      if (onCreated) onCreated(data.meeting);

      if (meetingType === 'instant') {
        router.push(`/meeting/${data.meeting.stream_call_id}`);
      } else {
        onClose();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <Video className="h-6 w-6" />
            <h2 className="text-xl font-bold">New Meeting</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Meeting type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => setMeetingType('instant')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                meetingType === 'instant' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Video className="h-4 w-4" /> Instant
            </button>
            <button
              type="button"
              onClick={() => setMeetingType('scheduled')}
              className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                meetingType === 'scheduled' ? 'bg-teal-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" /> Scheduled
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Meeting Title *</label>
            <Input
              placeholder="e.g. Chapter 5 — Quadratic Equations"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject (optional)</label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white"
              disabled={isSubmitting}
            >
              <option value="">Select a subject...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.code ? `[${s.code}] ` : ''}{s.name}</option>
              ))}
            </select>
            {subjectsError && <p className="mt-1 text-xs text-amber-600">{subjectsError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description (optional)</label>
            <Input
              placeholder="Brief agenda or notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Scheduled date/time */}
          {meetingType === 'scheduled' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Scheduled Date & Time *</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                disabled={isSubmitting}
                min={getLocalDateTimeString()}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={isSubmitting || !title.trim() || (meetingType === 'scheduled' && !scheduledAt)}
            >
              {isSubmitting ? 'Creating...' : meetingType === 'instant' ? '🚀 Start Now' : '📅 Schedule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
