# [Jules] Phase 3: Real-Time WebSocket Gateway for Instant Host Check-In Roster Sync

**Labels**: `backlog`, `phase-3`, `realtime`, `websocket`, `backend`, `frontend`, `jules`
**Milestone**: Phase 3: Real-Time & Communications (Q1 2027)

---

## Problem & Context

During local small-group experiences, hosts manage check-ins at venue entrances as attendees arrive and present dynamic check-in PINs. Currently, host roster state relies on HTTP polling, which causes latency, race conditions when multiple co-hosts manage check-ins simultaneously, and excessive database load.

A real-time WebSocket communication gateway is required to synchronize attendee check-in state instantly across all connected host devices, venue staff tablets, and attendee arrival mode UI.

---

## User Story

**As a** verified experience host or co-host,
**I want** attendee check-in events to sync instantly across all host devices in real-time,
**So that** venue staff can verify incoming attendees without manual page reloads or state conflicts.

---

## Technical Architecture & Scope

### 1. WebSocket Gateway (`backend/src/gateways/websocket.gateway.ts`)

- Use `socket.io` or `ws` with TypeScript wrappers.
- Authenticate incoming WebSocket connections using JWT access tokens extracted from query params or handshake headers (`Authorization: Bearer <token>`).
- Room isolation per experience instance: `experience:<experience_id>:roster`.

### 2. Events & Payloads

- `client:join_roster`: Host joins experience roster channel. Payload: `{ experienceId: string }`.
- `client:checkin_attendee`: Host submits check-in PIN. Payload: `{ experienceId: string, reservationId: string, pin: string }`.
  - **Authorization & State Machine Integration**:
    - Verify host authorization against experience ownership: check that connecting user ID matches `experience.primary_host_id` or `experience.backup_host_id`. Reject unauthorized attempts with `server:error` (`403 Forbidden`).
    - Validate PIN against reservation.
    - Advance reservation state via domain model: call `ReservationModel.updateState(reservationId, 'checked_in')` rather than executing a raw DB update, enforcing state machine transitions (`reconfirmed` -> `checked_in`), setting `checked_in_at = NOW()`, and recording audit events.
- `server:roster_updated`: Broadcast event on state change. Payload:

  ```json
  {
    "experienceId": "exp_12345",
    "reservationId": "res_67890",
    "state": "checked_in",
    "checkedInAt": "2027-01-15T18:30:00.000Z",
    "checkedInBy": "usr_host_01",
    "attendeeName": "Sarah A."
  }
  ```

- `server:error`: Error response for invalid PIN, unauthorized host, or invalid state transition.

### 3. High Availability & Scaling

- Redis Pub/Sub adapter (`@socket.io/redis-adapter`) to allow multi-node Express backend scaling.
- Heartbeat ping/pong (25s interval, 60s timeout) and automatic client reconnection with exponential backoff.

### 4. Frontend Integration (`src/hooks/useRosterSocket.ts`)

- Custom React hook managing socket connection state, room subscription, and store/UI updates.
- Fallback gracefully to HTTP polling if WebSocket connection fails or is blocked by network proxies.

---

## Acceptance Criteria

- [ ] WebSocket server initialized on existing HTTP server with CORS allowed origins matched to `CORS_ORIGIN`.
- [ ] JWT authentication enforced on connection handshake; unauthorized connections rejected with `4001 Unauthorized`.
- [ ] Co-hosts joining room `experience:<id>:roster` receive current roster snapshot and real-time updates.
- [ ] Check-in handler strictly authorizes host against `experience.primary_host_id` or `backup_host_id`.
- [ ] Valid PIN check-in invokes `ReservationModel.updateState(reservationId, 'checked_in')` (instead of raw DB update) and broadcasts `server:roster_updated` within <100ms.
- [ ] Invalid PIN or unauthorized host emits targeted `server:error` to initiating client without broadcasting to room.
- [ ] Frontend Host Portal automatically updates attendee badge to "Checked In" (state: `checked_in`) without page refresh.
- [ ] Unit & integration tests pass with 100% success rate.

---

## Testing Requirements

- [ ] Add unit tests in `backend/tests/unit/gateways/websocket.gateway.test.ts` testing connection auth, room joins, host authorization against `primary_host_id` / `backup_host_id`, `ReservationModel.updateState` invocation, and check-in event emission.
- [ ] Add frontend test in `src/hooks/useRosterSocket.test.ts` verifying socket event handlers and store integration.
- [ ] Verify test suite passes cleanly: `npm run typecheck`, `npm test -- tests/unit`, and `node evals/check.js`.

---

## SDLC & Security Guardrails

- **Security & Authorization**: Verify that only `primary_host_id` or `backup_host_id` can trigger check-ins. Never broadcast sensitive attendee details (e.g. phone numbers, email addresses) over WebSocket channels; limit payload to display names and state.
- **Rate-Limiting**: Limit check-in attempts via WebSocket to 10 requests per 10 seconds per host socket connection to prevent brute-force PIN guessing.
