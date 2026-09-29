import runMigrations001 from './001_initial_schema';
import runMigrations002 from './002_add_payments_table';
import logger from '../utils/logger';

async function main() {
  logger.info('🚀 Starting migration runner...');
  
  try {
    await runMigrations001();
    await runMigrations002();
    logger.info('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed', error);
    process.exit(1);
  }
}

main();
