import { Request, Response, NextFunction } from 'express';
import { sanitizeInput, healthCheck } from '../../src/middleware/security.middleware';

describe('Security Middleware', () => {
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

    it('should return 503 with generic health status and without leaking raw database error messages when DB connection fails', async () => {
      const mockQuery = typeof jest !== 'undefined' ? jest.fn() : (globalThis as any).vi.fn();
      mockQuery.mockRejectedValue(new Error('FATAL: password authentication failed for user "postgres"'));

      if (typeof jest !== 'undefined') {
        jest.mock('../../src/config/database', () => ({
          default: { query: mockQuery },
        }));
      }

      await healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable',
          details: expect.objectContaining({
            status: 'unhealthy',
          }),
        },
      });

      const fnMock = res.json as any;
      const responsePayload = fnMock.mock ? fnMock.mock.calls[0][0] : fnMock.calls[0][0];
      expect(JSON.stringify(responsePayload)).not.toContain('FATAL: password authentication failed');
    });
  });
});
