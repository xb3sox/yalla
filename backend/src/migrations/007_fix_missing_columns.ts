import pool from '../config/database';
import logger from '../utils/logger';

// Two columns referenced by application code were never created:
//  - reservations.created_at: the reservation model orders by it
//    (findByParticipant, findByExperience, waitlist queries), so those
//    queries failed with "column r.created_at does not exist".
//  - blocks.reason_ar: the blocks controller inserts it, so creating a
//    block failed with "column reason_ar does not exist".
const migrations = [
  `ALTER TABLE reservations
     ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`,
  // Backfill legacy rows from their last-update timestamp.
  `UPDATE reservations SET created_at = updated_at WHERE created_at IS NULL;`,
  `ALTER TABLE blocks ADD COLUMN IF NOT EXISTS reason_ar TEXT;`,
];

async function runMigrations007() {
  const client = await pool.connect();

  try {
    logger.info('Starting missing-columns migration...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 007 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }

    logger.info('✅ Missing-columns migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration 007 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations007()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations007;
