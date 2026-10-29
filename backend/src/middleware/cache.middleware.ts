import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import getRedisClient, { isRedisConnected } from '../config/redis';
import logger from '../utils/logger';

// In-memory cache fallback store for local dev / tests when Redis is unavailable
const memoryCacheStore = new Map<string, { body: any; statusCode: number; expiresAt: number }>();

export function generateCacheKey(req: Request): string {
  const routePath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
  const normalizedPath = routePath.length > 1 ? routePath.replace(/\/+$/, '') : routePath;

  const sortedQueryKeys = Object.keys(req.query || {}).sort();
  const sortedQuery: Record<string, any> = {};
  for (const k of sortedQueryKeys) {
    sortedQuery[k] = req.query[k];
  }

  const queryStr = JSON.stringify(sortedQuery);
  const queryHash = crypto.createHash('sha256').update(queryStr).digest('hex');

  return `cache:http:${normalizedPath}:${queryHash}`;
}

export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // SDLC & Security Guardrail: Strictly restrict caching to non-authenticated GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const hasAuth =
      Boolean(req.headers.authorization) ||
      Boolean(req.headers.cookie && (req.headers.cookie.includes('access_token') || req.headers.cookie.includes('token'))) ||
      Boolean((req as any).user);

    if (hasAuth) {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    try {
      if (isRedisConnected()) {
        const client = getRedisClient();
        const cachedData = await client.get(cacheKey);

        if (cachedData) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          const parsed = JSON.parse(cachedData);
          return res.status(parsed.statusCode || 200).send(parsed.body);
        }
      } else {
        const memoryItem = memoryCacheStore.get(cacheKey);
        if (memoryItem) {
          if (Date.now() < memoryItem.expiresAt) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.status(memoryItem.statusCode).send(memoryItem.body);
          } else {
            memoryCacheStore.delete(cacheKey);
          }
        }
      }
    } catch (err: any) {
      logger.warn('Cache lookup error, bypassing cache:', { error: err.message });
    }

    // Cache MISS
    res.setHeader('X-Cache', 'MISS');

    const originalSend = res.send.bind(res);
    res.send = function (body: any): Response {
      // Only cache successful 200 responses
      if (res.statusCode === 200) {
        const payloadToStore = {
          statusCode: res.statusCode,
          body,
        };

        if (isRedisConnected()) {
          const client = getRedisClient();
          client.setex(cacheKey, ttlSeconds, JSON.stringify(payloadToStore)).catch((err) => {
            logger.warn('Failed to save to Redis cache:', { error: err.message });
          });
        } else {
          memoryCacheStore.set(cacheKey, {
            body,
            statusCode: res.statusCode,
            expiresAt: Date.now() + ttlSeconds * 1000,
          });
        }
      }

      return originalSend(body);
    };

    next();
  };
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Clear matching keys from memory store
  const globToRegex = (glob: string) => {
    const reString = glob.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${reString}$`);
  };
  const regex = globToRegex(pattern);
  for (const key of memoryCacheStore.keys()) {
    if (regex.test(key)) {
      memoryCacheStore.delete(key);
    }
  }

  // Clear matching keys from Redis
  if (isRedisConnected()) {
    try {
      const client = getRedisClient();
      let keys: string[] = [];

      if (typeof client.scanStream === 'function') {
        const stream = client.scanStream({ match: pattern, count: 100 });
        const matchingKeys: string[] = [];
        for await (const resultKeys of stream) {
          matchingKeys.push(...resultKeys);
        }
        keys = matchingKeys;
      } else {
        keys = await client.keys(pattern);
      }

      if (keys.length > 0) {
        await client.del(...keys);
        logger.info(`Purged ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (err: any) {
      logger.error('Failed to invalidate Redis cache pattern:', { pattern, error: err.message });
    }
  }
}

export async function invalidateExperienceCache(): Promise<void> {
  await invalidateCachePattern('cache:http:/api/v1/experiences*');
}

export function clearMemoryCacheStore(): void {
  memoryCacheStore.clear();
}
