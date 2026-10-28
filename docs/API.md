# Yalla REST API Specification

Reference for Yalla API endpoints mounted at `/api/v1/`.

---

## 1. Conventions

- **Base URL**: `http://localhost:3000/api/v1` (configurable via `API_VERSION` / `PORT`)
- **Sessions**: access tokens are short-lived (15 min default) and delivered in an
  HttpOnly cookie. `POST /auth/refresh` rotates a single-use refresh token; a
  replayed token revokes every session for that user. `POST /auth/logout`
  revokes the presented refresh token server-side.
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>`
- **Response Format**:

  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional status message"
  }
  ```

- **Error Format**:

  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "details": []
    }
  }
  ```

---

## 2. Endpoints Overview (84 route handlers)

### 2.1 Authentication (`/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new user account |
| POST | `/auth/login` | Public | Authenticate user, set refresh cookie, return JWT |
| POST | `/auth/refresh` | Public (Cookie) | Issue new access token using refresh token |
| POST | `/auth/logout` | Authenticated | Clear auth cookies |
| GET | `/auth/me` | Authenticated | Fetch authenticated user profile |
| PUT | `/auth/preferences` | Authenticated | Update language, area, budget and accessibility preferences |
| GET | `/auth/export` | Authenticated | Export the authenticated user's data (PDPL) |
| DELETE | `/auth/account` | Authenticated | Delete (deactivate) the authenticated user's account |

### 2.2 Experiences (`/experiences`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/experiences` | Public | List published experiences (filter by category, city, date) |
| GET | `/experiences/:id` | Public | Get single experience details |
| POST | `/experiences` | Staff / Admin | Create new experience |
| PUT | `/experiences/:id` | Staff / Admin | Update experience |
| DELETE | `/experiences/:id` | Admin | Delete experience |
| GET | `/experiences/recommendations` | Authenticated | Get personalized recommendations (O(N) Set lookup) |

### 2.3 Reservations (`/reservations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/reservations` | Authenticated | Create pending reservation |
| GET | `/reservations/my` | Authenticated | List current user reservations |
| GET | `/reservations/:id` | Authenticated | Get reservation details |
| POST | `/reservations/:id/cancel` | Authenticated | Cancel reservation |
| POST | `/reservations/:id/reconfirm` | Authenticated | Reconfirm attendance (24h before event) |
| GET | `/reservations/:id/arrival` | Authenticated | Fetch venue coordinates & dynamic check-in PIN |
| POST | `/reservations/waitlist` | Authenticated | Join waitlist for full experience |
| GET | `/reservations/waitlist/my` | Authenticated | List user waitlist entries |
| DELETE | `/reservations/waitlist/:id` | Authenticated | Leave waitlist |
| POST | `/reservations/:id/material-changes/accept` | Authenticated | Accept itinerary changes |

### 2.4 Payments (`/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/intent` | Authenticated | Create Stripe payment intent for reservation |
| POST | `/payments/confirm` | Authenticated | Confirm payment and transition reservation state |
| POST | `/payments/webhook` | Public (Stripe Sig) | Handle Stripe asynchronous events |
| GET | `/payments/:reservationId` | Authenticated | Get payment record for reservation |

### 2.5 Host Portal (`/host`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/host/experiences` | Host | List assigned experiences for host |
| GET | `/host/experiences/:id/roster` | Host | View attendee list and status |
| POST | `/host/check-in` | Host | Verify attendee arrival PIN |

### 2.6 Feedback (`/feedbacks`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/feedbacks` | Authenticated | Submit post-experience feedback |
| GET | `/feedbacks/experience/:experienceId` | Public | Get verified reviews for experience |

### 2.7 Rewards & Loyalty (`/rewards`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/rewards/balance` | Authenticated | Get user points balance and tier |
| GET | `/rewards/history` | Authenticated | View points transaction log |
| POST | `/rewards/redeem` | Authenticated | Redeem points for discount voucher |

### 2.8 Favorites & Social (`/favorites`, `/blocks`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/favorites` | Authenticated | List saved experiences |
| POST | `/favorites/:experienceId` | Authenticated | Bookmark experience |
| DELETE | `/favorites/:experienceId` | Authenticated | Remove bookmark |
| GET | `/blocks` | Authenticated | List blocked users |
| POST | `/blocks/:userId` | Authenticated | Block a user from matching groups |
| DELETE | `/blocks/:userId` | Authenticated | Unblock user |

### 2.9 Staff Operations (`/staff`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/staff/dashboard` | Staff / Admin | Operational metrics and KPIs |
| GET | `/staff/experiences` | Staff / Admin | Manage plan schedules |
| POST | `/staff/assign-host` | Staff / Admin | Assign host to experience |
| POST | `/staff/assign-venue` | Staff / Admin | Assign venue |
| GET | `/staff/attendance/:experienceId` | Staff / Admin | Attendance report |
| POST | `/staff/export/reservations` | Staff / Admin | Export reservations (CSV / Excel) |
| POST | `/staff/override-capacity` | Admin | Override attendee limit |

### 2.10 Safety & Trust (`/safety-cases`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/safety-cases` | Authenticated | File an incident report |
| GET | `/safety-cases` | Safety Staff / Admin | List open cases (restricted access) |
| GET | `/safety-cases/:id` | Safety Staff / Admin | View incident details |
| PUT | `/safety-cases/:id/status` | Safety Staff / Admin | Transition status (review, resolve, dismiss) |
| POST | `/safety-cases/:id/notes` | Safety Staff / Admin | Add private investigation notes |
| POST | `/safety-cases/:id/restrict-user` | Admin | Ban or restrict user account |
| GET | `/safety-cases/stats` | Admin | Safety incident frequency stats |

### 2.11 Support Requests (`/support-requests`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/support-requests` | Authenticated | Open support ticket |
| GET | `/support-requests/my` | Authenticated | List user tickets |
| GET | `/support-requests` | Staff / Admin | Staff ticket inbox |
| PUT | `/support-requests/:id/reply` | Staff / Admin | Respond to ticket |
| PUT | `/support-requests/:id/close` | Staff / Admin | Close ticket |

### 2.12 Notifications (`/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/notifications` | Authenticated | List in-app notifications |
| PUT | `/notifications/:id/read` | Authenticated | Mark notification read |
| PUT | `/notifications/read-all` | Authenticated | Mark all notifications read |
| DELETE | `/notifications/:id` | Authenticated | Dismiss notification |
| GET | `/notifications/preferences` | Authenticated | Get email/SMS/Push preferences |
| PUT | `/notifications/preferences` | Authenticated | Update notification channels |
| POST | `/notifications/broadcast` | Admin | Send announcement to users |
| POST | `/notifications/test` | Admin | Test dispatch (Twilio/SES) |

### 2.13 Audit & Health (`/audit`, `/health`, `/metrics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/audit` | Admin | Query immutable audit log with filters |
| GET | `/audit/export` | Admin | Export audit records for compliance |
| GET | `/health` | Public | System health status (generic 200/503) |
| GET | `/metrics` | Public | Prometheus/operational system metrics |
