-- Netpy LMS Video Call Platform - Supabase Schema
-- Run this in the Supabase SQL Editor to initialize your database.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organisations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid -- Points to the Super Admin who created it
);

-- Users profile table (Public record of Auth users)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    full_name text,
    avatar_url text,
    role text NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'staff', 'student')),
    org_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Invite Tokens (For organization onboarding)
CREATE TABLE IF NOT EXISTS public.invite_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    role text NOT NULL,
    org_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
    invited_by uuid REFERENCES public.users(id),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Batches / Classes
CREATE TABLE IF NOT EXISTS public.batches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
    host_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    stream_call_id text NOT NULL UNIQUE,
    title text NOT NULL,
    description text,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
    module text,
    topic text,
    subtopic text,
    meeting_type text NOT NULL CHECK (meeting_type IN ('instant', 'scheduled')),
    status text NOT NULL DEFAULT 'live',
    scheduled_at timestamptz,
    duration_minutes integer,
    cancelled_reason text,
    recording_url text, -- Final S3/MinIO key or Stream URL
    created_at timestamptz DEFAULT now()
);

-- Meeting Invites (Linking meetings to specific students/staff)
CREATE TABLE IF NOT EXISTS public.meeting_invites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(meeting_id, user_id)
);

-- Recordings table (Legacy tracking, mostly mirrored in meetings now)
CREATE TABLE IF NOT EXISTS public.recordings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id uuid REFERENCES public.meetings(id) ON DELETE CASCADE,
    stream_record_id text,
    file_key text, -- MinIO S3 Key
    created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    type text,
    related_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Audit Log (For LMS API monitoring)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    action text NOT NULL,
    org_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
    endpoint text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- 3. Atomic Recruitment Function (The Invite Token Consumer)
CREATE OR REPLACE FUNCTION public.consume_invite_token_and_create_user_profile(
    p_token text,
    p_user_id uuid,
    p_email text,
    p_full_name text
) RETURNS void AS $$
DECLARE
    v_role text;
    v_org_id uuid;
    v_token_id uuid;
BEGIN
    -- 1. Validate and lock the token
    SELECT id, role, org_id INTO v_token_id, v_role, v_org_id
    FROM public.invite_tokens
    WHERE token = p_token
      AND used_at IS NULL
      AND expires_at > now()
    FOR UPDATE;

    IF v_token_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired token.';
    END IF;

    -- 2. Create the profile
    INSERT INTO public.users (id, email, full_name, role, org_id)
    VALUES (p_user_id, p_email, p_full_name, v_role, v_org_id)
    ON CONFLICT (id) DO UPDATE
    SET full_name = p_full_name,
        role = v_role,
        org_id = v_org_id,
        updated_at = now();

    -- 3. Mark token as used
    UPDATE public.invite_tokens
    SET used_at = now()
    WHERE id = v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 5. Standard RLS Policies (Basic examples, can be hardened further)
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all organisation users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users AS u WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'org_admin'))
);

-- (Add more policies as per project needs)
