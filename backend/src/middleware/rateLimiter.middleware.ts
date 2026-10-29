import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import getRedisClient, { isRedisConnected } from '../config/redis';
import logger from '../utils/logger';

export interface CreateLimiterOptions {
  keyPrefix: string;
  points: number;
  duration: number; // in seconds
  keyGenerator?: (req: Request) => string;
  errorCode?: string;
  errorMessage?: string;
}

export function createDistributedRateLimiter(options: CreateLimiterOptions) {
  const {
    keyPrefix,
    points,
    duration,
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || '127.0.0.1',
    errorCode = 'RATE_LIMIT_EXCEEDED',
    errorMessage = 'Too many requests, please try again later',
  } = options;

  const memoryLimiter = new RateLimiterMemory({
    keyPrefix: `${keyPrefix}_mem`,
    points,
    duration,
  });

  let redisLimiter: RateLimiterRedis | null = null;

  const getLimiter = () => {
    if (isRedisConnected()) {
      if (!redisLimiter) {
        redisLimiter = new RateLimiterRedis({
          storeClient: getRedisClient(),
          keyPrefix: `${keyPrefix}_redis`,
          points,
          duration,
          insuranceLimiter: memoryLimiter,
        });
      }
      return redisLimiter;
    }
    return memoryLimiter;
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const limiter = getLimiter();

    try {
      const rateLimiterRes = await limiter.consume(key);

      res.setHeader('RateLimit-Limit', points);
      res.setHeader('RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader('RateLimit-Reset', Math.ceil(rateLimiterRes.msBeforeNext / 1000));

      return next();
    } catch (rejRes: any) {
      if (rejRes instanceof Error) {
        logger.warn('Rate limiter store error, falling back to memory store:', { error: rejRes.message });
        try {
          const memRes = await memoryLimiter.consume(key);
          res.setHeader('RateLimit-Limit', points);
          res.setHeader('RateLimit-Remaining', memRes.remainingPoints);
          res.setHeader('RateLimit-Reset', Math.ceil(memRes.msBeforeNext / 1000));
          return next();
        } catch (memRej: any) {
          const retryAfter = Math.ceil((memRej.msBeforeNext || duration * 1000) / 1000);
          res.setHeader('RateLimit-Limit', points);
          res.setHeader('RateLimit-Remaining', 0);
          res.setHeader('RateLimit-Reset', retryAfter);
          res.setHeader('Retry-After', retryAfter);

          return res.status(429).json({
            success: false,
            error: {
              code: errorCode,
              message: errorMessage,
            },
          });
        }
      }

      // Rejection due to exceeding limit
      const rateLimiterRes = rejRes as RateLimiterRes;
      const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000);

      res.setHeader('RateLimit-Limit', points);
      res.setHeader('RateLimit-Remaining', rateLimiterRes.remainingPoints ?? 0);
      res.setHeader('RateLimit-Reset', retryAfter);
      res.setHeader('Retry-After', retryAfter);

      return res.status(429).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
        },
      });
    }
  };
}

/**
 * Tier 1: Global Public API
 * 100 requests per 15 minutes per IP
 */
export const rateLimitGlobal = createDistributedRateLimiter({
  keyPrefix: 'global',
  points: 100,
  duration: 15 * 60,
});

/**
 * Tier 2: Auth & OTP Endpoints
 * 5 requests per 15 minutes per IP or phone number
 */
export const rateLimitAuth = createDistributedRateLimiter({
  keyPrefix: 'auth',
  points: 5,
  duration: 15 * 60,
  keyGenerator: (req: Request) => {
    return req.body?.phoneNumber || req.body?.phone || req.body?.email || req.ip || '127.0.0.1';
  },
  errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
  errorMessage: 'Too many authentication attempts, please try again later',
});

/**
 * Tier 3: Check-in PIN Verification
 * 10 attempts per 5 minutes per host
 */
export const rateLimitPin = createDistributedRateLimiter({
  keyPrefix: 'pin',
  points: 10,
  duration: 5 * 60,
  keyGenerator: (req: Request) => {
    return (req as any).user?.userId || req.ip || '127.0.0.1';
  },
  errorCode: 'PIN_RATE_LIMIT_EXCEEDED',
  errorMessage: 'Too many PIN verification attempts, please try again later',
});
