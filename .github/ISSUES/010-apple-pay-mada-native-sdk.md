# [Jules] Phase 5: Apple Pay & Saudi Mada Native Payment SDK Integration

**Labels**: `backlog`, `phase-5`, `payments`, `apple-pay`, `mada`, `frontend`, `backend`, `jules`
**Milestone**: Phase 5: Mobile Applications (Q3 2027)

---

## Problem & Context
In Saudi Arabia, over 80% of digital e-commerce transactions occur via Mada debit cards and Apple Pay. To maximize checkout conversion for curated experiences, Yalla requires native mobile payment support for Apple Pay and Mada card verification using Stripe's Saudi localized SDK capabilities.

---

## User Story
**As a** mobile app user in Saudi Arabia,
**I want** to pay for my experience booking using Apple Pay or my Mada debit card with one tap,
**So that** I can complete my reservation instantly without manually typing credit card numbers.

---

## Technical Architecture & Scope

### 1. Stripe Payment Request Button & Apple Pay (`src/components/ApplePayButton.tsx`)
- Use `@stripe/react-stripe-js` Payment Request Button API for Web/PWA.
- Configure Apple Pay merchant ID (`merchant.app.yalla`).
- Validate SAR currency amount and local merchant capabilities (`country: 'SA'`, `currency: 'sar'`).

### 2. Mada Debit Card Validation (`backend/src/services/payment.service.ts`)
- Mada debit cards in Saudi Arabia require 3D Secure (3DS2) authentication enforced via Stripe PaymentIntents:
  ```javascript
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // SAR in halalas
    currency: 'sar',
    payment_method_types: ['card', 'apple_pay'],
    payment_method_options: {
      card: {
        request_three_d_secure: 'any' // Enforce 3DS2 for Mada compliance
      }
    },
    metadata: { reservation_id: reservationId, user_id: userId }
  });
  ```

### 3. Native Stripe Mobile SDK Integration (`src/services/stripeNative.ts`)
- Integrate `@stripe/stripe-react-native` or Capacitor Stripe plugin for native iOS/Android Apple Pay sheet invocation.

---

## Acceptance Criteria
- [ ] Apple Pay merchant domain verified and merchant certificate linked in Stripe Dashboard.
- [ ] Checkout page displays native Apple Pay sheet on supported iOS devices and Apple Pay web browsers.
- [ ] Mada debit cards automatically trigger 3DS2 challenge modal during payment intent confirmation.
- [ ] Backend PaymentIntent creation enforces SAR currency (`sar`) and 3DS2 options.
- [ ] Stripe Webhook `/api/v1/webhooks/stripe` handles `payment_intent.succeeded` for Apple Pay transactions idempotently.
- [ ] Automated tests verify Mada 3DS2 parameters and Apple Pay payment intent payloads.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/services/payment.service.test.ts` testing SAR payment intent configuration.
- [ ] Add frontend component tests in `src/components/ApplePayButton.test.tsx`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Compliance**: Adhere strictly to PCI-DSS Level 1 guidelines; payment card details must never pass through or touch Yalla backend servers directly.
