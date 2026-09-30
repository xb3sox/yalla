import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  // Add payments table (CRITICAL: was missing from initial schema)
  `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL CHECK (amount > 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
      stripe_payment_id VARCHAR(255) UNIQUE,
      stripe_client_secret TEXT,
      refund_amount INTEGER DEFAULT 0,
      refund_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE,
      refunded_at TIMESTAMP WITH TIME ZONE
    );
  `,

  // Add indexes for payments
  `CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_stripe_id ON payments(stripe_payment_id);`,

  // Add refund tracking to reservations
  `ALTER TABLE reservations ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT 'none';`,
  `ALTER TABLE reservations ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;`,
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting payments table migration...');
    
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }
    
    logger.info('✅ Payments table migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations;
