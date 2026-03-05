# Employee Leave & Absence Request System

Modern full-stack HR dashboard for leave and absence management.

## Stack

- Frontend: React + Vite + React Router + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite with `better-sqlite3`
- Auth: JWT + bcrypt
- Uploads: Multer
- Dev run: `npm run dev` (frontend and backend together)

## Local Run

1. Install dependencies:
   - `yarn install`
   - `yarn --cwd client install`
   - `yarn --cwd server install`
2. Start both apps:
   - `npm run dev`
3. Open frontend:
   - `http://localhost:5173`
4. Backend API:
   - `http://localhost:3001`

## Seeded Accounts

- Admin: `admin@company.com` / `admin123`
- Employee: `john@company.com` / `employee123`
- Employee: `jane@company.com` / `employee123`

## Environment

`server/.env`:

```
JWT_SECRET=<YOUR_API_KEY>
PORT=3001
```
