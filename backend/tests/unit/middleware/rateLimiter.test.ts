import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  createDistributedRateLimiter,
  rateLimitGlobal,
  rateLimitAuth,
  rateLimitPin,
} from '../../../src/middleware/rateLimiter.middleware';

describe('Distributed Rate Limiter Middleware', () => {
  describe('rateLimitGlobal', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/test-global', rateLimitGlobal, (_req: Request, res: Response) => {
        res.status(200).json({ success: true, message: 'OK' });
      });
    });

    it('should include RateLimit headers on successful request', async () => {
      const response = await request(app).get('/test-global');

      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('100');
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should enforce limit and return HTTP 429 with Retry-After when limit is exceeded', async () => {
      const testLimiter = createDistributedRateLimiter({
        keyPrefix: 'test_global_exceed',
        points: 2,
        duration: 60,
      });

      const testApp = express();
      testApp.use('/limited', testLimiter, (_req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const res1 = await request(testApp).get('/limited');
      expect(res1.status).toBe(200);

      const res2 = await request(testApp).get('/limited');
      expect(res2.status).toBe(200);

      const res3 = await request(testApp).get('/limited');
      expect(res3.status).toBe(429);
      expect(res3.headers['retry-after']).toBeDefined();
      expect(res3.headers['ratelimit-limit']).toBe('2');
      expect(res3.headers['ratelimit-remaining']).toBe('0');
      expect(res3.body).toEqual({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
    });
  });

  describe('rateLimitAuth', () => {
    it('should use phone/email identifier as rate limit key when available', async () => {
      const testAuthLimiter = createDistributedRateLimiter({
        keyPrefix: 'test_auth_key',
        points: 2,
        duration: 60,
        keyGenerator: (req) => req.body?.phone || req.ip || '127.0.0.1',
        errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
      });

      const app = express();
      app.use(express.json());
      app.post('/login', testAuthLimiter, (_req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const user1 = { phone: '+966500000001' };
      const user2 = { phone: '+966500000002' };

      // User 1 consumes 2 points
      await request(app).post('/login').send(user1);
      await request(app).post('/login').send(user1);
      const res1Block = await request(app).post('/login').send(user1);
      expect(res1Block.status).toBe(429);
      expect(res1Block.body.error.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');

      // User 2 still has quota
      const res2Ok = await request(app).post('/login').send(user2);
      expect(res2Ok.status).toBe(200);
    });
  });

  describe('rateLimitPin', () => {
    it('should restrict PIN verification attempts per host', async () => {
      const app = express();
      app.use(express.json());
      app.post('/verify-pin', rateLimitPin, (_req: Request, res: Response) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app).post('/verify-pin');
      expect(response.status).toBe(200);
      expect(response.headers['ratelimit-limit']).toBe('10');
    });
  });
});
