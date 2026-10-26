# [Jules] Phase 3: Production SMS Gateway Integration (Twilio / Unifonic) for Arrival Alerts

**Labels**: `backlog`, `phase-3`, `communications`, `sms`, `backend`, `jules`
**Milestone**: Phase 3: Real-Time & Communications (Q1 2027)

---

## Problem & Context
Yalla enforces venue privacy for curated small-group experiences by obfuscating exact street coordinates until 24 hours prior to event start. Attendees must reconfirm attendance 24 hours before event time to unlock venue instructions and dynamic check-in PINs.

Relying solely on email for time-sensitive 24-hour arrival notifications leads to missed reconfirmations. A production SMS gateway supporting both global (Twilio) and Saudi regional providers (Unifonic) is required to deliver transactional SMS alerts reliably.

---

## User Story
**As a** confirmed experience attendee,
**I want** to receive automated SMS notifications for 24-hour attendance reconfirmation and venue arrival details,
**So that** I can unlock the venue address and check-in PIN on time without checking my email inbox.

---

## Technical Architecture & Scope

### 1. Provider Abstraction Layer (`backend/src/services/sms/`)
- `SmsProvider` interface:
  ```typescript
  export interface SmsProvider {
    sendSms(to: string, template: string, params: Record<string, string>): Promise<SmsResult>;
  }
  ```
- `TwilioSmsProvider` implementation using official Twilio SDK (`twilio`).
- `UnifonicSmsProvider` implementation using Unifonic REST API for Saudi Arabia (+966) phone numbers.
- `MockSmsProvider` for test and local development environments.

### 2. Provider Factory & Fallback Logic (`backend/src/services/sms/smsFactory.ts`)
- Automatically select `UnifonicSmsProvider` for Saudi (+966) and GCC country codes, defaulting to `TwilioSmsProvider` for international numbers.
- Failover mechanism: if primary provider returns 5xx error, retry once via backup provider.

### 3. Notification Triggers
- **Trigger 1**: 24-Hour Reconfirmation Window Open. Message: *"Yalla: Your experience '[Title]' starts in 24h. Tap to reconfirm your attendance & view venue details: https://yalla.app/a/[token]"*
- **Trigger 2**: Arrival PIN & Venue Unlocked. Message: *"Yalla: Attendance reconfirmed! Venue: [Venue Name]. Your Check-in PIN is [PIN]. Details: https://yalla.app/a/[token]"*
- **Trigger 3**: Host Announcement / Urgent Schedule Change.

### 4. Database Schema Updates
- Add `sms_logs` table:
  ```sql
  CREATE TABLE sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(30) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'queued', 'sent', 'delivered', 'failed'
    provider_message_id VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```

---

## Acceptance Criteria
- [ ] `SmsProvider` interface implemented with clean separation for Twilio, Unifonic, and Mock providers.
- [ ] Phone numbers sanitized and validated against E.164 international format before sending.
- [ ] 24-hour reconfirmation cron/worker dispatches SMS alerts using localized templates (Arabic / English based on user preferred language).
- [ ] Saudi CITC carrier compliance enforced: Sender ID configured as one-way alphanumeric (`Yalla`).
- [ ] Opt-out management handled strictly via authenticated web account profile settings or direct shortlinks (`https://yalla.app/opt-out`), not inbound 'STOP' SMS replies.
- [ ] Every sent SMS records an entry in `sms_logs` with provider response status and latency.
- [ ] Webhook endpoint `/api/v1/webhooks/sms/status` receives delivery reports (DLR) from Twilio/Unifonic and updates `sms_logs.status`.
- [ ] Sensitive SMS credentials (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `UNIFONIC_APPSID`) loaded securely via environment variables.
- [ ] Unit tests cover provider selection, message formatting, and webhook status handling.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/sms.service.test.ts` mocking external HTTP APIs.
- [ ] Add webhook tests in `backend/tests/unit/routes/sms_webhook.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Privacy & Saudi CITC Compliance**: Respect user notification preferences (`marketing_consent`). Under Saudi CITC carrier compliance rules, the registered Sender ID is one-way alphanumeric (`Yalla`); mobile carriers do not support inbound two-way SMS replies on alphanumeric IDs. Opt-out and communication preferences must be managed exclusively via the user's web account profile or dedicated shortlink (`https://yalla.app/opt-out`), not via inbound 'STOP' SMS replies. Transactional arrival and security alerts remain mandatory for safety.
- **Rate-Limiting**: Enforce a maximum of 3 SMS dispatches per phone number per hour to prevent abuse or SMS flooding attacks.
