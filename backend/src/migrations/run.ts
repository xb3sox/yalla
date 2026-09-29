import runMigrations from './001_initial_schema';
import logger from '../utils/logger';

async function main() {
  logger.info('🚀 Starting migration runner...');
  
  try {
    await runMigrations();
    logger.info('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed', error);
    process.exit(1);
  }
}

main();
