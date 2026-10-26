import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `
    CREATE TABLE IF NOT EXISTS refunds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
      payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
      stripe_refund_id VARCHAR(255),
      amount INTEGER NOT NULL CHECK (amount >= 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
      state VARCHAR(30) NOT NULL DEFAULT 'completed',
      tier VARCHAR(20) NOT NULL,
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reservation_id, stripe_refund_id)
    );
  `,
  `CREATE INDEX IF NOT EXISTS idx_refunds_reservation ON refunds(reservation_id);`,
  `CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund ON refunds(stripe_refund_id);`,
];

async function runMigrations005() {
  const client = await pool.connect();

  try {
    logger.info('Starting refunds table migration...');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration 005 step ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }

    logger.info('✅ Refunds table migration completed successfully');
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
