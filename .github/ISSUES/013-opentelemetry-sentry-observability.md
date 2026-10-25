# [Jules] Platform: Distributed Tracing & APM Observability with OpenTelemetry and Sentry

**Labels**: `backlog`, `platform`, `observability`, `sentry`, `opentelemetry`, `backend`, `frontend`, `jules`
**Milestone**: Platform Engineering & Operational Excellence

---

## Problem & Context
As Yalla scales across multiple cities and handles high concurrent check-in traffic during peak hours, site reliability engineers need real-time visibility into application performance bottlenecks, database slow queries, HTTP request latencies, and unhandled client/server errors.

Integrating OpenTelemetry (OTel) for distributed tracing and Sentry for error tracking provides end-to-end visibility across frontend browser sessions, Express API routes, PostgreSQL queries, and Redis operations.

---

## User Story
**As an** operations engineer or developer,
**I want** distributed tracing and real-time Sentry error monitoring across frontend and backend services,
**So that** I can instantly diagnose production error spikes, slow database queries, and broken API request chains.

---

## Technical Architecture & Scope

### 1. Frontend Sentry SDK (`src/main.tsx`)
- Install `@sentry/react`.
- Initialize Sentry with performance monitoring (`tracesSampleRate: 0.1` in production) and Session Replay (`replaysOnErrorSampleRate: 1.0`).
- React Error Boundary component (`src/components/SentryErrorBoundary.tsx`) providing graceful fallback UI in English and Arabic.

### 2. Backend OpenTelemetry & Sentry Tracing (`backend/src/config/tracing.ts`)
- Install `@sentry/node`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/instrumentation-express`, `@opentelemetry/instrumentation-pg`.
- Initialize OpenTelemetry NodeSDK before app startup in `backend/src/server.ts`.
- Instrument Express routes and PostgreSQL `pg` pool queries with W3C `traceparent` context propagation headers.

### 3. Structured Logging Middleware (`backend/src/middleware/logging.middleware.ts`)
- Emit JSON-formatted logs containing `trace_id`, `span_id`, `user_id`, `http_status`, `duration_ms`, and `route`.
- Mask sensitive request body keys (`password`, `cardNumber`, `cvv`, `jwt`, `token`) before logging.

---

## Acceptance Criteria
- [ ] Sentry SDK initialized in frontend with custom Error Boundary component.
- [ ] Backend OpenTelemetry auto-instrumentation captures Express route durations and PostgreSQL SQL query execution spans.
- [ ] HTTP responses include standard W3C tracing header `traceresponse` / `traceparent`.
- [ ] Sensitive parameters (passwords, tokens, payment credentials) automatically redacted from logs and Sentry event payloads.
- [ ] Health check (`/health`) and metrics (`/metrics`) endpoints remain lean and excluded from trace sampling to prevent log noise.
- [ ] Automated tests verify error boundary rendering and sensitive log parameter masking.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/middleware/logging.test.ts` verifying sensitive data redaction.
- [ ] Add frontend unit tests in `src/components/SentryErrorBoundary.test.tsx`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Data Protection**: Enforce strict data sanitization rules in Sentry `beforeSend` callback to prevent PII (personally identifiable information) leakage.
