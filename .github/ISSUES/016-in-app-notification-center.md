# [Jules] Platform: In-App Notification Center & User Preference Matrix

**Labels**: `backlog`, `platform`, `notifications`, `frontend`, `backend`, `jules`
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

### 1. Database Schema Extension (`backend/src/models/notification.model.ts`)
To avoid collision with the existing `notifications` table (`id, recipient_id, type, state, title, title_ar, body, body_ar, created_at, sent_at, delivered_at, updated_at`), extend the table via migration:

```sql
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS action_url VARCHAR(255), 
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
  ON notifications(recipient_id, read_at, created_at DESC);
```

### 2. Notification API Endpoints & Payload Alignment (`backend/src/routes/inapp_notification.routes.ts`)
- `GET /api/v1/user/notifications`: Paginated list of notifications for the authenticated user (`WHERE recipient_id = req.user.id`), with unread count (`WHERE read_at IS NULL`).
  Response items align directly with table columns:
  ```json
  {
    "id": "c1f7b820-9bf7-4c8d-8fd2-fb02bb7e296c",
    "recipient_id": "usr_99812",
    "type": "reconfirmation",
    "state": "delivered",
    "title": "Attendance Reconfirmation Required",
    "title_ar": "مطلوب تأكيد الحضور",
    "body": "Your experience starts in 24 hours. Tap to reconfirm your attendance.",
    "body_ar": "تجربتك تبدأ بعد 24 ساعة. اضغط لتأكيد حضورك.",
    "action_url": "/arrival/res_67890",
    "read_at": null,
    "created_at": "2027-01-15T18:00:00.000Z"
  }
  ```
- `PATCH /api/v1/user/notifications/:id/read`: Sets `read_at = NOW()` where `id = :id AND recipient_id = req.user.id`.
- `POST /api/v1/user/notifications/mark-all-read`: Sets `read_at = NOW()` where `recipient_id = req.user.id AND read_at IS NULL`.
- `GET /api/v1/user/preferences/notifications`: Fetch user notification channel preferences (Email, SMS, Push, In-App).
- `PATCH /api/v1/user/preferences/notifications`: Update channel preferences.

### 3. Frontend Component (`src/components/NotificationCenter.tsx`)
- Bell icon in header displaying dynamic unread badge count (where `read_at IS NULL`, e.g. `🔴 3`).
- Slide-over drawer / modal showing list of notifications sorted by recency.
- Tab filters matching `type`: "All", "Bookings", "Waitlist", "Rewards".
- Language fallback handling rendering `title_ar` / `body_ar` in RTL when current language is Arabic, or `title` / `body` in LTR for English.

---

## Acceptance Criteria
- [ ] Database migration uses `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR(255), ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;` preserving existing schema and data.
- [ ] In-app notification center renders unread badge counter dynamically based on `read_at IS NULL`.
- [ ] Users can filter notifications by `type` and mark single/all items as read (`read_at = NOW()`).
- [ ] Clicking notification item navigates user to associated route (`action_url`).
- [ ] Granular notification preference matrix allows toggling individual channels (Email, SMS, Push) per notification type.
- [ ] Database queries optimize index lookups on `(recipient_id, read_at, created_at DESC)` for fast sub-20ms response times.
- [ ] Full bilingual support (Arabic RTL / English LTR) using `title_ar`/`body_ar` and `title`/`body` with WCAG 2.2 AA screen reader accessibility (`aria-live="polite"`).

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/controllers/inapp_notification.controller.test.ts` testing retrieval by `recipient_id`, marking read (`read_at`), and unread counting.
- [ ] Add frontend component tests in `src/components/NotificationCenter.test.tsx`.
- [ ] Verify test suite passes: `npm run typecheck`, `npm test -- tests/unit`, and `node evals/check.js`.

---

## SDLC & Security Guardrails
- **Security & Authorization**: Enforce strict user isolation (`WHERE recipient_id = req.user.id`); users must never be able to view, query, or mark read notifications belonging to other accounts.
