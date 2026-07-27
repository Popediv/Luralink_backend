# LuraLink Backend

Healthcare worker shift marketplace — backend API.

## Tech Stack
- Node.js + Express (plain JavaScript, ESM `import`/`export` syntax)
- PostgreSQL + Prisma ORM (v6)
- JWT authentication with role-based access control (Worker / Facility Admin / Platform Admin)
- Cloudinary (credential document storage)
- Paystack (escrow payments) — in progress
- Firebase Cloud Messaging (notifications) — in progress

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL running locally, or a Supabase connection string

### Setup
```bash
git clone https://github.com/your-username/luralink_backend.git
cd luralink_backend
npm install
```

Copy `.env.example` to `.env` and fill in your own values:
```
DATABASE_URL=
JWT_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Generate the Prisma client and run migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Run the dev server
```bash
npm run dev
```
Visit `http://localhost:5000/health` to confirm it's running.

## Project Structure
```
src/
  config/       — db connection, env vars, paystack config
  controllers/  — request/response handling per resource
  routes/       — URL routing per resource
  services/     — business logic (matching, escrow, notifications, disputes)
  middleware/   — auth, role guards, error handling, file uploads
  jobs/         — scheduled tasks (dispute window checker)
  utils/        — logger, response formatter
  webhooks/     — Paystack payment confirmation
prisma/
  schema.prisma — database schema
```

## API Overview

| Resource | Base path | Auth required |
|---|---|---|
| Auth | `/api/auth` | No (signup/login are public) |
| Workers | `/api/workers` | Yes |
| Facilities | `/api/facilities` | Yes |
| Verification | `/api/verification` | Yes (admin routes require `platform_admin` role) |

Full endpoint-by-endpoint documentation is tracked separately (see Issue 14 — API documentation).

## Response Format
Every endpoint returns one of these two shapes:
```json
// success
{ "success": true, "data": { ... } }

// error
{ "success": false, "error": { "message": "...", "code": "..." } }
```

## Auth
Include the JWT from login/signup in every subsequent request:
```
Authorization: Bearer <token>
```

## Branching
- `main` — stable, protected (requires PR + review)
- `dev` — integration branch
- `feature/*` — individual work, branched off `dev`

## Team
- Person 1 — Auth, middleware, worker/facility profiles, credential verification
- Person 2 — Shift marketplace, matching engine, application flow, ratings
- Person 3 — Escrow payments, disputes, notifications, seed data

## Testing
Manual testing via Postman during development. 

## Deployment
- Backend: Render
- Database: Supabase (PostgreSQL)
