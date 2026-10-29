# Spec: Offline Boarding Pass & Apple/Google Wallet Pass Generation

**Intent Reference**: `intent/007-wallet-pass-generation.md`
**Author**: Mobile & Experience Lead
**Date**: 2026-10-26
**Status**: approved

---

## 1. Executive Summary
This spec defines the architecture for Apple Wallet (.pkpass) and Google Wallet JWT pass generation and push/patch updates, ensuring full compliance with Yalla's venue privacy invariant (eval-008). Pass payloads display general neighborhood details prior to the 24-hour window, unlocking full venue address, GPS geofences (`relevantLocations`), and dynamic check-in PINs only after the participant reconfirms attendance within 24 hours of event start.

---

## 2. Requirements & Domain Logic

### Functional Requirements
- **FR-013**: Backend provides `GET /api/v1/reservations/:id/wallet/apple` generating `.pkpass` ZIP archives signed with Apple Pass Type certificates.
- **FR-014**: Backend provides `GET /api/v1/reservations/:id/wallet/google` returning Google Wallet JWT save URLs.
- **FR-015**: Pass QR codes contain signed check-in verification JWT tokens with `reservationId`, `participantId`, and `experienceId`.
- **FR-016**: Apple Wallet web service endpoints (`/api/v1/wallet/v1/passes/...`) register device library IDs and trigger APNs pass updates upon attendance reconfirmation.

### Venue Privacy Invariant (eval-008)
```
Pre-24h OR State NOT IN ['reconfirmed', 'checked_in', 'attended']:
  - Venue Secondary Field: "Al Olaya District, Riyadh" (Neighborhood + City)
  - PIN Auxiliary Field: "Unlocks 24h prior"
  - GPS Geofence (relevantLocations / locations): Omitted / Empty

Within 24h AND State IN ['reconfirmed', 'checked_in', 'attended']:
  - Venue Secondary Field: "Al Olaya Lounge, 123 Olaya St, Riyadh" (Full Name + Address)
  - PIN Auxiliary Field: "482910" (Dynamic 6-digit check-in PIN)
  - GPS Geofence (relevantLocations / locations): [{ latitude, longitude, relevantText }]
```

---

## 3. Technical Design & Architecture

### Components & APIs
- `AppleWalletService` (`backend/src/services/appleWallet.service.ts`): Builds `.pkpass` archive containing `pass.json`, icons, manifest, and signature.
- `GoogleWalletService` (`backend/src/services/googleWallet.service.ts`): Generates Google Wallet JWT pass object and save URL.
- `WalletController` & `WalletRoutes` (`backend/src/controllers/wallet.controller.ts`, `backend/src/routes/wallet.routes.ts`): Endpoints for pass generation, Apple web service registrations, and push updates.
- `WalletButtons` (`src/components/WalletButtons.tsx`): Official Apple and Google Wallet badges and privacy notice.

---

## 4. Policy Constraints & Compliance
- **Security**: Reservation pass endpoints require user authentication and ownership check. QR codes hold cryptographically signed JWT tokens.
- **Privacy (eval-008)**: Secret arrival coordinates MUST NOT be present in pre-24h or unconfirmed pass files.

---

## 5. Areas of Concern & Tradeoffs
> [!NOTE]
> Ensure binary streaming of `.pkpass` uses correct `Content-Type: application/vnd.apple.pkpass` and header `Content-Disposition`.
