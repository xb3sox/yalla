# [Jules] Platform: In-App Notification Center & User Preference Matrix

**Labels**: `backlog`, `platform`, `notifications`, `frontend`, `backend`
**Milestone**: Platform Engineering & User Experience

---

## Problem & Context
In addition to SMS and Web Push alerts, users require an in-app Notification Center (FR-044, FR-045) accessible from the main app navigation bar. This ensures users never miss critical updates regarding booking status changes, 24-hour attendance reconfirmation windows, waitlist promotions, host announcements, and loyalty point rewards.

---

## User Story
**As a** Yalla user,
**I want** an in-app Notification Center with unread counters and category filters,
**So that** I can review all my experience alerts, booking updates, and announcements in one organized view.

---

## Technical Architecture & Scope

### 1. Database Schema (`backend/src/models/notification.model.ts`)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_en VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200) NOT NULL,
  body_en TEXT NOT NULL,
  body_ar TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'booking', 'waitlist', 'reconfirmation', 'rewards', 'system'
  action_url VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
```

### 2. Notification API Endpoints (`backend/src/routes/inapp_notification.routes.ts`)
- `GET /api/v1/user/notifications`: Paginated list of notifications with unread count.
- `PATCH /api/v1/user/notifications/:id/read`: Mark single notification as read.
- `POST /api/v1/user/notifications/mark-all-read`: Mark all notifications for user as read.
- `GET /api/v1/user/preferences/notifications`: Fetch user notification channel preferences (Email, SMS, Push, In-App).
- `PATCH /api/v1/user/preferences/notifications`: Update channel preferences.

### 3. Frontend Component (`src/components/NotificationCenter.tsx`)
- Bell icon in header displaying dynamic unread badge count (e.g. `🔴 3`).
- Slide-over drawer / modal showing list of notifications sorted by recency.
- Tab filters: "All", "Bookings", "Waitlist", "Rewards".
- Language fallback handling with instant Arabic RTL rendering support.

---

## Acceptance Criteria
- [ ] In-app notification center renders unread badge counter dynamically.
- [ ] Users can filter notifications by category and mark single/all items as read.
- [ ] Clicking notification item navigates user to associated route (`action_url`).
- [ ] Granular notification preference matrix allows toggling individual channels (Email, SMS, Push) per notification category.
- [ ] Database queries optimize index lookups for fast sub-20ms response times.
- [ ] Full bilingual support (Arabic RTL / English LTR) with WCAG 2.2 AA screen reader accessibility (`aria-live="polite"`).

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/controllers/inapp_notification.controller.test.ts`.
- [ ] Add frontend component tests in `src/components/NotificationCenter.test.tsx`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Security**: Enforce strict user isolation (`WHERE user_id = req.user.id`); users must never be able to view or mark read notifications belonging to other accounts.
