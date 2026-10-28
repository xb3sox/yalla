# Intent: Feedback, Loyalty Rewards & Recommendation Engine

**Author**: Product Experience & Growth  
**Date**: 2026-10-19  
**Status**: accepted  

---

## 1. Problem

Curated experience platforms rely on high repeat rates. Without post-experience feedback mechanisms, organizers cannot detect deteriorating experience quality or host burnout. Additionally, without retention incentives (loyalty points) and personalized recommendations, participants drop off after their initial booking.

## 2. Proposed Outcome

A closed-loop engagement ecosystem:

- Verified post-experience feedback: only attendees with `completed` state can submit ratings and "worth the time" reviews.
- Rewards loyalty engine: participants automatically earn points upon completing experiences and can redeem points for discounts.
- Algorithmic recommendation engine: scores catalog experiences based on user preferences, past bookings, and budget using high-performance $O(N)$ lookup sets.

## 3. Affected Users & Systems

- **Users**: Attending participants, Hosts, Community Managers.
- **Systems**: `src/pages/Feedback.tsx`, `src/application/useCases/rewardsUseCase.ts`, `src/application/useCases/recommendationUseCase.ts`, `backend/src/controllers/recommendation.controller.ts`, `backend/src/controllers/feedback.controller.ts`, `backend/src/controllers/reward.controller.ts`.

## 4. Constraints

- Reviews are verified-only: non-attendees or cancelled reservations cannot submit feedback.
- Algorithmic budget: recommendation scoring must execute in $O(N)$ linear time by precomputing lookup sets outside iteration loops (Bolt performance invariant).
- Double-feedback prevention: a reservation cannot submit more than one feedback record (enforced via unique database constraint).

## 5. Open Questions

- Can hosts view feedback immediately?
- Answer: Feedback is aggregated to protect honest feedback and prevent retaliation against participants.
