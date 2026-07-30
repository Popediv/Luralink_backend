# LuraLink Backend API Documentation

Welcome to the official API documentation for **LuraLink Backend**. This guide is designed for **Frontend (Web)** and **Mobile (iOS/Android)** developers building applications on top of the LuraLink platform.

---

## 1. General & Architecture Overview

- **Base URL**: `http://localhost:5000/api` (or environment-configured domain)
- **Content Type**: `application/json` (unless uploading files, which uses `multipart/form-data`)
- **Authentication**: JWT Bearer Tokens in header:
  ```http
  Authorization: Bearer <YOUR_JWT_TOKEN>
  ```
- **User Roles**:
  - `worker`: Healthcare professionals seeking and completing shifts.
  - `facility_admin`: Hospitals, clinics, and diagnostic centers posting shifts and managing escrows.
  - `platform_admin`: Administrators moderating verifications, disputes, and system configurations.

### Standard Response Format

**Success Response (`200 OK`, `201 Created`):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response (`400`, `401`, `403`, `404`, `409`, `500`):**
```json
{
  "success": false,
  "error": {
    "message": "Human readable error description",
    "code": "ERROR_CODE_STRING"
  }
}
```

---

## 2. Authentication (`/api/auth`)

### 2.1 Register User
- **Method**: `POST`
- **Path**: `/api/auth/signup`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "worker" // "worker" or "facility_admin" (default: "worker")
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "worker"
      }
    }
  }
  ```

### 2.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": 1,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "worker"
      }
    }
  }
  ```

---

## 3. Worker Profiles (`/api/workers`)

### 3.1 Get Worker Profile
- **Method**: `GET`
- **Path**: `/api/workers/:id`
- **Auth Required**: Yes (`worker`, `facility_admin`, `platform_admin`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "userId": 1,
      "skills": ["Emergency Care", "ICU", "Triage"],
      "latitude": 6.5244,
      "longitude": 3.3792,
      "availability": "available",
      "rating": 4.85,
      "createdAt": "2026-07-29T10:00:00.000Z",
      "user": {
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    }
  }
  ```

### 3.2 Update Worker Profile
- **Method**: `PATCH`
- **Path**: `/api/workers/:id`
- **Auth Required**: Yes (Worker self or `platform_admin`)
- **Request Body**:
  ```json
  {
    "skills": ["Emergency Care", "Pediatrics"],
    "availability": "available", // "available" or "busy"
    "latitude": 6.5244,
    "longitude": 3.3792
  }
  ```
- **Success Response (200 OK)**: Updated Worker profile object.

---

## 4. Facility Profiles (`/api/facilities`)

### 4.1 Get Facility Profile
- **Method**: `GET`
- **Path**: `/api/facilities/:id`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "userId": 2,
      "name": "St. Nicholas Hospital",
      "type": "hospital", // hospital / clinic / diagnostic_center
      "address": "57 Campbell Street, Lagos",
      "latitude": 6.4531,
      "longitude": 3.3958,
      "createdAt": "2026-07-29T10:00:00.000Z",
      "user": {
        "name": "Facility Admin",
        "email": "admin@stnicholas.com"
      }
    }
  }
  ```

### 4.2 Update Facility Profile
- **Method**: `PATCH`
- **Path**: `/api/facilities/:id`
- **Auth Required**: Yes (Facility self or `platform_admin`)
- **Request Body**:
  ```json
  {
    "name": "St. Nicholas Hospital Annex",
    "type": "hospital",
    "address": "Victoria Island, Lagos",
    "latitude": 6.4281,
    "longitude": 3.4219
  }
  ```
- **Success Response (200 OK)**: Updated Facility profile object.

---

## 5. Shifts (`/api/shifts`)

### 5.1 List Open Shifts
- **Method**: `GET`
- **Path**: `/api/shifts`
- **Auth Required**: Yes
- **Query Parameters**:
  - `status` (optional, default `"open"`): `open`, `assigned`, `in_progress`, `completed_pending_confirmation`, `completed`, `paid`
  - `specialty` (optional): Filter by specialty substring (case-insensitive)
  - `minPay`, `maxPay` (optional): Filter by hourly/shift pay rate
  - `from`, `to` (optional): ISO date filter on `startTime`
  - `page` (default `1`), `limit` (default `20`, max `100`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": 10,
          "facilityId": 1,
          "workerId": null,
          "title": "Night Duty ICU Nurse",
          "specialty": "ICU",
          "payRate": 45000,
          "latitude": 6.4531,
          "longitude": 3.3958,
          "startTime": "2026-08-01T20:00:00.000Z",
          "endTime": "2026-08-02T08:00:00.000Z",
          "status": "open",
          "facility": {
            "id": 1,
            "name": "St. Nicholas Hospital",
            "type": "hospital",
            "address": "57 Campbell Street, Lagos"
          }
        }
      ],
      "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
    }
  }
  ```

### 5.2 List My Facility Shifts
- **Method**: `GET`
- **Path**: `/api/shifts/mine`
- **Auth Required**: Yes (`facility_admin`)
- **Query Parameters**: `status` (optional)

### 5.3 Get Single Shift
- **Method**: `GET`
- **Path**: `/api/shifts/:id`
- **Auth Required**: Yes

### 5.4 Create Shift
- **Method**: `POST`
- **Path**: `/api/shifts`
- **Auth Required**: Yes (`facility_admin`)
- **Request Body**:
  ```json
  {
    "title": "Night Duty ICU Nurse",
    "specialty": "ICU",
    "payRate": 45000,
    "startTime": "2026-08-01T20:00:00.000Z",
    "endTime": "2026-08-02T08:00:00.000Z",
    "latitude": 6.4531,
    "longitude": 3.3958
  }
  ```

### 5.5 Update Shift
- **Method**: `PATCH`
- **Path**: `/api/shifts/:id`
- **Auth Required**: Yes (`facility_admin` owner, open shift only)

### 5.6 Delete Shift
- **Method**: `DELETE`
- **Path**: `/api/shifts/:id`
- **Auth Required**: Yes (`facility_admin` owner, open shift with 0 applications)
- **Response**: `204 No Content`

### 5.7 Mark Shift Complete (Worker Completion Handshake Step 1)
- **Method**: `PATCH`
- **Path**: `/api/shifts/:id/complete`
- **Auth Required**: Yes (`worker` assigned to the shift)
- **Prerequisite**: Shift must be `in_progress`.
- **Transitions Shift Status**: `in_progress` → `completed_pending_confirmation`.

### 5.8 Confirm Shift Complete (Facility Confirmation Handshake Step 2)
- **Method**: `PATCH`
- **Path**: `/api/shifts/:id/confirm`
- **Auth Required**: Yes (`facility_admin` shift owner)
- **Prerequisite**: Shift must be in `completed_pending_confirmation`.
- **Transitions Shift Status**: `completed_pending_confirmation` → `completed`.

---

## 6. Applications (`/api/applications`)

### 6.1 Apply to Shift
- **Method**: `POST`
- **Path**: `/api/shifts/:id/apply`
- **Auth Required**: Yes (`worker`)
- **Prerequisite**: Worker must have verified credentials (`license`, `government_id`, `photo`) and shift escrow must be `funded`.

### 6.2 List Shift Applicants
- **Method**: `GET`
- **Path**: `/api/shifts/:id/applicants`
- **Auth Required**: Yes (`facility_admin` shift owner)

### 6.3 Select / Accept Applicant
- **Method**: `PATCH`
- **Path**: `/api/applications/:id/select`
- **Auth Required**: Yes (`facility_admin` shift owner)
- **Behavior**: Accepts selected applicant, sets shift to `assigned`, and automatically rejects other applicants with notifications.

### 6.4 List My Applications
- **Method**: `GET`
- **Path**: `/api/applications/mine`
- **Auth Required**: Yes (`worker`)

---

## 7. Payments & Escrow (`/api/payments`)

### 7.1 List Payments
- **Method**: `GET`
- **Path**: `/api/payments`
- **Auth Required**: Yes (`facility_admin`, `platform_admin`)

### 7.2 Get Payment Details
- **Method**: `GET`
- **Path**: `/api/payments/:id`
- **Auth Required**: Yes

### 7.3 Initialize Escrow
- **Method**: `POST`
- **Path**: `/api/payments/initialize`
- **Auth Required**: Yes (`facility_admin`)
- **Request Body**:
  ```json
  {
    "shiftId": 10,
    "payerEmail": "admin@stnicholas.com",
    "amount": 45000
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "payment": {
        "id": 5,
        "shiftId": 10,
        "amount": 45000,
        "escrowStatus": "pending",
        "reference": "escrow_1753820000_1234"
      },
      "paystack": {
        "authorizationUrl": "https://checkout.paystack.com/...",
        "accessCode": "009230912",
        "reference": "escrow_1753820000_1234"
      }
    }
  }
  ```

### 7.4 Verify Escrow Payment
- **Method**: `POST`
- **Path**: `/api/payments/verify`
- **Auth Required**: Yes (`facility_admin`)
- **Request Body**:
  ```json
  {
    "reference": "escrow_1753820000_1234"
  }
  ```

### 7.5 Release Escrow
- **Method**: `POST`
- **Path**: `/api/payments/:id/release`
- **Auth Required**: Yes (`facility_admin`, `platform_admin`)
- **Prerequisite**: Escrow status must be `funded`. Automatically triggers Paystack transfer to worker.

---

## 8. Document Verification (`/api/verification`)

### 8.1 Upload Verification Document
- **Method**: `POST`
- **Path**: `/api/verification/upload`
- **Auth Required**: Yes
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `documentType`: `"license"`, `"government_id"`, or `"photo"`
  - `document`: File upload (Image / PDF)

### 8.2 List Pending Verifications
- **Method**: `GET`
- **Path**: `/api/verification/admin/pending`
- **Auth Required**: Yes (`platform_admin`)

### 8.3 Review Verification
- **Method**: `PATCH`
- **Path**: `/api/verification/admin/:id`
- **Auth Required**: Yes (`platform_admin`)
- **Request Body**:
  ```json
  {
    "decision": "approved", // "approved" or "rejected"
    "note": "Document clear and valid" // Required if rejected
  }
  ```

---

## 9. Ratings & Reviews (`/api/ratings`)

### 9.1 Submit Rating
- **Method**: `POST`
- **Path**: `/api/ratings`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "shiftId": 10,
    "toUserId": 1,
    "score": 5, // Integer 1-5
    "comment": "Exceptional care and punctual."
  }
  ```

### 9.2 Get User Ratings
- **Method**: `GET`
- **Path**: `/api/ratings/user/:userId`
- **Auth Required**: Yes

### 9.3 Get My Ratings
- **Method**: `GET`
- **Path**: `/api/ratings/my`
- **Auth Required**: Yes

---

## 10. Notifications (`/api/notifications`)

- `GET /api/notifications` – List user notifications (`?limit=10&offset=0&unreadOnly=true`)
- `GET /api/notifications/unread-count` – Get total unread count
- `GET /api/notifications/search` – Search notifications (`?query=shift&type=application`)
- `PATCH /api/notifications/mark-all-read` – Mark all as read
- `DELETE /api/notifications/all` – Clear all notifications
- `GET /api/notifications/:id` – Single notification
- `POST /api/notifications` – System notification creation
- `PATCH /api/notifications/:id/mark-read` – Mark one as read
- `DELETE /api/notifications/:id` – Delete single notification

---

## 11. Smart Matching (`/api/matching`)

### 11.1 Recommended Shifts for Worker
- **Method**: `GET`
- **Path**: `/api/matching/shifts`
- **Auth Required**: Yes (`worker`)
- **Query Parameters**: `limit` (1-50, default 20), `maxDistance` (1-500 km, default 50)

### 11.2 Recommended Workers for Shift
- **Method**: `GET`
- **Path**: `/api/matching/shifts/:shiftId/workers`
- **Auth Required**: Yes (`facility_admin` owner)

---

## 12. Dispute Resolution (`/api/disputes`)

### 12.1 Raise Dispute
- **Method**: `POST`
- **Path**: `/api/disputes`
- **Auth Required**: Yes (`worker` or `facility_admin` for completed shift)
- **Request Body**:
  ```json
  { "shiftId": 10 }
  ```

### 12.2 List Disputes
- **Method**: `GET`
- **Path**: `/api/disputes`
- **Auth Required**: Yes (`platform_admin`)
- **Query Parameters**: `ruled` (`true` or `false`)

### 12.3 Rule on Dispute
- **Method**: `PATCH`
- **Path**: `/api/disputes/:id/rule`
- **Auth Required**: Yes (`platform_admin`)
- **Request Body**:
  ```json
  {
    "ruling": "release_to_worker" // "release_to_worker" or "refund_facility"
  }
  ```

---

## 13. Paystack Webhook (`/api/webhooks/paystack`)

- **Method**: `POST`
- **Path**: `/api/webhooks/paystack`
- **Auth**: Paystack Header `x-paystack-signature` HMAC verification
- **Supported Events**:
  - `charge.success`: Automatically marks payment `escrowStatus` as `funded`.
  - `transfer.success`: Automatically marks payment `escrowStatus` as `released`.
