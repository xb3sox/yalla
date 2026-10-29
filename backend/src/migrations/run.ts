import runMigrations001 from './001_initial_schema';
import runMigrations002 from './002_add_payments_table';
import runMigrations003 from './003_add_receipt_url_to_payments';
import runMigrations004 from './004_add_rewards_table';
import runMigrations005 from './005_add_refunds_table';
import runMigrations006 from './006_add_sms_logs_table';
import runMigrations007 from './007_add_push_subscriptions_table';
import runMigrations008 from './008_enhance_notifications_and_preferences';
import logger from '../utils/logger';

async function main() {
  logger.info('🚀 Starting migration runner...');
  
  try {
    await runMigrations001();
    await runMigrations002();
    await runMigrations003();
    await runMigrations004();
    await runMigrations005();
    await runMigrations006();
    await runMigrations007();
    await runMigrations008();
    logger.info('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed', error);
    process.exit(1);
  }
}

main();
