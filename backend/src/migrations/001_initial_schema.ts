import pool from '../config/database';
import logger from '../utils/logger';

const migrations = [
  // Users table
  `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) UNIQUE NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      language VARCHAR(5) DEFAULT 'en',
      preferred_area VARCHAR(100),
      experience_language VARCHAR(5) DEFAULT 'en',
      budget_min INTEGER DEFAULT 100,
      budget_max INTEGER DEFAULT 400,
      accessibility_needs TEXT,
      adult_declaration_accepted BOOLEAN DEFAULT FALSE,
      terms_accepted BOOLEAN DEFAULT FALSE,
      marketing_consent BOOLEAN DEFAULT FALSE,
      role VARCHAR(20) DEFAULT 'participant',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Experiences table
  `
    CREATE TABLE IF NOT EXISTS experiences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      date DATE NOT NULL,
      time TIME NOT NULL,
      duration VARCHAR(50) NOT NULL,
      duration_minutes INTEGER NOT NULL,
      area VARCHAR(100) NOT NULL,
      area_ar VARCHAR(100) NOT NULL,
      group_size_min INTEGER NOT NULL,
      group_size_max INTEGER NOT NULL,
      language VARCHAR(5) NOT NULL,
      price INTEGER NOT NULL,
      currency VARCHAR(3) DEFAULT 'SAR',
      included JSONB DEFAULT '[]',
      included_ar JSONB DEFAULT '[]',
      excluded JSONB DEFAULT '[]',
      excluded_ar JSONB DEFAULT '[]',
      accessibility TEXT,
      accessibility_ar TEXT,
      physical_demand VARCHAR(20) DEFAULT 'moderate',
      environment TEXT,
      environment_ar TEXT,
      noise_level VARCHAR(20) DEFAULT 'moderate',
      host_role TEXT,
      host_role_ar TEXT,
      requirements JSONB DEFAULT '[]',
      requirements_ar JSONB DEFAULT '[]',
      cancellation_summary TEXT,
      cancellation_summary_ar TEXT,
      image_url TEXT,
      plan_state VARCHAR(20) DEFAULT 'draft',
      capacity INTEGER NOT NULL,
      booked INTEGER DEFAULT 0,
      primary_host_id UUID REFERENCES users(id),
      backup_host_id UUID REFERENCES users(id),
      primary_venue_id UUID,
      fallback_venue_id UUID,
      min_attendance INTEGER DEFAULT 4,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Reservations table
  `
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      state VARCHAR(30) NOT NULL DEFAULT 'initiated',
      confirmed_at TIMESTAMP WITH TIME ZONE,
      reconfirmed_at TIMESTAMP WITH TIME ZONE,
      checked_in_at TIMESTAMP WITH TIME ZONE,
      cancelled_at TIMESTAMP WITH TIME ZONE,
      expiry_at TIMESTAMP WITH TIME ZONE,
      payment_state VARCHAR(30) DEFAULT 'initiated',
      payment_id VARCHAR(255),
      idempotency_key VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(participant_id, experience_id, state)
    );
  `,

  // Feedback table
  `
    CREATE TABLE IF NOT EXISTS feedbacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      worth_time INTEGER NOT NULL CHECK (worth_time >= 1 AND worth_time <= 5),
      description_accurate BOOLEAN NOT NULL,
      comfortable_organized BOOLEAN NOT NULL,
      comment TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reservation_id)
    );
  `,

  // Favorites table
  `
    CREATE TABLE IF NOT EXISTS favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, experience_id)
    );
  `,

  // Blocks table
  `
    CREATE TABLE IF NOT EXISTS blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_entity_id VARCHAR(255) NOT NULL,
      blocked_entity_type VARCHAR(20) NOT NULL CHECK (blocked_entity_type IN ('participant', 'host')),
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(blocker_id, blocked_entity_id)
    );
  `,

  // Support requests table
  `
    CREATE TABLE IF NOT EXISTS support_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('operational', 'report', 'safety')),
      state VARCHAR(20) NOT NULL DEFAULT 'submitted',
      subject VARCHAR(255) NOT NULL,
      subject_ar VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      target_entity_id VARCHAR(255),
      target_entity_type VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Safety cases table
  `
    CREATE TABLE IF NOT EXISTS safety_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      state VARCHAR(20) NOT NULL DEFAULT 'submitted',
      category VARCHAR(100) NOT NULL,
      category_ar VARCHAR(100) NOT NULL,
      narrative TEXT NOT NULL,
      evidence JSONB DEFAULT '[]',
      actions JSONB DEFAULT '[]',
      restricted_access BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Notifications table
  `
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(30) NOT NULL,
      state VARCHAR(20) NOT NULL DEFAULT 'queued',
      title VARCHAR(255) NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      body_ar TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      sent_at TIMESTAMP WITH TIME ZONE,
      delivered_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `,

  // Audit events table
  `
    CREATE TABLE IF NOT EXISTS audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_id UUID NOT NULL REFERENCES users(id),
      actor_role VARCHAR(20) NOT NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      details JSONB DEFAULT '{}',
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      classification VARCHAR(20) NOT NULL DEFAULT 'internal'
    );
  `,

  // Create indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_reservations_participant ON reservations(participant_id);`,
  `CREATE INDEX IF NOT EXISTS idx_reservations_experience ON reservations(experience_id);`,
  `CREATE INDEX IF NOT EXISTS idx_reservations_state ON reservations(state);`,
  `CREATE INDEX IF NOT EXISTS idx_feedbacks_reservation ON feedbacks(reservation_id);`,
  `CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id);`,
  `CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp);`,
];

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migrations...');
    
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      logger.info(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migration);
    }
    
    logger.info('✅ All migrations completed successfully');
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
