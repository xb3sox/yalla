import express, { Request, Response } from 'express';
import request from 'supertest';
import {
  cacheMiddleware,
  generateCacheKey,
  invalidateExperienceCache,
  clearMemoryCacheStore,
} from '../../../src/middleware/cache.middleware';

describe('Response Cache Middleware', () => {
  beforeEach(() => {
    clearMemoryCacheStore();
  });

  describe('generateCacheKey', () => {
    it('should generate correct cache key in format cache:http:<route_path>:<query_params_hash>', () => {
      const mockReq = {
        baseUrl: '/api/v1',
        path: '/experiences',
        query: { city: 'Riyadh', category: 'arts' },
      } as unknown as Request;

      const key1 = generateCacheKey(mockReq);

      const mockReqUnordered = {
        baseUrl: '/api/v1',
        path: '/experiences',
        query: { category: 'arts', city: 'Riyadh' },
      } as unknown as Request;

      const key2 = generateCacheKey(mockReqUnordered);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^cache:http:\/api\/v1\/experiences:[a-f0-9]{64}$/);
    });
  });

  describe('cacheMiddleware execution', () => {
    let app: express.Application;
    let dbCallCount: number;

    beforeEach(() => {
      dbCallCount = 0;
      app = express();
      app.use(express.json());

      app.get('/api/v1/experiences', cacheMiddleware(300), (_req: Request, res: Response) => {
        dbCallCount++;
        res.status(200).json({ success: true, count: dbCallCount, data: ['exp1', 'exp2'] });
      });
    });

    it('should return X-Cache: MISS on first request and X-Cache: HIT on second request', async () => {
      // First request -> MISS
      const res1 = await request(app).get('/api/v1/experiences');
      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBe('MISS');
      expect(res1.body.count).toBe(1);

      // Second request -> HIT
      const res2 = await request(app).get('/api/v1/experiences');
      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBe('HIT');
      expect(res2.body.count).toBe(1);
      expect(dbCallCount).toBe(1);
    });

    it('should purge cached catalog keys on invalidateExperienceCache', async () => {
      // Populate cache
      await request(app).get('/api/v1/experiences');
      const resHit = await request(app).get('/api/v1/experiences');
      expect(resHit.headers['x-cache']).toBe('HIT');

      // Invalidate cache
      await invalidateExperienceCache();

      // Subsequent request -> MISS
      const resAfterInvalidate = await request(app).get('/api/v1/experiences');
      expect(resAfterInvalidate.headers['x-cache']).toBe('MISS');
      expect(resAfterInvalidate.body.count).toBe(2);
    });

    it('Security Guardrail: should NEVER cache authenticated user requests', async () => {
      const authApp = express();
      authApp.get('/api/v1/experiences', cacheMiddleware(300), (_req: Request, res: Response) => {
        dbCallCount++;
        res.status(200).json({ success: true, count: dbCallCount });
      });

      // Request with Authorization header
      const res1 = await request(authApp)
        .get('/api/v1/experiences')
        .set('Authorization', 'Bearer sample_token');

      expect(res1.status).toBe(200);
      expect(res1.headers['x-cache']).toBeUndefined();

      // Second authenticated request
      const res2 = await request(authApp)
        .get('/api/v1/experiences')
        .set('Authorization', 'Bearer sample_token');

      expect(res2.status).toBe(200);
      expect(res2.headers['x-cache']).toBeUndefined();
      expect(dbCallCount).toBe(2);
    });
  });
});
