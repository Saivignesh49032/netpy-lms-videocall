-- -------------------------------------------------------------
-- Phase 1 MIGRATION SCRIPT FOR NETPY LMS VIDEO CALL RBAC
-- Run this script in your Supabase SQL Editor
-- -------------------------------------------------------------

-- Drop existing tables if they exist (Be careful! Only safe if resetting DB)
-- DROP TABLE IF EXISTS invite_tokens, notifications, question_replies, questions, meeting_invites, meetings, subjects, batch_members, batches, users, organisations CASCADE;

-- 1. Organisations (tenants)
CREATE TABLE organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_by uuid, -- Self-referential to users, will set constraint later or rely on app logic
  created_at timestamptz default now()
);

-- 2. Users (extends Supabase Auth)
CREATE TABLE users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text check (role in ('super_admin','org_admin','staff','student')),
  org_id uuid references organisations(id) on delete cascade,
  avatar_url text,
  phone text,
  is_active boolean default true,
  invited_by uuid references users(id) on delete set null,
  joined_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Note: now that users table exists, add FK to organisations
ALTER TABLE organisations ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) on delete set null;

-- 3. Batches / Classes
CREATE TABLE batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  org_id uuid references organisations(id) on delete cascade,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Batch Members
CREATE TABLE batch_members (
  batch_id uuid references batches(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  primary key (batch_id, user_id)
);

-- 5. Subjects / Courses
CREATE TABLE subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  org_id uuid references organisations(id) on delete cascade,
  created_by uuid references users(id) on delete set null
);

-- 6. Meetings (replaces existing lms_meetings)
CREATE TABLE meetings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  host_id uuid references users(id) on delete cascade,
  stream_call_id text,
  title text not null,
  subject_id uuid references subjects(id) on delete cascade,
  module text,
  topic text,
  subtopic text,
  description text,
  meeting_type text check (meeting_type in ('instant','scheduled')),
  status text check (status in ('scheduled','live','ended','cancelled')),
  scheduled_at timestamptz,
  duration_minutes int,
  recording_url text,
  created_at timestamptz default now()
);

-- 7. Meeting Invites (users or batches)
CREATE TABLE meeting_invites (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  batch_id uuid references batches(id) on delete cascade,
  invited_at timestamptz default now(),
  check (
    (user_id IS NOT NULL AND batch_id IS NULL) OR 
    (user_id IS NULL AND batch_id IS NOT NULL)
  )
);

-- 8. Q&A Questions
CREATE TABLE questions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references meetings(id) on delete cascade,
  asked_by uuid references users(id) on delete cascade,
  text text not null,
  upvotes int default 0,
  is_answered boolean default false,
  is_pinned boolean default false,
  created_at timestamptz default now()
);

-- 9. Q&A Replies
CREATE TABLE question_replies (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  replied_by uuid references users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- 10. Notifications
CREATE TABLE notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  body text,
  type text, 
  related_id uuid, -- no direct FK constraint so it can match multiple table types safely
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 11. Invite Tokens
CREATE TABLE invite_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text check (role in ('super_admin','org_admin','staff','student')),
  org_id uuid references organisations(id) on delete cascade,
  invited_by uuid references users(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- -------------------------------------------------------------
-- RLS (Row Level Security) Implementation Details
-- We will enable RLS for tenant isolation to ensure data from
-- one org cannot bleed into another.
-- -------------------------------------------------------------

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Utility func to extract current user role quickly inside RLS
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Utility func to get current user organization quickly inside RLS
CREATE OR REPLACE FUNCTION auth_user_org_id() RETURNS uuid AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;


-- Note: In MVP, using server-side service role client in API routes
-- avoids complex RLS loops. We have enabled RLS to prevent direct
-- API access via anon/authenticated roles unless proper policies exist.

-- Simple fallback policies allowing all authenticated users to read their own org's data
-- (These can be tightened as needed)

CREATE POLICY "Allow read on own org" ON organisations FOR SELECT TO authenticated
USING (id = auth_user_org_id() OR auth_user_role() = 'super_admin');

CREATE POLICY "Allow read on users in own org" ON users FOR SELECT TO authenticated
USING (org_id = auth_user_org_id() OR auth_user_role() = 'super_admin');

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated
USING (id = auth.uid());

CREATE POLICY "Allow read on bats in own org" ON batches FOR SELECT TO authenticated
USING (org_id = auth_user_org_id() OR auth_user_role() = 'super_admin');

CREATE POLICY "Allow read on subjects in own org" ON subjects FOR SELECT TO authenticated
USING (org_id = auth_user_org_id() OR auth_user_role() = 'super_admin');

CREATE POLICY "Allow read on meetings in own org" ON meetings FOR SELECT TO authenticated
USING (org_id = auth_user_org_id() OR auth_user_role() = 'super_admin');

CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Realtime needs replication for Q&A tables to work properly over channels
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE question_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Indexes for performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_batches_org_id ON batches(org_id);
CREATE INDEX idx_subjects_org_id ON subjects(org_id);
CREATE INDEX idx_meetings_org_id ON meetings(org_id);
CREATE INDEX idx_questions_meeting_id ON questions(meeting_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
