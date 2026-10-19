import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS rewards_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      points INTEGER NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired')),
      description TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_rewards_ledger_user_id ON rewards_ledger(user_id);`,
];

async function runMigrations004() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting rewards ledger table migration...');
    
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 004 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }
    
    logger.info('Γ£à Rewards ledger table migration completed successfully');
  } catch (error) {
    logger.error('Γ¥î Migration 004 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations004()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations004;
