# [Jules] Phase 4: Read-Replica PostgreSQL DB Clustering & Reporting Query Routing

**Labels**: `backlog`, `phase-4`, `database`, `postgresql`, `performance`, `backend`, `platform-infrastructure`, `jules`
**Milestone**: Phase 4: Expansion & Scale (Q2 2027)
**Module / Pillar**: `Platform & Infrastructure`

---

## Problem & Context
During peak booking hours or promotional campaigns, heavy read traffic from discovery browsing, search filters, staff operations dashboards, and analytical reporting can contend for locks and CPU cycles on the primary PostgreSQL database node.

To ensure booking transactions (`reservations.createWithCapacityCheck`) complete with sub-second ACID row locks, read-only GET queries must be routed transparently to PostgreSQL read-replica nodes.

---

## User Story
**As a** platform engineer,
**I want** read-only database queries to route automatically to PostgreSQL read replicas while write transactions target the primary writer node,
**So that** high catalog traffic does not slow down booking checkouts or database performance.

---

## Technical Architecture & Scope

### 1. Database Configuration (`backend/src/config/database.ts`)
- Configure dual `pg.Pool` instances:
  - `primaryPool`: Main write node (`DATABASE_URL`), pool size 20, connection timeout 5000ms.
  - `replicaPool`: Read-replica cluster endpoint (`DATABASE_REPLICA_URL`), pool size 30. Defaults to `primaryPool` if `DATABASE_REPLICA_URL` is undefined.

### 2. Dual Query Interface (`backend/src/config/database.ts`)
```typescript
export const db = {
  // Execute read-write queries or transactional locks on primary node
  queryPrimary: (text: string, params?: any[]) => primaryPool.query(text, params),

  // Execute read-only SELECT queries on replica pool
  queryReplica: (text: string, params?: any[]) => replicaPool.query(text, params),

  // Explicit transaction helper strictly bound to primary node
  transaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => { ... }
};
```

### 3. Read-Your-Own-Writes Session Pinning (`backend/src/middleware/databaseRouting.middleware.ts`)
- To prevent replication lag anomalies where a user performs a mutation and immediately reads stale data from a replica:
  - User session is pinned to the primary database pool for 5 seconds after mutations (booking, cancel, state changes via POST, PUT, PATCH, DELETE).
  - Pinning state is tracked per user session (via Redis key `session:pinned:<userId>` with 5-second TTL or authenticated request context).
  - Any subsequent read queries within the 5-second window execute via `db.queryPrimary` before reverting to `db.queryReplica`.

### 4. Model Query Refactoring
- Update models (`experience.model.ts`, `feedback.model.ts`, `audit.model.ts`) to route read-only lists and detail fetches to `db.queryReplica`.
- Keep reservation intake, user profile updates, payment confirmations, and capacity updates on `db.queryPrimary`.

### 5. Replica Failover & Health Checks
- If `queryReplica` experiences a network timeout or connection refusal, automatically fallback to `primaryPool` and log a warning metric.

---

## Acceptance Criteria
- [ ] Dual pool setup initialized cleanly in `database.ts`.
- [ ] Read-only GET model methods (`findAllPublished`, `getExperienceDetails`, `getSystemMetrics`) route queries to `replicaPool`.
- [ ] Transactional booking methods (`createWithCapacityCheck`, `confirmAttendance`) remain strictly bound to `primaryPool`.
- [ ] Read-your-own-writes session pinning: user session is pinned to primary database pool for 5 seconds after mutations (booking, cancel, state changes).
- [ ] Replica connection drop triggers automatic fallback to primary pool without throwing 500 errors to end users.
- [ ] Graceful shutdown drains both `primaryPool` and `replicaPool` during process termination signals (`SIGTERM`, `SIGINT`).
- [ ] Automated tests verify primary/replica selection logic and failover handling.

---

## Testing Requirements
- [ ] Add unit tests in `backend/tests/unit/config/database.test.ts` testing query routing and failover fallback.
- [ ] Verify test suite passes: `npm run typecheck` and `npm test -- tests/unit`.

---

## SDLC & Security Guardrails
- **Transaction Consistency**: Never route queries inside a `BEGIN...COMMIT` transaction block to a read replica; all queries within an active transaction must execute on the same primary connection client.
