import pool from '../src/config/database';

beforeAll(async () => {
  // Test database connection
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.warn('⚠️ Database connection failed (database may not be running in test environment)');
  }
});

afterAll(async () => {
  // Close database connection
  try {
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    // Ignore error on close if pool was not connected
  }
});

// Clear all tables before each test
beforeEach(async () => {
  try {
    // Disable foreign key constraints temporarily
    await pool.query('SET session_replication_role = replica;');

    // Clear test data
    await pool.query('DELETE FROM audit_events');
    await pool.query('DELETE FROM safety_cases');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM support_requests');
    await pool.query('DELETE FROM blocks');
    await pool.query('DELETE FROM favorites');
    await pool.query('DELETE FROM feedbacks');
    await pool.query('DELETE FROM payments');
    await pool.query('DELETE FROM reservations');
    await pool.query('DELETE FROM experiences');
    await pool.query('DELETE FROM users');

    // Re-enable foreign key constraints
    await pool.query('SET session_replication_role = DEFAULT;');
  } catch (error) {
    // Ignore cleanup error if database is not connected
  }
});
