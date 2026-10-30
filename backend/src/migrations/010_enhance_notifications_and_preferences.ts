import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'category') THEN
        ALTER TABLE notifications ADD COLUMN category VARCHAR(50) DEFAULT 'booking';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
        ALTER TABLE notifications ADD COLUMN action_url VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
      END IF;
    END $$;
  `,
  `CREATE INDEX IF NOT EXISTS idx_notifications_recipient_category ON notifications(recipient_id, category);`,
  `
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      email_enabled BOOLEAN DEFAULT true,
      sms_enabled BOOLEAN DEFAULT true,
      push_enabled BOOLEAN DEFAULT true,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, category)
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);`,
];

async function runMigrations008() {
  const client = await pool.connect();

  try {
    logger.info('Starting notification enhancement and preferences migration...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 008 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }

    logger.info('✅ Notification enhancement and preferences migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration 008 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations008()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations008;
