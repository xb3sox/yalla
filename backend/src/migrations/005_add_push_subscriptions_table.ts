import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      keys JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);`,
];

async function runMigrations005() {
  const client = await pool.connect();

  try {
    logger.info('Starting push subscriptions table migration...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 005 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }

    logger.info('✅ Push subscriptions table migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration 005 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations005()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations005;
