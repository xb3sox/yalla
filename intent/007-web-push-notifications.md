# Intent: Web Push Notification Service Workers & VAPID Keys for Mobile PWA

**Author**: Mobile Experience & Growth
**Date**: 2027-01-15
**Status**: accepted

---

## 1. Problem
Yalla operates as a Progressive Web App (PWA). Mobile browser users on iOS Safari (iOS 16.4+) or Android Chrome require Web Push notifications to receive timely alerts for 24h attendance reconfirmations, host updates, and waitlist spot availability when the web app is closed or in the background.

## 2. Proposed Outcome
- Provide Web Push notification capabilities via VAPID protocol.
- Implement push event listener and notification click handler in the Service Worker (`public/sw.js`).
- Store encrypted push subscriptions in `push_subscriptions` PostgreSQL table linked to `user_id`.
- Automatically prune expired or invalid subscriptions on 404/410 HTTP status from Web Push services.
- Provide user-facing opt-in component (`PushNotificationPrompt.tsx`) with permission management and Arabic RTL support.

## 3. Affected Users & Systems
- **Users**: Mobile PWA participants, Hosts.
- **Systems**:
  - Frontend: `public/sw.js`, `src/components/PushNotificationPrompt.tsx`, `src/services/api.ts`
  - Backend: `backend/src/routes/notification.routes.ts`, `backend/src/controllers/notification.controller.ts`, `backend/src/services/pushNotification.service.ts`, `backend/src/models/notification.model.ts`, `backend/src/migrations/005_add_push_subscriptions_table.ts`.

## 4. Constraints
- VAPID private keys must remain protected and never committed to version control.
- Subscriptions must be securely linked to `user_id` and removed upon account deletion or unsubscription.
- Notification payloads must support Arabic RTL layout (`dir: 'rtl'`, `lang: 'ar'`).
