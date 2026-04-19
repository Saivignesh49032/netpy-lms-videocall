# 🎓 Netpy LMS Video Call Platform

A high-performance, multi-tenant LMS platform for video lectures, real-time collaboration, and secure recording management.

## 🚀 Key Features
- **Multi-Tenant Isolation**: Built-in Organization boundaries for Schools and Colleges.
- **GetStream Integration**: Enterprise-grade video calls with recording support.
- **MinIO Storage**: Secure, permanent S3-compatible storage for all meeting recordings.
- **LMS API Layer**: Headless endpoints for external portal integration.
- **Automated Communication**: SMTP-based invitation and scheduling emails.
- **Performance Hydration**: Zero-waterfall server-side auth for instant dashboard loading.

---

## 🛠️ Step-by-Step Setup

### 1. Supabase Initialization
1. Create a new project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy and paste the contents of `supabase_schema.sql` (found in root) and run it. This creates all tables and the invite system logic.
4. Go to **Project Settings > API** and copy your `URL`, `Anon Key`, and `Service Role Key`.

### 2. GetStream Setup
1. Create a free account at [GetStream.io](https://getstream.io).
2. Create a new "Video" project.
3. Copy your **API Key** and **Secret Key**.

### 3. Storage (MinIO)
The platform uses MinIO for permanent recording storage. Ensure you have **Docker** installed.
Run MinIO using this command:
```bash
docker run -d -p 9000:9000 -p 9001:9001 --name minio \
  -e MINIO_ROOT_USER=admin \
  -e MINIO_ROOT_PASSWORD=password123 \
  -v minio_data:/data minio/minio \
  server /data --console-address ":9001"
```
Log in to `http://localhost:9001` (admin/password123) and create a bucket named `lms-recordings`.

### 4. Emails (SMTP)
1. Use a Gmail account and enable **2-Step Verification**.
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Generate a password for "Mail" and "Other" (Netpy LMS).
4. Save the 16-character code.

### 5. Environment Variables
Copy `.env.example` to `.env.local` and fill in the keys you gathered above:
```bash
cp .env.example .env.local
```

### 6. Install & Run
```bash
npm install
npm run dev
```

---

## 📡 LMS API Documentation
The platform includes a built-in interactive developer lounge:
👉 Visit **`/dashboard/super-admin/api-docs`** after logging in as a Super Admin.

## 🗃️ Maintenance Scripts
- **Archive Sync**: Run `npx tsx sync-old-recordings.ts` to migrate legacy Stream CDN recordings to your local MinIO storage.

## 🏗️ Production Build
To verify production readiness:
```bash
npm run build
```
