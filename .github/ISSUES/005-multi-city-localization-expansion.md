# [Jules] Phase 4: Multi-City Location & Saudi Regional Expansion (Riyadh, Jeddah, Al-Khobar)

**Labels**: `backlog`, `phase-4`, `localization`, `multi-city`, `backend`, `frontend`, `jules`
**Milestone**: Phase 4: Expansion & Scale (Q2 2027)

---

## Problem & Context
Yalla is scaling curated experience operations across key metropolitan markets in Saudi Arabia: Riyadh, Jeddah, and Al-Khobar/Dammam.

Currently, city filtering is partially hardcoded. To support regional expansion, the platform requires structured database tables for regions, cities, and districts, localized timezone handling (`Asia/Riyadh`), neighborhood polygon/coordinate matching, and city-aware experience catalog filtering.

---

## User Story
**As a** user in Riyadh, Jeddah, or Eastern Province,
**I want** to select my current city and neighborhood,
**So that** I see relevant curated local experiences, accurate district venue directions, and local currency (SAR / ﷼) pricing formatted natively in Arabic or English.

---

## Technical Architecture & Scope

### 1. Database Schema Extensions (`backend/src/models/location.model.ts`)
```sql
CREATE TABLE cities (
  id VARCHAR(50) PRIMARY KEY, -- 'riyadh', 'jeddah', 'khobar', 'dammam'
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL, -- 'central', 'western', 'eastern'
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE districts (
  id VARCHAR(50) PRIMARY KEY,
  city_id VARCHAR(50) REFERENCES cities(id) ON DELETE CASCADE,
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE experiences ADD COLUMN city_id VARCHAR(50) REFERENCES cities(id);
ALTER TABLE experiences ADD COLUMN district_id VARCHAR(50) REFERENCES districts(id);
```

### 2. Location API Endpoints (`backend/src/routes/location.routes.ts`)
- `GET /api/v1/locations/cities`: List active cities with Arabic/English display names and experience counts.
- `GET /api/v1/locations/cities/:cityId/districts`: List districts for selected city.

### 3. Frontend Location Selector (`src/components/CitySelector.tsx`)
- Persistent user city preference stored in `localStorage` and synchronized with user profile.
- Automatic experience list filtering by selected `city_id` and optional `district_id`.
- Currency and date formatting using `Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' })` and `Intl.DateTimeFormat('ar-SA', { timeZone: 'Asia/Riyadh' })`.

---

## Acceptance Criteria
- [ ] Database migration seeds initial cities (Riyadh, Jeddah, Al-Khobar, Dammam) and primary districts (e.g., Al-Olaya, Diriyah, Al-Hamra, Al-Shati).
- [ ] `GET /api/v1/experiences` accepts `city_id` and `district_id` query params and filters SQL query efficiently.
- [ ] Header UI includes a city switcher component supporting instant catalog switching without full page refresh.
- [ ] Arabic and English localized names rendered based on active UI language state (`ar` / `en`).
- [ ] Experience price tags format natively with `SAR` / `ر.س`.
- [ ] Unit tests verify location routes, database queries, and i18n formatting functions.

---

## Testing Requirements
- [ ] Add backend unit tests in `backend/tests/unit/routes/location.routes.test.ts`.
- [ ] Add frontend unit tests in `src/components/CitySelector.test.tsx`.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Accessibility**: Ensure City Selector modal complies with WCAG 2.2 AA keyboard navigation and screen reader attributes (`aria-expanded`, `aria-haspopup`).
- **Data Integrity**: Enforce foreign key constraints on `experiences.city_id` and `experiences.district_id`.
