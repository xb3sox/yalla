# [Jules] Phase 5: Offline Boarding Pass & Apple/Google Wallet Pass Generation

**Labels**: `backlog`, `phase-5`, `wallet`, `mobile`, `backend`, `frontend`
**Milestone**: Phase 5: Mobile Applications (Q3 2027)

---

## Problem & Context
Curated small-group experiences often take place in unique local venues, rooftop lounges, or subterranean spaces with weak cellular data connectivity. If an attendee cannot load the web application upon arrival, check-in can be delayed.

Generating offline digital wallet passes (`.pkpass` for Apple Wallet and Google Wallet JWT passes) enables attendees to save their boarding pass with venue location, check-in QR code, and dynamic PIN directly into their smartphone wallet.

---

## User Story
**As an** attendee,
**I want** to tap "Add to Apple Wallet" or "Add to Google Wallet" after reconfirming my attendance,
**So that** I can view my venue directions, QR check-in code, and dynamic PIN offline without needing cellular internet.

---

## Technical Architecture & Scope

### 1. Apple Wallet Pass Generator (`backend/src/services/appleWallet.service.ts`)
- Use `passkit-generator` to compile `.pkpass` ZIP packages containing `pass.json`, icons, and cryptographic signatures signed by Apple Pass Type ID certificate.
- Pass Type: Event Ticket (`eventTicket`).
- Fields:
  - Header: Experience Title & Date.
  - Primary Field: Attendee Name.
  - Secondary Field: Venue Name & Neighborhood.
  - Auxiliary Field: Dynamic Check-In PIN.
  - Barcode: PKBarcodeFormatQR containing signed check-in verification JWT token.
  - Relevant Date & Geofence: Automatically triggers lock-screen notification when attendee arrives near venue coordinates.

### 2. Google Wallet Pass API (`backend/src/services/googleWallet.service.ts`)
- Generate Google Wallet JWT pass link using Google Wallet REST API and service account key.

### 3. Backend Pass Generation API (`backend/src/routes/wallet.routes.ts`)
- `GET /api/v1/reservations/:id/wallet/apple`: Generates and streams `.pkpass` binary file (`Content-Type: application/vnd.apple.pkpass`).
- `GET /api/v1/reservations/:id/wallet/google`: Returns Google Wallet save URL.

### 4. Frontend Wallet Buttons (`src/components/WalletButtons.tsx`)
- Render official "Add to Apple Wallet" and "Add to Google Wallet" badges on the Arrival Mode screen (`/arrival/:reservationId`).

---

## Acceptance Criteria
- [ ] Apple Wallet PKPASS generated cleanly with valid signature, icon assets, and barcode payload.
- [ ] Google Wallet JWT pass link generated and redirects smoothly to Google Wallet app.
- [ ] Wallet pass incorporates venue GPS coordinates (`relevantLocations`) to display a lock-screen alert when attendee approaches venue.
- [ ] Wallet pass updates dynamically if attendance reconfirmation or PIN changes via Push Notification Webhook (`/api/v1/wallet/v1/passes/...`).
- [ ] Unit tests verify PKPASS creation, JWT token signature, and wallet route authorization.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/wallet.service.test.ts`.
- [ ] Add integration tests in `backend/tests/unit/routes/wallet.routes.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Security**: Embed short-lived, cryptographically signed JWT tokens in pass QR codes to prevent unauthorized ticket duplication or forgery.
