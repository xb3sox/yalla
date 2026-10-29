import webPush from 'web-push';
import pool from '../../../src/config/database';
import { PushNotificationService } from '../../../src/services/pushNotification.service';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PushNotificationService();
  });

  describe('getVapidPublicKey', () => {
    it('should return non-empty VAPID public key', () => {
      const key = service.getVapidPublicKey();
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(10);
    });
  });

  describe('formatPayload', () => {
    it('should format payload with Arabic RTL defaults', () => {
      const payload = service.formatPayload({
        title: 'تأكيد الحجز',
        body: 'تم تأكيد حجزك بنجاح',
      });

      expect(payload).toEqual({
        title: 'تأكيد الحجز',
        body: 'تم تأكيد حجزك بنجاح',
        url: '/',
        dir: 'rtl',
        lang: 'ar',
        icon: '/pwa-192x192.png',
        badge: '/pwa-96x96.png',
        tag: undefined,
        data: {},
      });
    });

    it('should respect custom options if provided', () => {
      const payload = service.formatPayload({
        title: 'Booking Confirmed',
        body: 'Your booking is confirmed',
        url: '/arrival/res-123',
        dir: 'ltr',
        lang: 'en',
      });

      expect(payload.dir).toBe('ltr');
      expect(payload.lang).toBe('en');
      expect(payload.url).toBe('/arrival/res-123');
    });
  });

  describe('saveSubscription', () => {
    it('should insert or update subscription in DB', async () => {
      const mockResult = { rows: [{ id: 'sub-1', user_id: 'user-1' }] };
      (pool.query as jest.Mock).mockResolvedValueOnce(mockResult);

      const sub = await service.saveSubscription(
        'user-1',
        {
          endpoint: 'https://push.example.com/sub/123',
          keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
        },
        'Mozilla/5.0'
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO push_subscriptions'),
        ['user-1', 'https://push.example.com/sub/123', JSON.stringify({ p256dh: 'p256dh-key', auth: 'auth-secret' }), 'Mozilla/5.0']
      );
      expect(sub).toEqual(mockResult.rows[0]);
    });
  });

  describe('deleteSubscription', () => {
    it('should delete subscription by userId and endpoint', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const deleted = await service.deleteSubscription('user-1', 'https://push.example.com/sub/123');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM push_subscriptions'),
        ['user-1', 'https://push.example.com/sub/123']
      );
      expect(deleted).toBe(true);
    });
  });

  describe('sendPushNotificationToUser', () => {
    it('should do nothing if user has no subscriptions', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const res = await service.sendPushNotificationToUser('user-1', {
        title: 'Test',
        body: 'Message',
      });

      expect(res).toEqual({ sent: 0, failed: 0 });
      expect(webPush.sendNotification).not.toHaveBeenCalled();
    });

    it('should send notification to each active subscription', async () => {
      const mockSubs = [
        {
          id: 'sub-1',
          endpoint: 'https://push.example.com/1',
          keys: JSON.stringify({ p256dh: 'k1', auth: 'a1' }),
        },
      ];
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockSubs });
      (webPush.sendNotification as jest.Mock).mockResolvedValueOnce({});

      const res = await service.sendPushNotificationToUser('user-1', {
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(res).toEqual({ sent: 1, failed: 0 });
      expect(webPush.sendNotification).toHaveBeenCalledWith(
        { endpoint: 'https://push.example.com/1', keys: { p256dh: 'k1', auth: 'a1' } },
        expect.stringContaining('Test Title')
      );
    });

    it('should prune subscription on 410 Gone response', async () => {
      const mockSubs = [
        {
          id: 'sub-expired',
          endpoint: 'https://push.example.com/expired',
          keys: { p256dh: 'k1', auth: 'a1' },
        },
      ];
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: mockSubs });

      const goneError = new Error('Gone') as any;
      goneError.statusCode = 410;
      (webPush.sendNotification as jest.Mock).mockRejectedValueOnce(goneError);

      // Mock deletion query
      (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

      const res = await service.sendPushNotificationToUser('user-1', {
        title: 'Expired Sub',
        body: 'Test',
      });

      expect(res).toEqual({ sent: 0, failed: 1 });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM push_subscriptions WHERE id = $1'),
        ['sub-expired']
      );
    });
  });
});
