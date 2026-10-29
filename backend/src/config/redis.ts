import Redis, { RedisOptions } from 'ioredis';
import config from './index';
import logger from '../utils/logger';

let redisClient: Redis | null = null;
let isConnected = false;

export function getRedisOptions(): RedisOptions {
  const redisUrl = config.redis.url || process.env.REDIS_URL || 'redis://localhost:6379';
  const isTls = redisUrl.startsWith('rediss://') || (config.env === 'production' && !redisUrl.includes('localhost'));

  const options: RedisOptions = {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy(times: number) {
      if (times > 5 && config.env === 'test') {
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  };

  if (config.redis.password) {
    options.password = config.redis.password;
  }

  if (isTls) {
    options.tls = {
      rejectUnauthorized: config.env === 'production',
    };
  }

  return options;
}

export function createRedisClient(): Redis {
  const redisUrl = config.redis.url || process.env.REDIS_URL || 'redis://localhost:6379';
  const options = getRedisOptions();

  const client = new Redis(redisUrl, options);

  client.on('connect', () => {
    isConnected = true;
    logger.info('🔌 Connected to Redis store');
  });

  client.on('ready', () => {
    isConnected = true;
  });

  client.on('error', (err) => {
    isConnected = false;
    logger.warn('⚠️ Redis client error:', { error: err.message });
  });

  client.on('close', () => {
    isConnected = false;
  });

  client.on('end', () => {
    isConnected = false;
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
    redisClient.connect().catch((err) => {
      logger.warn('Redis initial connection failed; falling back gracefully', { error: err.message });
    });
  }
  return redisClient;
}

export function isRedisConnected(): boolean {
  return isConnected && redisClient !== null && redisClient.status === 'ready';
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
}

export default getRedisClient;
