# [Jules] Phase 5: Offline Boarding Pass & Apple/Google Wallet Pass Generation

**Labels**: `backlog`, `phase-5`, `wallet`, `mobile`, `backend`, `frontend`, `jules`
**Milestone**: Phase 5: Mobile Applications (Q3 2027)

---

## Problem & Context
Curated small-group experiences often take place in unique local venues, rooftop lounges, or subterranean spaces with weak cellular data connectivity. If an attendee cannot load the web application upon arrival, check-in can be delayed.

Generating offline digital wallet passes (`.pkpass` for Apple Wallet and Google Wallet JWT passes) enables attendees to save their boarding pass with venue location, check-in QR code, and dynamic PIN directly into their smartphone wallet.

However, Yalla's core venue privacy invariant (eval-008) requires secret arrival venue coordinates to be protected and hidden until 24 hours prior to the event AND after the attendee reconfirms attendance. Digital wallet passes must strictly comply with this privacy policy.

---

## User Story
**As an** attendee,
**I want** to tap "Add to Apple Wallet" or "Add to Google Wallet",
**So that** I can view my booking details offline, and have my venue directions, GPS geofence, and check-in PIN automatically unlock once attendance is reconfirmed within 24 hours of the experience.

---

## Technical Architecture & Scope

### 1. Apple Wallet Pass Generator (`backend/src/services/appleWallet.service.ts`)
- Use `passkit-generator` to compile `.pkpass` ZIP packages containing `pass.json`, icons, and cryptographic signatures signed by Apple Pass Type ID certificate.
- Pass Type: Event Ticket (`eventTicket`).
- Fields & Venue Privacy Gating (eval-008 invariant):
  - Header: Experience Title & Date.
  - Primary Field: Attendee Name.
  - Secondary Field:
    - *Pre-24h or unconfirmed*: General neighborhood only (e.g., "Al Olaya District, Riyadh"). Secret venue name and street address are hidden.
    - *Within 24h and state is `reconfirmed` or `checked_in`*: Full venue name and exact street address.
  - Auxiliary Field: Dynamic Check-In PIN (available once reconfirmed; placeholder prior).
  - Barcode: PKBarcodeFormatQR containing signed check-in verification JWT token.
  - Relevant Date & Geofencing (`relevantLocations`):
    - Must **NOT** embed exact GPS coordinates or geofencing triggers until 24 hours before event start AND reservation state is `reconfirmed` or `checked_in`.
    - Pre-24h passes completely omit geofencing coordinates.
    - Once reconfirmed within 24h, an Apple Push Notification Service (APNs) update pushes the updated pass payload containing exact GPS coordinates and address.

### 2. Google Wallet Pass API (`backend/src/services/googleWallet.service.ts`)
- Generate Google Wallet JWT pass class and object using Google Wallet REST API and service account key.
- Apply the same privacy gating: omit exact coordinates and venue address until 24h window + `reconfirmed` / `checked_in` state. Deliver updates via Google Wallet REST API patch.

### 3. Backend Pass Generation API (`backend/src/routes/wallet.routes.ts`)
- `GET /api/v1/reservations/:id/wallet/apple`: Generates and streams `.pkpass` binary file (`Content-Type: application/vnd.apple.pkpass`), gating venue coordinates based on reservation state and 24h time threshold.
- `GET /api/v1/reservations/:id/wallet/google`: Returns Google Wallet save URL with gated venue details.
- `POST /api/v1/wallet/v1/passes/...`: Apple Wallet web service endpoints for pass registration and push updates upon reconfirmation.

### 4. Frontend Wallet Buttons (`src/components/WalletButtons.tsx`)
- Render official "Add to Apple Wallet" and "Add to Google Wallet" badges on the Booking Confirmation and Arrival Mode screens (`/arrival/:reservationId`).
- Display privacy badge explaining that exact venue GPS coordinates will unlock in wallet 24 hours prior upon reconfirmation.

---

## Acceptance Criteria
- [ ] Apple Wallet PKPASS generated cleanly with valid signature, icon assets, and barcode payload.
- [ ] Google Wallet JWT pass link generated and redirects smoothly to Google Wallet app.
- [ ] **Venue Privacy Gating (eval-008 invariant)**: Pass generation must NOT embed exact GPS coordinates, geofences (`relevantLocations`), or street address until 24h before event AND reservation state is `reconfirmed` or `checked_in`.
- [ ] Pre-24h passes display only the general neighborhood and omit geofencing.
- [ ] Push update mechanism (APNs / Google Wallet patch) delivers exact GPS coordinates and venue address once attendee reconfirms within the 24h window.
- [ ] Unit tests verify PKPASS creation, JWT token signature, and privacy gating logic.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/wallet.service.test.ts` verifying that pre-24h or unconfirmed reservations omit exact GPS coordinates and venue address, while reconfirmed reservations within 24h include them.
- [ ] Add integration tests in `backend/tests/unit/routes/wallet.routes.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck`, `npm test -- tests/unit`, and `node evals/check.js`.

---

## SDLC & Security Guardrails
- **Venue Privacy (eval-008 invariant)**: Guard venue privacy by ensuring pass generation never leaks exact coordinates or venue address prior to 24 hours before event start and attendance reconfirmation (`reconfirmed` or `checked_in` state).
- **Security**: Embed short-lived, cryptographically signed JWT tokens in pass QR codes to prevent unauthorized ticket duplication or forgery.
