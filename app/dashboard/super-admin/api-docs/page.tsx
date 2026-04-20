'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/button'; // Using Button as Badge fallback since badge.tsx isn't in ui/
import { Terminal, Lock, Video, FileText, Calendar, XCircle, Info, Cpu } from 'lucide-react';

const ENDPOINTS = {
  meetings: [
    {
      method: 'POST',
      path: '/api/lms/meetings/instant',
      title: 'Create Instant Meeting',
      desc: 'Starts a live session immediately and notifies invitees.',
      body: `{
  "title": "Introduction to Algebra",
  "host_email": "teacher@college.edu",
  "org_id": "uuid-of-org",
  "subject": "Mathematics",
  "module": "Module 1",
  "invited_emails": ["student1@college.edu"],
  "invited_batch_ids": ["batch-uuid-1"]
}`
    },
    {
      method: 'POST',
      path: '/api/lms/meetings/schedule',
      title: 'Schedule Meeting',
      desc: 'Creates a future meeting and sends automated email notifications.',
      body: `{
  "title": "Advanced Calculus",
  "host_email": "teacher@college.edu",
  "org_id": "uuid-of-org",
  "scheduled_at": "2026-04-25T10:00:00Z",
  "duration_minutes": 60,
  "invited_emails": ["student1@college.edu"]
}`
    },
    {
      method: 'GET',
      path: '/api/lms/meetings',
      title: 'List Meetings',
      desc: 'Fetch a paginated list of meetings for an organisation with filters.',
      params: '?org_id=uuid&status=scheduled&limit=20'
    },
    {
      method: 'GET',
      path: '/api/lms/meetings/[id]',
      title: 'Meeting Details',
      desc: 'Get full details of a meeting, including recording embed codes if available.',
      params: '?org_id=uuid-of-org'
    },
    {
      method: 'PATCH',
      path: '/api/lms/meetings/[id]/cancel',
      title: 'Cancel Meeting',
      desc: 'Cancels a scheduled meeting and optionally notifies participants.',
      body: `{
  "org_id": "uuid-of-org",
  "reason": "Technical issues",
  "notify_participants": true
}`
    }
  ],
  recordings: [
    {
      method: 'GET',
      path: '/api/lms/recordings',
      title: 'List All Recordings',
      desc: 'Retrieve all processed recordings for an organisation.',
      params: '?org_id=uuid&limit=10'
    },
    {
      method: 'GET',
      path: '/api/lms/recordings/[meeting_id]',
      title: 'Get Recording Embed',
      desc: 'Fetch secure embed URLs and play-ready iframe codes.',
      params: '?org_id=uuid-of-org'
    }
  ]
};

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'meetings' | 'recordings'>('meetings');

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Cpu className="h-10 w-10 text-emerald-400" /> LMS Integration Hub
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Connect your LMS to the Netpy Video Call Platform. Build, schedule, and manage high-quality video sessions programmatically.
        </p>
      </div>

      {/* Auth Section */}
      <Card className="bg-slate-900 border-emerald-500/20 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <CardHeader className="bg-slate-900/50 border-b border-emerald-500/10">
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-400" /> Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-300 mb-4">
            The LMS portal must include the <code className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">x-api-key</code> header in every single request.
          </p>
          <div className="bg-black rounded-lg p-5 border border-slate-700 font-mono text-sm group relative">
            <div className="absolute top-3 right-4 text-xs text-slate-500 uppercase tracking-widest font-bold">Request Header</div>
            <div className="text-emerald-400">x-api-key: <span className="text-slate-400 italic">your_lms_api_secret</span></div>
            <div className="text-emerald-400 mt-1">Content-Type: <span className="text-slate-400">application/json</span></div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm text-slate-400 italic bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
            <Info className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Missing or invalid keys will return a <code className="text-emerald-300">401 Unauthorized</code> response.</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-700 pb-px">
        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative ${
            activeTab === 'meetings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
             <Video className="h-4 w-4" /> Meetings API
          </div>
          {activeTab === 'meetings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />}
        </button>
        <button
          onClick={() => setActiveTab('recordings')}
          className={`pb-4 px-6 text-sm font-bold transition-all relative ${
            activeTab === 'recordings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
             <FileText className="h-4 w-4" /> Recordings API
          </div>
          {activeTab === 'recordings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />}
        </button>
      </div>

      {/* Endpoint Cards */}
      <div className="grid grid-cols-1 gap-6">
        {ENDPOINTS[activeTab].map((ep, idx) => (
          <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/30 transition-all group overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-md text-xs font-black tracking-tighter ${
                    ep.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 
                    ep.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 
                    'bg-orange-500/20 text-orange-400'
                  }`}>
                    {ep.method}
                  </div>
                  <code className="text-slate-200 font-bold tracking-tight">{ep.path}</code>
                </div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest">{ep.title}</h3>
              </div>
              
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {ep.desc}
              </p>

              {ep.params && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Query Parameters</h4>
                  <div className="bg-black/40 rounded p-3 text-xs font-mono text-blue-400 border border-slate-700">
                    {ep.params}
                  </div>
                </div>
              )}

              {ep.body && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">JSON Payload</h4>
                  <pre className="bg-black/40 rounded-lg p-4 text-xs font-mono text-emerald-300 border border-slate-700 overflow-x-auto">
                    {ep.body}
                  </pre>
                </div>
              )}
            </div>
            {/* Glossy accent */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 p-4 rounded-xl">
             <Terminal className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-white font-bold">Base API Path</h4>
            <p className="text-slate-500 text-sm underline decoration-emerald-500/30">https://your-domain.ngrok-free.dev</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-emerald-950 font-bold rounded-full text-xs animate-pulse">
           <div className="h-2 w-2 rounded-full bg-emerald-950" /> PRODUCTION API ACTIVE
        </div>
      </div>
    </div>
  );
}
