# [Jules] Platform: Distributed Redis Rate-Limiting & High-Performance Response Cache

**Labels**: `backlog`, `platform`, `redis`, `cache`, `security`, `performance`, `backend`, `jules`
**Milestone**: Platform Engineering & Operational Excellence

---

## Problem & Context
Yalla currently uses memory-based rate limiters in Express. When scaling backend API deployment horizontally across multiple container nodes or serverless instances, in-memory rate limits are isolated per container, allowing malicious actors to bypass rate limits by distributing requests across nodes.

Additionally, catalog discovery queries (`GET /api/v1/experiences`) generate high database read volume. Implementing a distributed Redis caching layer will reduce database load and maintain sub-50ms API response times during traffic spikes.

---

## User Story
**As a** platform engineer,
**I want** distributed Redis rate-limiting and response caching,
**So that** public API endpoints are protected against rate-limit bypass attacks and catalog response times remain under 50ms under heavy load.

---

## Technical Architecture & Scope

### 1. Redis Client & Connection Pool (`backend/src/config/redis.ts`)
- Use `ioredis` with automatic reconnection, cluster support, and TLS enabled for production Redis environments (`REDIS_URL`).
- Fallback gracefully to memory store if Redis connection is unavailable in local dev mode.

### 2. Distributed Rate Limiter (`backend/src/middleware/rateLimiter.middleware.ts`)
- Use `rate-limiter-flexible` with `RateLimiterRedis` store.
- Tiers:
  - **Global Public API**: 100 requests per 15 minutes per IP.
  - **Auth & OTP Endpoints**: 5 requests per 15 minutes per IP/phone number.
  - **Check-in PIN Verification**: 10 attempts per 5 minutes per host.

### 3. Response Caching Middleware (`backend/src/middleware/cache.middleware.ts`)
- Middleware `cacheMiddleware(ttlSeconds)` for read-only endpoints (`GET /api/v1/experiences`, `GET /api/v1/locations/cities`).
- Cache Key format: `cache:http:<route_path>:<query_params_hash>`.
- Invalidation Strategy: Automatically purge experience cache keys (`cache:http:/api/v1/experiences*`) when an experience, session schedule, or capacity lock is updated or created.

---

## Acceptance Criteria
- [ ] Redis client initialized cleanly in `redis.ts` supporting Redis 7+ and TLS connections.
- [ ] Distributed rate limiting enforces IP and endpoint limits across multiple API nodes via Redis store.
- [ ] Rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`) returned on every API response.
- [ ] `GET /api/v1/experiences` serves cached response from Redis when valid, returning HTTP header `X-Cache: HIT` and response time <20ms.
- [ ] Experience creation, update, or booking mutation automatically invalidates associated Redis catalog cache keys (`X-Cache: MISS` on subsequent request).
- [ ] Automated tests verify Redis rate limiter and cache invalidation mechanics.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/middleware/rateLimiter.test.ts`.
- [ ] Add cache unit tests in `backend/tests/unit/middleware/cache.test.ts`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Data Protection**: Never cache authenticated user responses (e.g., `/reservations/my-bookings`, `/auth/me`, `/arrival/*`) in shared Redis response caches; restrict caching strictly to public, non-authenticated catalog endpoints.
