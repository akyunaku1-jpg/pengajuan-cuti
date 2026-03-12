# Employee Leave & Absence Request System

Full-stack web application for managing employee leave/absence requests with role-based dashboards for employees and admins.

## Tech Stack

- Frontend: React + Vite + React Router + Tailwind CSS
- Backend: Vercel Serverless Function (`api/[...path].js`)
- Database: Supabase PostgreSQL (`users`, `requests`)
- Authentication: JWT + bcrypt password hashing
- File Upload: Supabase Storage (`request-files` bucket by default)

## Project Structure

```text
echaweb/
|- api/
|  |- [...path].js                # Main serverless API (auth, users, requests)
|- client/
|  |- src/
|  |  |- components/              # Shared UI components
|  |  |- context/AuthContext.jsx  # Auth state, login, session restore
|  |  |- layouts/                 # Admin/Employee layouts
|  |  |- lib/api.js               # Axios API client
|  |  |- pages/                   # Login, admin pages, employee pages
|  |- package.json
|- server/
|  |- schema.sql                  # SQL schema reference
|  |- tests/                      # Utility tests
|- supabase/
|  |- schema.sql                  # Supabase schema reference
|- vercel.json                    # Build and rewrite config
|- package.json                   # Root deps for serverless API
```

## Main Features

- Login with email and password
- Forgot password flow (`Lupa Kata Sandi`) with:
  - email existence check
  - direct new password reset
  - bcrypt hashing before database update
- Employee features:
  - submit leave/absence request
  - upload supporting file (PDF/JPG/PNG)
  - view request history
  - view personal summary and profile
- Admin features:
  - approve/reject requests
  - see all requests and summary stats
  - view employees
  - create new user accounts

## API Overview

Base URL:
- Production (Vercel): `/api`
- Local frontend default: `http://localhost:3001/api` (or set `VITE_API_URL`)

Auth:
- `POST /auth/login`
- `GET /auth/me`
- `PATCH /auth/me`
- `POST /auth/reset-password` (`{ email, newPassword }` or `{ email, verifyOnly: true }`)

Admin:
- `POST /admin/users`

Requests:
- `GET /requests`
- `POST /requests`
- `PATCH /requests/:id/approve`
- `PATCH /requests/:id/reject`
- `GET /requests/summary`

Employees:
- `GET /employees`

## Environment Variables

Create environment variables in your Vercel project (and local `.env.local` where needed):

```env
JWT_SECRET=<YOUR_API_KEY>
SUPABASE_URL=<YOUR_API_KEY>
SUPABASE_ANON_KEY=<YOUR_API_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_API_KEY>
SUPABASE_PROJECT_ID=<YOUR_API_KEY>
SUPABASE_UPLOAD_BUCKET=request-files
```

Important for Vercel:
- Set these in Vercel Project Settings -> Environment Variables.
- `SUPABASE_SERVICE_ROLE_KEY` is recommended (the API also accepts `SUPABASE_SERVICE_KEY` as fallback).
- Bucket name must match exactly with `SUPABASE_UPLOAD_BUCKET` (no extra spaces).

## Supabase Storage Bucket Setup

If file upload fails with storage errors, create/check the bucket manually first.

### Option A: One-command setup script

From project root:

```bash
npm run setup:storage
```

Optional custom env file:

```bash
npm run setup:storage -- --env-path=.env.local
```

This script will:
- read `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY`), `SUPABASE_UPLOAD_BUCKET`
- check whether the bucket exists
- create it if missing (`public: true`, max 5MB, PDF/JPG/PNG MIME whitelist)

### Option B: Manual setup in Supabase dashboard

1. Open Supabase -> Storage -> Buckets.
2. Create a bucket with exact name from `SUPABASE_UPLOAD_BUCKET` (default: `request-files`).
3. Set bucket visibility to Public (for current `getPublicUrl` flow).
4. Ensure upload file limit is at least 5MB.
5. Ensure allowed MIME types include:
   - `application/pdf`
   - `image/jpeg`
   - `image/png`

## Local Development

1. Install dependencies
   - Root: `npm install`
   - Frontend: `npm --prefix client install`
2. Run frontend
   - `npm --prefix client run dev`
3. Build frontend
   - `npm --prefix client run build`
4. Deploy API + frontend through Vercel using `vercel.json` rewrites.

## Default Accounts (Example Seed)

- Admin: `admin@company.com`
- Employee: `john@company.com`
- Employee: `jane@company.com`

Passwords may vary by seed/reset script. If login fails, reset using your password reset flow or admin script.
