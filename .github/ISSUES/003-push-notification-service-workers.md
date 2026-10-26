# [Jules] Phase 3: Web Push Notification Service Workers & VAPID Keys for Mobile PWA

**Labels**: `backlog`, `phase-3`, `notifications`, `pwa`, `frontend`, `backend`, `jules`
**Milestone**: Phase 3: Real-Time & Communications (Q1 2027)

---

## Problem & Context
Yalla operates as a Progressive Web App (PWA). Mobile browser users who bookmark or install Yalla on iOS Safari (iOS 16.4+) or Android Chrome require Web Push notifications to receive timely alerts for attendance reconfirmations, host updates, and waitlist spot availability when the web app is closed or in the background.

---

## User Story
**As a** mobile web user,
**I want** to opt in to browser push notifications,
**So that** I receive instant pop-up alerts for 24h attendance reconfirmations and waitlist promotions directly on my mobile home screen.

---

## Technical Architecture & Scope

### 1. Service Worker Push Handler (`public/sw.js`)
- Implement `push` event handler in Service Worker:
  ```javascript
  self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-96x96.png',
      data: { url: data.url || '/' },
      dir: data.dir || 'rtl', // Support Arabic RTL
      lang: data.lang || 'ar'
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  });
  ```
- Implement `notificationclick` event handler to focus existing window or open target route (e.g., `/arrival/:reservationId`).

### 2. Subscription Management Endpoints (`backend/src/routes/notification.routes.ts`)
- `POST /api/v1/notifications/subscribe`: Saves VAPID `PushSubscription` object for authenticated user in PostgreSQL `push_subscriptions` table.
- `DELETE /api/v1/notifications/unsubscribe`: Removes subscription endpoint.
- `GET /api/v1/notifications/vapid-public-key`: Exposes VAPID public key.

### 3. Backend Push Dispatcher (`backend/src/services/pushNotification.service.ts`)
- Use `web-push` library with VAPID key pair (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- Support localized payloads in English and Arabic.
- Automatically prune expired or invalid subscriptions (`404` or `410 Gone` HTTP responses from Apple/Google push endpoints).

### 4. Frontend Integration Component (`src/components/PushNotificationPrompt.tsx`)
- Prompt user gracefully after booking confirmation or in user profile settings.
- Manage `Notification.permission` states ('default', 'granted', 'denied').

---

## Acceptance Criteria
- [ ] VAPID keys generated and configured in backend environment.
- [ ] Service worker registered cleanly in Vite build output (`public/sw.js`).
- [ ] Frontend prompt successfully requests permission and registers `PushSubscription` with backend.
- [ ] Backend push service delivers Web Push payloads to subscribed devices via Web Push protocol.
- [ ] Clicking push notification opens target route (`/arrival/:reservationId` or `/bookings`) in browser.
- [ ] Arabic RTL layout and language attributes respected in notification options.
- [ ] Inactive/expired endpoints pruned from database upon push failure.
- [ ] Automated tests verify route handlers and push payload formatting.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/pushNotification.service.test.ts`.
- [ ] Add route unit tests in `backend/tests/unit/routes/notification.routes.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Security**: Protect VAPID private key in secret manager; never commit keys to git repo.
- **Privacy**: Store user push subscriptions securely linked to `user_id`; delete all user subscriptions upon account deletion or log-out.
