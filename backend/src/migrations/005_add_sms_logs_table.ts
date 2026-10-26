import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS sms_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      phone_number VARCHAR(30) NOT NULL,
      provider VARCHAR(20) NOT NULL,
      message_type VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL,
      provider_message_id VARCHAR(100),
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_created ON sms_logs(phone_number, created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_msg ON sms_logs(provider_message_id);`,
];

async function runMigrations005() {
  const client = await pool.connect();

  try {
    logger.info('Starting sms_logs table migration...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 005 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }

    logger.info('✅ SMS logs table migration completed successfully');
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
