import express, { Request, Response } from 'express';
import request from 'supertest';
import hostRoutes from '../../../src/routes/host_portal.routes';

// Mock auth middleware to simulate authenticated host user
jest.mock('../../../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = { userId: 'host_test_123', phone: '+966500000000', role: 'host' };
    next();
  },
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock controller to isolate route & middleware behavior
jest.mock('../../../src/controllers/host_portal.controller', () => ({
  getDashboardSummary: (_req: Request, res: Response) => res.status(200).json({ success: true }),
  getHostExperiences: (_req: Request, res: Response) => res.status(200).json({ success: true }),
  scheduleSession: (_req: Request, res: Response) => res.status(201).json({ success: true }),
  updateSession: (_req: Request, res: Response) => res.status(200).json({ success: true }),
  getPayouts: (_req: Request, res: Response) => res.status(200).json({ success: true }),
  getExperienceRoster: (_req: Request, res: Response) => res.status(200).json({ success: true }),
  verifyPin: (_req: Request, res: Response) => res.status(200).json({ success: true, message: 'Check-in successful' }),
}));

describe('Host Portal Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/host', hostRoutes);
  });

  describe('Rate Limiting on /experiences/:id/verify-pin', () => {
    it('should allow verification attempts within the limit and block subsequent attempts with 429', async () => {
      const expId = 'exp_test_abc';

      // rateLimitPin points = 10 attempts
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post(`/api/v1/host/experiences/${expId}/verify-pin`)
          .send({ pin: '1234' });
        expect(res.status).toBe(200);
      }

      // 11th attempt should exceed the limit and receive 429
      const blockedRes = await request(app)
        .post(`/api/v1/host/experiences/${expId}/verify-pin`)
        .send({ pin: '1234' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body).toEqual({
        success: false,
        error: {
          code: 'PIN_RATE_LIMIT_EXCEEDED',
          message: 'Too many PIN verification attempts, please try again later',
        },
      });
      expect(blockedRes.headers['retry-after']).toBeDefined();
    });
  });
});
