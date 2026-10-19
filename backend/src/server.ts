import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import config from './config';
import pool from './config/database';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import {
  apiLimiter,
  authLimiter,
  securityHeaders,
  requestLogger,
  corsOptions,
  sanitizeInput,
  requestSizeLimiter,
  healthCheck,
  metrics,
} from './middleware/security.middleware';
import authRoutes from './routes/auth.routes';
import experienceRoutes from './routes/experience.routes';
import reservationRoutes from './routes/reservation.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import auditRoutes from './routes/audit.routes';
import staffRoutes from './routes/staff.routes';
import safetyCaseRoutes from './routes/safety_case.routes';
import supportRoutes from './routes/support.routes';
import favoritesRoutes from './routes/favorites.routes';
import blocksRoutes from './routes/blocks.routes';
import feedbackRoutes from './routes/feedback.routes';
import hostRoutes from './routes/host.routes';
import rewardRoutes from './routes/reward.routes';

const app = express();

// Security headers
app.use(securityHeaders);

// CORS
app.use(cors(corsOptions));

// Request size limiter
app.use(requestSizeLimiter);

// Body and Cookie parsing (must precede input sanitization)
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization (now inspects populated req.body/params/query)
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Rate limiting - general API
app.use('/api/', apiLimiter);

// Rate limiting - authentication endpoints (stricter)
app.use(`/api/${config.apiVersion}/auth/login`, authLimiter);
app.use(`/api/${config.apiVersion}/auth/register`, authLimiter);

// Health check endpoint (root and api version)
app.get('/health', healthCheck);
app.get(`/api/${config.apiVersion}/health`, healthCheck);

// Metrics endpoint (root and api version)
app.get('/metrics', metrics);
app.get(`/api/${config.apiVersion}/metrics`, metrics);

// API routes
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/experiences`, experienceRoutes);
app.use(`/api/${config.apiVersion}/reservations`, reservationRoutes);
app.use(`/api/${config.apiVersion}/payments`, paymentRoutes);
app.use(`/api/${config.apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${config.apiVersion}/audit`, auditRoutes);
app.use(`/api/${config.apiVersion}/staff`, staffRoutes);
app.use(`/api/${config.apiVersion}/safety-cases`, safetyCaseRoutes);
app.use(`/api/${config.apiVersion}/support-requests`, supportRoutes);
app.use(`/api/${config.apiVersion}/favorites`, favoritesRoutes);
app.use(`/api/${config.apiVersion}/blocks`, blocksRoutes);
app.use(`/api/${config.apiVersion}/feedbacks`, feedbackRoutes);
app.use(`/api/${config.apiVersion}/host`, hostRoutes);
app.use(`/api/${config.apiVersion}/rewards`, rewardRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.env}`);
  logger.info(`🔗 API Version: ${config.apiVersion}`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await pool.end();
      logger.info('PostgreSQL pool drained.');
      process.exit(0);
    } catch (err) {
      logger.error('Error closing database pool', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forcefully shutting down after timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection detected', { reason: reason?.stack || reason });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception detected', { error: error.message, stack: error.stack });
  shutdown('uncaughtException');
});

export default app;
