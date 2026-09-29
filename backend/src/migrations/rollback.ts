import pool from '../config/database';
import logger from '../utils/logger';

async function rollback() {
  const client = await pool.connect();
  
  try {
    logger.info('🔄 Starting database rollback...');
    logger.warn('⚠️  This will delete ALL data in the database!');
    
    // Drop tables in reverse order of dependencies
    const tables = [
      'audit_events',
      'notifications',
      'safety_cases',
      'support_requests',
      'blocks',
      'favorites',
      'feedbacks',
      'payments',
      'reservations',
      'experiences',
      'users',
    ];

    for (const table of tables) {
      logger.info(`Dropping table: ${table}...`);
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
    
    logger.info('✅ Database rollback completed successfully');
    logger.info('📊 All tables have been dropped');
    logger.info('');
    logger.info('💡 To recreate the database, run:');
    logger.info('   npm run migrate');
    logger.info('');
    logger.info('💡 To seed demo data, run:');
    logger.info('   npm run seed');
    
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run rollback if this file is executed directly
if (require.main === module) {
  const confirm = process.argv.includes('--confirm');
  
  if (!confirm) {
    logger.error('❌ Rollback requires --confirm flag');
    logger.error('   Usage: npm run migrate:rollback -- --confirm');
    process.exit(1);
  }
  
  rollback()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default rollback;
