# Intent: Offline Boarding Pass & Apple/Google Wallet Pass Generation

**Author**: Mobile & Experience Engineering
**Date**: 2026-10-26
**Status**: accepted

---

## 1. Problem
Curated small-group experiences often take place in unique local venues, rooftop lounges, or subterranean spaces with weak cellular data connectivity. If an attendee cannot load the web application upon arrival, check-in can be delayed.
Generating offline digital wallet passes (.pkpass for Apple Wallet and Google Wallet JWT passes) enables attendees to save their boarding pass with venue location, check-in QR code, and dynamic PIN directly into their smartphone wallet.
However, Yalla's core venue privacy invariant (eval-008) requires secret arrival venue coordinates to be protected and hidden until 24 hours prior to the event AND after the attendee reconfirms attendance. Digital wallet passes must strictly comply with this privacy policy.

## 2. Proposed Outcome
Attendees can generate Apple Wallet (.pkpass) and Google Wallet JWT passes to store offline boarding passes.
Passes strictly gate secret arrival venue coordinates, exact street address, and check-in PIN based on reservation state and event start time:
- Pre-24h or unconfirmed reservations display general neighborhood only and omit GPS coordinates/geofencing.
- Once reconfirmed within 24 hours of event start, digital passes update (via APNs / Google Wallet patch) to display exact venue name, street address, geofencing triggers, and dynamic check-in PIN.

## 3. Affected Users & Systems
- **Users**: Experience Participants, Hosts, Operations.
- **Systems**: Express API backend (`backend/src/services/appleWallet.service.ts`, `backend/src/services/googleWallet.service.ts`, `backend/src/routes/wallet.routes.ts`, `backend/src/controllers/wallet.controller.ts`), Frontend React (`src/components/WalletButtons.tsx`, `src/pages/ArrivalMode.tsx`, `src/pages/MyPlans.tsx`, `src/pages/ExperienceDetails.tsx`).

## 4. Constraints
- **Venue Privacy (eval-008 invariant)**: Secret arrival venue coordinates and street address must NEVER leak in pre-24h or unconfirmed pass payloads.
- **Cryptographic Barcode Tokens**: Barcode QR codes must contain short-lived, signed JWT tokens for check-in verification.
- **Accessibility & i18n**: Wallet badges and privacy disclosures must support EN/AR bilingual rendering.

## 5. Open Questions
- How are pass updates delivered when attendance state transitions to reconfirmed?
- Answer: Apple Wallet uses APNs push notification endpoints (`/api/v1/wallet/v1/passes/...`) to push updated pass payloads; Google Wallet updates via JWT pass patch.
