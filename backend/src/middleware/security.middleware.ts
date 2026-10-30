import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';

/**
 * Rate limiting configuration (in-memory store; RATE_LIMIT_* env vars)
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  // Stripe retries and bursts from a small set of egress IPs; throttling the
  // webhook would silently drop payment confirmations. Test suites fire
  // hundreds of requests from one IP, so they are exempt as well.
  skip: (req) =>
    config.env === 'test' || req.originalUrl.includes('/payments/webhook'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  skip: () => config.env === 'test',
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  skipSuccessfulRequests: true,
});

/**
 * Security headers configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.userId || 'anonymous',
    };
    
    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Server Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client Error', logData);
    } else {
      logger.info('Request', logData);
    }
  });
  
  next();
};

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Input sanitization middleware with prototype pollution protection
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Credentials must reach the hasher byte-for-byte. Trimming or stripping
  // characters here would silently change a user's password.
  const OPAQUE_FIELDS = new Set([
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'refreshToken',
    'token',
  ]);

  // Sanitize string inputs and guard against prototype pollution
  const sanitize = (obj: any, parentKey?: string): any => {
    if (typeof obj === 'string') {
      return OPAQUE_FIELDS.has(parentKey ?? '') ? obj : obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item, parentKey));
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key of Object.keys(obj)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitize(obj[key], key);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
      },
    });
  }

  next();
};

/**
 * API versioning middleware
 */
export const apiVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestedVersion = req.headers['api-version'] || version;
    (req as any).apiVersion = requestedVersion;
    next();
  };
};

/**
 * Health check endpoint
 */
export const healthCheck = async (req: Request, res: Response) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    const pool = await import('../config/database').then(m => m.default);
    await pool.query('SELECT 1');
    healthcheck.message = 'OK';
    
    return res.status(200).json({
      success: true,
      data: healthcheck,
    });
  } catch (error: any) {
    // Fail securely without leaking internal database trace/connection details
    healthcheck.message = 'Service unavailable';
    
    return res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service unavailable',
        details: healthcheck,
      },
    });
  }
};

/**
 * Metrics endpoint (for monitoring)
 */
export const metrics = (req: Request, res: Response) => {
  const metrics = {
    memory: {
      rss: process.memoryUsage().rss,
      heapTotal: process.memoryUsage().heapTotal,
      heapUsed: process.memoryUsage().heapUsed,
      external: process.memoryUsage().external,
    },
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    timestamp: Date.now(),
  };

  res.json({
    success: true,
    data: metrics,
  });
};
