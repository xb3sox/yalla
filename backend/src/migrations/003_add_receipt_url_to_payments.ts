import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;`
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting 003_add_receipt_url_to_payments migration...');
    
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      await client.query(migration);
    }
    
    logger.info('✅ 003_add_receipt_url_to_payments migration completed successfully');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default runMigrations;
