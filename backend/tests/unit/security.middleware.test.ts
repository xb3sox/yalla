import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import pool from '../../src/config/database';
import { sanitizeInput, healthCheck, securityHeaders } from '../../src/middleware/security.middleware';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Security Middleware', () => {
  describe('securityHeaders', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(securityHeaders);
      app.get('/test', (_req, res) => {
        res.status(200).send('OK');
      });
    });

    it('should set Content-Security-Policy header with strict directives', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['content-security-policy']).toBeDefined();
      const csp = response.headers['content-security-policy'];

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
      expect(csp).toContain("img-src 'self' data: https:");
      expect(csp).toContain("connect-src 'self' https:");
      expect(csp).toContain("font-src 'self' https: data:");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("media-src 'self'");
      expect(csp).toContain("frame-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it('should set Strict-Transport-Security header with subdomains and max-age of 1 year', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
    });

    it('should set X-Content-Type-Options: nosniff header', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set frameguard to DENY (X-Frame-Options: DENY)', async () => {
      const response = await request(app).get('/test');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });
  });

  describe('sanitizeInput', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        body: {},
        query: {},
        params: {},
      };
      res = {};
      next = (typeof jest !== 'undefined' ? jest.fn() : (globalThis as any).vi.fn()) as unknown as NextFunction;
    });

    it('should sanitize HTML tags from string values in body, query, and params', () => {
      req.body = { comment: '<script>alert("xss")</script>Hello' };
      req.query = { search: '<b>bold</b>' };
      req.params = { id: '<123>' };

      sanitizeInput(req as Request, res as Response, next);

      expect(req.body).toEqual({ comment: 'scriptalert("xss")/scriptHello' });
      expect(req.query).toEqual({ search: 'bbold/b' });
      expect(req.params).toEqual({ id: '123' });
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should strip prototype pollution keys like __proto__, constructor, and prototype', () => {
      const payload = JSON.parse(
        '{"title": "Normal", "__proto__": {"polluted": "yes"}, "constructor": {"polluted": "yes"}, "prototype": {"polluted": "yes"}}'
      );
      req.body = payload;

      sanitizeInput(req as Request, res as Response, next);

      expect(req.body).toEqual({ title: 'Normal' });
      expect((req.body as any).polluted).toBeUndefined();
      expect(({} as any).polluted).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('healthCheck', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;

    beforeEach(() => {
      const fn = typeof jest !== 'undefined' ? jest.fn : (globalThis as any).vi.fn;
      req = {};
      res = {
        status: fn().mockReturnThis(),
        json: fn().mockReturnThis(),
      };
    });

    it('should return 200 when database connection is healthy', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      await healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          message: 'OK',
        }),
      });
    });

    it('should return 503 with generic error message and without leaking raw database error messages when DB connection fails', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(
        new Error('FATAL: password authentication failed for user "postgres"')
      );

      await healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable',
          details: expect.objectContaining({
            message: 'Service unavailable',
          }),
        },
      });

      const fnMock = res.json as any;
      const responsePayload = fnMock.mock ? fnMock.mock.calls[0][0] : fnMock.calls[0][0];
      expect(JSON.stringify(responsePayload)).not.toContain('FATAL: password authentication failed');
    });
  });
});
