# Yalla Product Roadmap

**Status**: Version 2.0.0 Architecture Complete  
**Last Updated**: October 2026  

---

## 1. Completed Baseline (v1.0 & v2.0 Architecture)

### Core User Platform

- [x] Experience discovery with category, city, and date filters
- [x] Reservation flow with synthetic & Stripe payment intents
- [x] Waitlist queue management
- [x] 24-hour attendance reconfirmation system
- [x] Arrival mode with protected venue access & dynamic check-in PIN
- [x] Post-experience feedback and rating collection
- [x] Bilingual user interface (Arabic native RTL & English LTR)
- [x] WCAG 2.2 AA accessibility compliance

### Backend & API

- [x] Express.js API with TypeScript and 53 endpoints
- [x] PostgreSQL 15 schema with 12 normalized tables
- [x] JWT access tokens and HttpOnly refresh cookie rotation
- [x] Clean Architecture with Use Cases and Domain State Machine
- [x] Security middleware: prototype pollution protection, rate limiters, security headers
- [x] Generic `/health` and `/metrics` monitoring endpoints
- [x] O(N) Set precomputed recommendation engine

### AI-Native SDLC Framework

- [x] Stage 1 Plan: `intent/` artifact intake
- [x] Stage 2 Design: `specs/` policy and architectural standards
- [x] Stage 3 Build: `plans/` plan mode & Jules autonomous agent execution
- [x] Stage 4 Test: Automated feedback loops and continuous evals (`evals/`)
- [x] Stage 5 Deploy: Guardrailed GitHub Actions auto-merge pipeline
- [x] Stage 6 Maintain: Deterministic drift and anomaly detection (`scripts/monitor-breach.js`)

---

## 2. Upcoming Milestones

### Phase 3: Real-Time & Communications (Q1 2027)

- [ ] WebSocket gateway for instant host check-in roster synchronization
- [ ] Production SMS gateway (Twilio / Unifonic) integration for arrival alerts
- [ ] Push notification service workers for mobile browser engagement
- [ ] Automated attendee cancellation refund automation

### Phase 4: Expansion & Scale (Q2 2027)

- [ ] Multi-city expansion across Riyadh, Jeddah, and Al-Khobar
- [ ] Host self-service portal with calendar management
- [ ] Advanced recommendation algorithms with seasonal preference weighting
- [ ] Read-replica PostgreSQL database clustering for reporting queries

### Phase 5: Mobile Applications (Q3 2027)

- [ ] Capacitor / React Native cross-platform mobile wrapper
- [ ] Apple Pay & Mada native mobile SDK integration
- [ ] Offline boarding pass storage in Apple Wallet / Google Wallet
