import pool from '../src/config/database';

// Every table created by backend/src/migrations (001-006).
const TABLES = [
  'audit_events',
  'safety_cases',
  'notifications',
  'support_requests',
  'blocks',
  'favorites',
  'feedbacks',
  'refunds',
  'payments',
  'rewards_ledger',
  'reservations',
  'refresh_tokens',
  'experiences',
  'users',
];

async function clearTables(): Promise<void> {
  try {
    await pool.query('SET session_replication_role = replica;');
    for (const table of TABLES) {
      await pool.query(`DELETE FROM ${table}`);
    }
    await pool.query('SET session_replication_role = DEFAULT;');
  } catch {
    for (const table of TABLES) {
      try {
        await pool.query(`DELETE FROM ${table}`);
      } catch {}
    }
  }
}

beforeAll(async () => {
  try {
    await pool.query('SELECT 1');
  } catch {
    // Unit suites run without a database; DB suites surface the real
    // connection error on their first query if one is required.
    return;
  }

  // Clean slate once per test file. This must NOT run before each test:
  // API/e2e suites build on state created by earlier tests in the file
  // (e.g. register -> login), while model suites that need per-test
  // isolation clean up their own fixtures. DB suites must run serially
  // (--runInBand) because they share one database.
  try {
    await clearTables();
  } catch {
    // Schema not applied yet (unit-only run): nothing to clean.
  }
});

afterAll(async () => {
  try {
    await pool.end();
  } catch {
    // Ignore error on close if pool was not connected
  }
});
