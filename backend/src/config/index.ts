import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const INSECURE_JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
const INSECURE_JWT_REFRESH_SECRET = 'your-super-secret-refresh-key-change-in-production';
const INSECURE_SESSION_SECRET = 'your-session-secret-change-in-production';

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  const jwtSecret = env.JWT_SECRET || (isProduction ? '' : INSECURE_JWT_SECRET);
  const jwtRefreshSecret = env.JWT_REFRESH_SECRET || (isProduction ? '' : INSECURE_JWT_REFRESH_SECRET);
  const sessionSecret = env.SESSION_SECRET || (isProduction ? '' : INSECURE_SESSION_SECRET);

  if (isProduction) {
    const errors: string[] = [];

    if (!env.JWT_SECRET || env.JWT_SECRET === INSECURE_JWT_SECRET) {
      errors.push('JWT_SECRET must be set to a secure secret in production');
    }
    if (!env.JWT_REFRESH_SECRET || env.JWT_REFRESH_SECRET === INSECURE_JWT_REFRESH_SECRET) {
      errors.push('JWT_REFRESH_SECRET must be set to a secure secret in production');
    }
    if (!env.SESSION_SECRET || env.SESSION_SECRET === INSECURE_SESSION_SECRET) {
      errors.push('SESSION_SECRET must be set to a secure secret in production');
    }
    if (!env.DATABASE_URL || env.DATABASE_URL.includes('localhost:5432/yalla')) {
      errors.push('DATABASE_URL must be configured with a production database URI');
    }

    if (errors.length > 0) {
      throw new Error(`Production configuration validation failed:\n- ${errors.join('\n- ')}`);
    }
  }

  return {
    // Server
    env: nodeEnv,
    port: parseInt(env.PORT || '3000', 10),
    apiVersion: env.API_VERSION || 'v1',

    // Database
    database: {
      url: env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/yalla',
      host: env.DB_HOST || 'localhost',
      port: parseInt(env.DB_PORT || '5432', 10),
      name: env.DB_NAME || 'yalla',
      user: env.DB_USER || 'postgres',
      password: env.DB_PASSWORD || 'password',
    },

    // JWT
    jwt: {
      secret: jwtSecret,
      expiresIn: env.JWT_EXPIRES_IN || '7d',
      refreshSecret: jwtRefreshSecret,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    // Stripe
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY || '',
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
      publicKey: env.STRIPE_PUBLIC_KEY || '',
    },

    // Email (SendGrid)
    email: {
      host: env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(env.SMTP_PORT || '587', 10),
      secure: env.SMTP_SECURE === 'true',
      user: env.SMTP_USER || 'apikey',
      password: env.SMTP_PASSWORD || '',
      from: env.EMAIL_FROM || 'noreply@yalla.com',
      fromName: env.EMAIL_FROM_NAME || 'Yalla',
    },

    // SMS (Twilio & Unifonic)
    sms: {
      accountSid: env.TWILIO_ACCOUNT_SID || '',
      authToken: env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: env.TWILIO_PHONE_NUMBER || '',
      senderId: env.TWILIO_SENDER_ID || 'Yalla',
      unifonicAppsId: env.UNIFONIC_APPSID || '',
      unifonicSenderId: env.UNIFONIC_SENDER_ID || 'Yalla',
      provider: env.SMS_PROVIDER || 'factory',
    },

    // Redis
    redis: {
      url: env.REDIS_URL || 'redis://localhost:6379',
      password: env.REDIS_PASSWORD || '',
    },

    // CORS
    cors: {
      origin: env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: env.CORS_CREDENTIALS === 'true',
    },

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // Logging
    logging: {
      level: env.LOG_LEVEL || 'debug',
      file: env.LOG_FILE || 'logs/app.log',
    },

    // File Upload
    upload: {
      dir: env.UPLOAD_DIR || 'uploads',
      maxFileSize: parseInt(env.MAX_FILE_SIZE || '5242880', 10),
    },

    // Security
    security: {
      bcryptRounds: parseInt(env.BCRYPT_ROUNDS || '12', 10),
      sessionSecret: sessionSecret,
    },

    // Monitoring
    monitoring: {
      sentryDsn: env.SENTRY_DSN || '',
      newRelicLicenseKey: env.NEW_RELIC_LICENSE_KEY || '',
    },

    // Feature Flags
    features: {
      enableEmailNotifications: env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enableSmsNotifications: env.ENABLE_SMS_NOTIFICATIONS === 'true',
      enableAnalytics: env.ENABLE_ANALYTICS === 'true',
    },
  };
}

export const config = loadConfig();
export default config;
