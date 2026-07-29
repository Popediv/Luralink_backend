# LuraLink Backend

Healthcare worker shift marketplace — backend API.

## Tech Stack
- **Runtime & Framework**: Node.js + Express (ESM `import`/`export` syntax)
- **Database & ORM**: PostgreSQL + Prisma ORM (v6)
- **Authentication**: JWT authentication with role-based access control (`worker`, `facility_admin`, `platform_admin`)
- **Cloud Storage**: Cloudinary (credential document storage)
- **Payments**: Paystack (escrow funding, verification, payout webhook)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL running locally or via cloud connection string (e.g., Supabase)

### Setup
```bash
git clone https://github.com/Popediv/Luralink_backend.git
cd luralink_backend
npm install
```

Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### Database Migration & Seeding
```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed demo data (creates sample admin, facilities, workers, shifts, and payments)
npm run seed
```

### Start Development Server
```bash
npm run dev
```
Health check endpoint: `http://localhost:5000/health`

---

## API Overview

| Module | Base Path | Description | Access |
|---|---|---|---|
| **Auth** | `/api/auth` | User registration & JWT login | Public |
| **Workers** | `/api/workers` | Worker profiles & availability management | Authenticated |
| **Facilities** | `/api/facilities` | Facility profiles & details | Authenticated |
| **Shifts** | `/api/shifts` | Shift creation, search, & completion confirmation | Role-based |
| **Applications** | `/api/applications` | Worker applications & facility selection | Role-based |
| **Payments** | `/api/payments` | Paystack escrow initialization, verification, release & refund | Role-based |
| **Verification** | `/api/verification` | Worker credential document uploads & admin review | Role / Admin |
| **Ratings** | `/api/ratings` | Shift rating submissions & user rating history | Authenticated |
| **Matching** | `/api/matching` | AI shift recommendation & candidate worker matching | Role-based |
| **Notifications** | `/api/notifications` | User notification management & unread counters | Authenticated |
| **Disputes** | `/api/disputes` | Dispute creation & admin arbitration | Role / Admin |

---

## Standard API Response Format

```json
// Success Response
{
  "success": true,
  "data": { ... }
}

// Error Response
{
  "success": false,
  "error": {
    "message": "Human readable error message",
    "code": "ERROR_CODE_STRING"
  }
}
```

---

## Authentication
Include the JWT token returned during login/signup in the request header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Testing Guide

### Seeded Credentials for Testing

| Role | Email | Password | Purpose |
|---|---|---|---|
| Platform Admin | `admin@luralink.com` | `Admin1234!` | Admin verification, payment release/refund, dispute ruling |
| Facility Admin | `ops@medicore.com` | `Facility123!` | Create shifts, fund escrow, select worker applications |
| Worker | `amara@workers.com` | `Worker123!` | Browse recommended shifts, apply, mark shift completed |

### Core Testing Workflows

#### 1. Authentication & Profile Setup
- `POST /api/auth/signup` - Register new worker or facility admin
- `POST /api/auth/login` - Receive bearer token

#### 2. Worker Verification Flow
- `POST /api/verification/upload` - Upload license, government ID, or photo (Multipart Form Data, key: `document`)
- `GET /api/verification/admin/pending` (Admin token) - View pending documents
- `PATCH /api/verification/admin/:id` (Admin token) - Review doc (`{ "decision": "approved" }`)

#### 3. Shift Posting & Escrow Funding Flow
- `POST /api/shifts` (Facility token) - Create new shift listing
- `POST /api/payments/shift/:shiftId/initialize` (Facility token) - Initialize Paystack escrow transaction
- `GET /api/payments/shift/:shiftId/verify` (Facility token) - Verify escrow payment status

#### 4. Matching & Application Flow
- `GET /api/matching/shifts` (Worker token) - Get AI-matched shift recommendations
- `POST /api/shifts/:id/apply` (Worker token) - Submit application for open shift
- `GET /api/shifts/:id/applicants` (Facility token) - View shift applicants
- `PATCH /api/applications/:id/select` (Facility token) - Accept worker application for shift

#### 5. Shift Completion & Payment Release Handshake
- `PATCH /api/shifts/:id/complete` (Worker token) - Mark completed (`completed_pending_confirmation`)
- `PATCH /api/shifts/:id/confirm` (Facility token) - Confirm completion (`completed`)
- `POST /api/payments/shift/:shiftId/release` (Admin token) - Release escrow payout to worker (`paid`)

#### 6. Ratings & Dispute Escalation
- `POST /api/ratings` (Worker/Facility token) - Rate counterparty after shift completion
- `POST /api/disputes` (Worker/Facility token) - Open dispute on completed shift
- `PATCH /api/disputes/:id/rule` (Admin token) - Admin ruling (`release_to_worker` or `refund_facility`)

---

## Deployment Configuration
- **Backend API**: Render / Railway (Node.js environment)
- **Database**: Supabase / Neon / AWS RDS (PostgreSQL)
- **Storage**: Cloudinary
