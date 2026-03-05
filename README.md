# Employee Leave & Absence Request System

Modern full-stack HR dashboard for leave and absence management.

## Stack

- Frontend: React + Vite + React Router + Tailwind CSS
- Backend: Vercel Serverless Functions (`api/[...path].js`)
- Database: Supabase PostgreSQL
- Auth: JWT + bcrypt
- Uploads: Supabase Storage (optional bucket: `request-files`)

## Local Run

1. Install frontend dependencies:
   - `cd client && npm install`
2. Start frontend:
   - `cd client && npm run dev`
3. Open frontend:
   - `http://localhost:5173`
4. API base URL:
   - set `VITE_API_URL` (example: `http://localhost:3001/api` for local backend or `/api` on Vercel)

## Seeded Accounts

- Admin: `admin@company.com` / `admin123`
- Employee: `john@company.com` / `employee123`
- Employee: `jane@company.com` / `employee123`

## Environment

Environment variables:

```
JWT_SECRET=<YOUR_API_KEY>
SUPABASE_URL=<YOUR_API_KEY>
SUPABASE_ANON_KEY=<YOUR_API_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_API_KEY>
SUPABASE_PROJECT_ID=<YOUR_API_KEY>
```
