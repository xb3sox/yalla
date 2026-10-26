import express from 'express';
import request from 'supertest';
import notificationRoutes from '../../../src/routes/notification.routes';
import pushNotificationService from '../../../src/services/pushNotification.service';

// Mock auth middleware to control authenticated state
jest.mock('../../../src/middleware/auth.middleware', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = { userId: 'user-123', role: 'participant' };
    }
    next();
  },
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock notification controller models / services
jest.mock('../../../src/services/pushNotification.service', () => ({
  __esModule: true,
  default: {
    getVapidPublicKey: jest.fn().mockReturnValue('mock-vapid-public-key'),
    saveSubscription: jest.fn().mockResolvedValue({ id: 'sub-1' }),
    deleteSubscription: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../../src/models/notification.model', () => ({
  __esModule: true,
  default: {
    findByRecipient: jest.fn().mockResolvedValue([]),
    getUnreadCount: jest.fn().mockResolvedValue(0),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationRoutes);

describe('Notification Routes - Web Push Subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/notifications/vapid-public-key', () => {
    it('should return 200 with VAPID public key without authentication', async () => {
      const res = await request(app).get('/api/v1/notifications/vapid-public-key');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: { publicKey: 'mock-vapid-public-key' },
      });
      expect(pushNotificationService.getVapidPublicKey).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/notifications/subscribe', () => {
    it('should return 401 if user is unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/subscribe')
        .send({
          endpoint: 'https://push.example.com/sub/1',
          keys: { p256dh: 'p256', auth: 'auth' },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if subscription payload is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ endpoint: 'https://push.example.com/sub/1' }); // missing keys

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 201 and save subscription when authenticated and valid', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/subscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({
          subscription: {
            endpoint: 'https://push.example.com/sub/1',
            keys: { p256dh: 'p256key', auth: 'authkey' },
          },
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        data: { subscription: { id: 'sub-1' } },
        message: 'Push subscription saved successfully',
      });
      expect(pushNotificationService.saveSubscription).toHaveBeenCalledWith(
        'user-123',
        { endpoint: 'https://push.example.com/sub/1', keys: { p256dh: 'p256key', auth: 'authkey' } },
        undefined
      );
    });
  });

  describe('DELETE /api/v1/notifications/unsubscribe', () => {
    it('should return 401 if user is unauthenticated', async () => {
      const res = await request(app)
        .delete('/api/v1/notifications/unsubscribe')
        .send({ endpoint: 'https://push.example.com/sub/1' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if endpoint is missing', async () => {
      const res = await request(app)
        .delete('/api/v1/notifications/unsubscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 200 and unsubscribe when authenticated and valid endpoint provided', async () => {
      const res = await request(app)
        .delete('/api/v1/notifications/unsubscribe')
        .set('Authorization', 'Bearer valid-token')
        .send({ endpoint: 'https://push.example.com/sub/1' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Push subscription removed successfully',
      });
      expect(pushNotificationService.deleteSubscription).toHaveBeenCalledWith(
        'user-123',
        'https://push.example.com/sub/1'
      );
    });
  });
});
