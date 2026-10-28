import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      revoked_at TIMESTAMP WITH TIME ZONE,
      replaced_by_hash VARCHAR(64),
      user_agent TEXT,
      ip_address VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
     ON refresh_tokens(user_id) WHERE revoked_at IS NULL;`,
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry ON refresh_tokens(expires_at);`,
];

async function runMigrations006() {
  const client = await pool.connect();

  try {
    logger.info('Starting refresh_tokens table migration...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 006 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }

    logger.info('✅ Refresh tokens migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration 006 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations006()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations006;
