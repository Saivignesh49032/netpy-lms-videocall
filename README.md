# Netpy LMS — Video Call Module

A **production-ready, plug-and-play video conferencing microservice** built for LMS platforms. Modelled after Zoom, this module provides real-time meetings, cloud recordings, scheduling, email invitations, a Q&A whiteboard panel, and a fully role-gated multi-tenant dashboard — all deployable as a standalone service that integrates with any existing LMS.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🎥 **Live Video & Audio** | HD real-time calls powered by Stream Video SDK |
| 🎙️ **Meeting Controls** | Screen share, mute/unmute, layout switching |
| 📹 **Cloud Recordings** | Auto-recorded sessions stored via Stream native cloud or self-hosted MinIO S3 |
| 📅 **Meeting Scheduler** | Schedule future meetings with date/time pickers |
| 📧 **Email Invitations** | Send invite links via Resend with role-based access control |
| 🗂️ **Recordings Library** | Browse and stream past recordings per-role |
| 📝 **Q&A Panel** | Real-time in-call Q&A with Stream Chat integration |
| 🖊️ **Whiteboard** | Collaborative whiteboard during meetings |
| 👥 **Multi-Tenant Dashboard** | Role-gated views for Super Admin, Org Admin, Staff, and Student |
| 🔐 **Authentication** | Email/password auth via Supabase with SSR session handling |
| 🔔 **Webhooks** | Stream.io event webhooks for recording lifecycle automation |

---

## ⚙️ Tech Stack

- **[Next.js 14](https://nextjs.org/)** — App Router, Server Actions, API Routes
- **[TypeScript](https://www.typescriptlang.org/)** — Fully typed codebase
- **[Stream Video SDK](https://getstream.io/video/)** — Real-time video, audio, and recording
- **[Stream Chat SDK](https://getstream.io/chat/)** — In-call Q&A messaging
- **[Supabase](https://supabase.com/)** — Postgres DB, Auth, Row-Level Security
- **[Resend](https://resend.com/)** — Transactional email for invite flows
- **[MinIO](https://min.io/)** *(optional)* — Self-hosted S3-compatible recording storage
- **[Tailwind CSS](https://tailwindcss.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** — UI layer

---

## 🗂️ Project Structure

```
├── app/
│   ├── api/             # API routes (auth, meetings, recordings, webhooks, invites, ...)
│   ├── dashboard/       # Role-gated dashboards (super-admin, org-admin, staff, student)
│   └── invite/          # Public invite accept flow
├── components/          # Shared UI (MeetingRoom, Sidebar, QAPanel, Whiteboard, ...)
├── hooks/               # Custom React hooks (useUser, useQA, useWhiteboard)
├── lib/                 # Utilities (Supabase client, email, S3, invite logic)
├── providers/           # StreamClientProvider (video + chat)
├── scripts/             # Dev/setup scripts for Stream & MinIO configuration
└── supabase_schema.sql  # Full Supabase DB schema
```

---

## 🛠️ Setup Guide

### 1. Prerequisites

- [Node.js](https://nodejs.org/en) v18+
- [npm](https://www.npmjs.com/)
- *(Optional for self-hosted recordings)* [Docker](https://www.docker.com/)

---

### 2. External Services

#### A. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase_schema.sql` (and optionally `supabase_recordings_schema.sql`) to create all tables
3. Go to **Project Settings → API** and copy your **Project URL**, **anon key**, and **service_role key**

#### B. Stream.io
1. Create an account at [getstream.io](https://getstream.io/video/)
2. Create a **Video & Audio** app
3. Copy your **API Key** and **API Secret**

#### C. Resend *(for email invitations)*
1. Create an account at [resend.com](https://resend.com)
2. Copy your **API Key**

---

### 3. Environment Variables

Create `.env.local` in the root directory:

```env
# Stream Video SDK
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Email (for invite flows)
RESEND_API_KEY=your_resend_api_key

# MinIO S3 (optional — for self-hosted recording storage)
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password123
MINIO_BUCKET=lms-recordings
```

> ⚠️ **Never commit `.env.local`** — it is already in `.gitignore`.

---

### 4. Installation

```bash
npm install
```

---

### 5. Database Setup

Apply the database schema in Supabase SQL Editor:

```bash
# Run supabase_schema.sql first (core tables)
# Then run supabase_recordings_schema.sql (recordings table)
```

---

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📹 Recording Setup (Optional)

Recordings work out-of-the-box using **Stream's native cloud storage**. For self-hosted storage via MinIO, use the provided setup script.

### Option A — Stream Native Cloud (Recommended for dev)

No extra setup needed. Stream stores recordings automatically.

### Option B — Self-Hosted MinIO S3

**Step 1:** Start MinIO with Docker:

```bash
docker run -d -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=password123 \
  -v minio_data:/data \
  minio/minio server /data --console-address ":9001"
```

**Step 2:** Expose MinIO publicly (required for Stream to push recordings) using [ngrok](https://ngrok.com/) or a similar tunnel:

```bash
# Two tunnels needed: one for MinIO, one for the app
ngrok http 9000   # MinIO
ngrok http 3000   # App (for webhooks)
```

**Step 3:** Run the setup script to configure Stream:

```bash
npx tsx scripts/setup-stream.ts \
  --minio-url=https://your-minio-ngrok-url \
  --webhook-url=https://your-app-ngrok-url/api/webhooks/stream
```

> This registers the MinIO bucket as external storage on Stream and configures the recording webhook.

---

## 👥 User Roles

| Role | Capabilities |
|---|---|
| **Super Admin** | Manage all organisations, users, meetings, and recordings |
| **Org Admin** | Manage their org's staff, students, batches, subjects, and meetings |
| **Staff** | Create and host meetings, view schedules and recordings |
| **Student** | Join meetings, view recordings, raise doubts |

---

## 📜 Scripts

| Script | Purpose |
|---|---|
| `scripts/setup-stream.ts` | Configures Stream external storage (MinIO) & webhook URL |
| `scripts/setup-stream-native.ts` | Configures Stream to use native cloud recording storage |
| `scripts/check-recordings.ts` | Checks recording status from Stream API |
| `scripts/debug-recordings.ts` | Debug helper for recording pipeline issues |
| `scripts/sync-recordings.ts` | Syncs Stream recording metadata into Supabase |

Run any script with:
```bash
npx tsx scripts/<script-name>.ts
```

---

## 📄 License

MIT
