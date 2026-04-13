'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/hooks/useRole';

export interface Question {
  id: string;
  meeting_id: string;
  asked_by: string;
  text: string;
  upvotes: number;
  is_answered: boolean;
  is_pinned: boolean;
  created_at: string;
  users?: { full_name?: string; email?: string };
  question_replies?: Reply[];
}

export interface Reply {
  id: string;
  question_id: string;
  replied_by: string;
  text: string;
  created_at: string;
  users?: { full_name?: string; email?: string };
}

export function useQA(callId: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isStaffOrAbove } = useRole();
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!callId) return;
    try {
      const res = await fetch(`/api/questions?callId=${callId}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      if (data.meetingId) setMeetingId(data.meetingId);
    } catch (e) {
      console.error('Failed to fetch questions', e);
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  // Initial load + realtime subscription
  useEffect(() => {
    fetchQuestions();

    // Subscribe to Supabase Realtime for live updates
    const channel = supabase
      .channel(`qa-${callId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'questions',
      }, () => fetchQuestions())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'question_replies',
      }, () => fetchQuestions())
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId, fetchQuestions]);

  const postQuestion = async (text: string) => {
    if (!meetingId || !text.trim()) return;
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, text }),
    });
    // Realtime will refetch; no need for manual update
  };

  const performAction = async (questionId: string, action: 'upvote' | 'pin' | 'answer') => {
    await fetch('/api/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, action }),
    });
  };

  const postReply = async (questionId: string, text: string) => {
    if (!text.trim()) return;
    const supabase = createClient();
    await supabase.from('question_replies').insert({
      question_id: questionId,
      replied_by: user?.id,
      text,
    });
  };

  return {
    questions,
    meetingId,
    isLoading,
    isStaffOrAbove,
    postQuestion,
    performAction,
    postReply,
    refetch: fetchQuestions,
  };
}
