# [Jules] Phase 4: Host Self-Service Portal & Calendar Slot Management

**Labels**: `backlog`, `phase-4`, `host-portal`, `frontend`, `backend`
**Milestone**: Phase 4: Expansion & Scale (Q2 2027)

---

## Problem & Context
Currently, experience hosts rely on Yalla staff operations to schedule upcoming sessions, adjust max capacity, or view payout statements. As Yalla expands to hundreds of local experience hosts, a self-service Host Portal is necessary to allow verified hosts to manage their availability calendar, create upcoming experience instances, manage attendee rosters, and view earnings directly.

---

## User Story
**As a** verified host,
**I want** a dedicated Host Portal dashboard,
**So that** I can add experience session slots to my calendar, set attendee capacity limits, block unavailable dates, and view payout analytics.

---

## Technical Architecture & Scope

### 1. Host Dashboard Routes & RBAC (`backend/src/routes/host_portal.routes.ts`)
- Require authentication and `role === 'host' || role === 'admin'`.
- Endpoints:
  - `GET /api/v1/host/dashboard/summary`: Overall ratings, total earnings, upcoming sessions, total attendees served.
  - `GET /api/v1/host/experiences`: List experiences hosted by authenticated user.
  - `POST /api/v1/host/sessions`: Schedule new date/time instance for an experience.
  - `PATCH /api/v1/host/sessions/:id`: Modify session start time, max capacity, or cancellation status.
  - `GET /api/v1/host/payouts`: List historical payouts and pending revenue balance.

### 2. Frontend Host Console (`src/pages/HostPortal.tsx`)
- Tabbed interface:
  1. **Overview**: Key performance metrics (attendees, rating average, earnings).
  2. **Calendar**: Interactive calendar view showing scheduled session instances and seat utilization.
  3. **Attendees**: Searchable roster with real-time check-in PIN input and attendance status.
  4. **Earnings & Payouts**: Monthly breakdown of completed sessions and Stripe transfer status.

### 3. Business Safety Locks
- Hosts cannot reduce session capacity below the number of currently confirmed bookings.
- Hosts cannot cancel a session within 24 hours without triggering a staff operations safety review alert.

---

## Acceptance Criteria
- [ ] RBAC middleware enforces `requireRole(['host', 'admin'])` for all host portal endpoints.
- [ ] Host can create new experience session instances specifying date, start/end time, base price, and capacity.
- [ ] Attempting to reduce session capacity below `current_confirmed_count` returns HTTP 400 with a clear error payload.
- [ ] Calendar UI renders upcoming experience slots with seat utilization progress bars (e.g., "6 / 8 seats booked").
- [ ] Payout summary calculates net host revenue (base price minus platform commission percentage).
- [ ] Full bilingual support (Arabic RTL / English LTR) across all Host Portal screens.
- [ ] Automated tests pass with 100% success rate.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/controllers/host_portal.controller.test.ts`.
- [ ] Add frontend unit tests in `src/pages/HostPortal.test.tsx`.
- [ ] Verify test suite passes: `npm run typecheck`, `npm test -- tests/unit`, and `node evals/check.js`.

---

## SDLC & Security Guardrails
- **Data Isolation**: A host must only be able to view and manage experience instances that they own (`experience.host_id === req.user.id`). Enforce host ownership in database query WHERE clauses.
