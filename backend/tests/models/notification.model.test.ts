import notificationModel from '../src/models/notification.model';
import userModel from '../src/models/user.model';
import pool from '../src/config/database';

describe('Notification Model', () => {
  let testUserId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    // Create test user
    const user = await userModel.create({
      phone: '+966507777777',
      password: 'password123',
      displayName: 'Notification Test User',
      language: 'en',
      adultDeclarationAccepted: true,
      termsAccepted: true,
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up
    if (testNotificationId) {
      await pool.query('DELETE FROM notifications WHERE id = $1', [testNotificationId]);
    }
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const notification = await notificationModel.create({
        recipientId: testUserId,
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        titleAr: 'تم تأكيد الحجز',
        message: 'Your booking has been confirmed',
        messageAr: 'تم تأكيد حجزك',
        relatedEntityType: 'reservation',
        relatedEntityId: 'test-reservation-id',
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.recipientId).toBe(testUserId);
      expect(notification.type).toBe('booking_confirmation');
      expect(notification.title).toBe('Booking Confirmed');
      expect(notification.titleAr).toBe('تم تأكيد الحجز');
      expect(notification.status).toBe('pending');
      expect(notification.read).toBe(false);

      testNotificationId = notification.id;
    });
  });

  describe('findById', () => {
    it('should find notification by ID', async () => {
      const notification = await notificationModel.findById(testNotificationId);

      expect(notification).toBeDefined();
      expect(notification?.id).toBe(testNotificationId);
      expect(notification?.recipientId).toBe(testUserId);
    });

    it('should return null for non-existent ID', async () => {
      const notification = await notificationModel.findById(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(notification).toBeNull();
    });
  });

  describe('findByRecipient', () => {
    it('should find notifications by recipient ID', async () => {
      // Create multiple notifications
      await notificationModel.create({
        recipientId: testUserId,
        type: 'reminder',
        title: 'Reminder',
        titleAr: 'تذكير',
        message: 'Experience starts soon',
        messageAr: 'التجربة تبدأ قريباً',
      });

      const notifications = await notificationModel.findByRecipient(testUserId);

      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.every((n) => n.recipientId === testUserId)).toBe(true);
    });

    it('should return empty array for user with no notifications', async () => {
      const newUser = await userModel.create({
        phone: '+966506666666',
        password: 'password123',
        displayName: 'No Notifications User',
        language: 'en',
        adultDeclarationAccepted: true,
        termsAccepted: true,
      });

      const notifications = await notificationModel.findByRecipient(newUser.id);

      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBe(0);

      await pool.query('DELETE FROM users WHERE id = $1', [newUser.id]);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      const count = await notificationModel.getUnreadCount(testUserId);

      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = await notificationModel.create({
        recipientId: testUserId,
        type: 'test',
        title: 'Test',
        titleAr: 'اختبار',
        message: 'Test message',
        messageAr: 'رسالة اختبار',
      });

      const updated = await notificationModel.markAsRead(notification.id);

      expect(updated).toBeDefined();
      expect(updated.read).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('should throw error for non-existent notification', async () => {
      await expect(
        notificationModel.markAsRead('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      // Create multiple unread notifications
      await notificationModel.create({
        recipientId: testUserId,
        type: 'test1',
        title: 'Test 1',
        titleAr: 'اختبار 1',
        message: 'Test message 1',
        messageAr: 'رسالة اختبار 1',
      });

      await notificationModel.create({
        recipientId: testUserId,
        type: 'test2',
        title: 'Test 2',
        titleAr: 'اختبار 2',
        message: 'Test message 2',
        messageAr: 'رسالة اختبار 2',
      });

      const count = await notificationModel.markAllAsRead(testUserId);

      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);

      // Verify all are read
      const unreadCount = await notificationModel.getUnreadCount(testUserId);
      expect(unreadCount).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      const notification = await notificationModel.create({
        recipientId: testUserId,
        type: 'to_delete',
        title: 'To Delete',
        titleAr: 'للحذف',
        message: 'This will be deleted',
        messageAr: 'سيتم حذف هذا',
      });

      await notificationModel.delete(notification.id);

      const deleted = await notificationModel.findById(notification.id);
      expect(deleted).toBeNull();
    });

    it('should throw error for non-existent notification', async () => {
      await expect(
        notificationModel.delete('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation notification', async () => {
      const notification = await notificationModel.sendBookingConfirmation(
        testUserId,
        'Test Experience',
        'تجربة اختبارية',
        '2026-03-01',
        '10:00'
      );

      expect(notification).toBeDefined();
      expect(notification.recipientId).toBe(testUserId);
      expect(notification.type).toBe('booking_confirmation');
      expect(notification.title).toContain('Test Experience');
      expect(notification.titleAr).toContain('تجربة اختبارية');
    });
  });

  describe('sendReconfirmationReminder', () => {
    it('should send reconfirmation reminder notification', async () => {
      const notification = await notificationModel.sendReconfirmationReminder(
        testUserId,
        'Test Experience',
        'تجربة اختبارية',
        '2026-02-28'
      );

      expect(notification).toBeDefined();
      expect(notification.recipientId).toBe(testUserId);
      expect(notification.type).toBe('reconfirmation_reminder');
      expect(notification.title).toContain('Test Experience');
    });
  });

  describe('sendCancellationNotification', () => {
    it('should send cancellation notification', async () => {
      const notification = await notificationModel.sendCancellationNotification(
        testUserId,
        'Test Experience',
        'تجربة اختبارية'
      );

      expect(notification).toBeDefined();
      expect(notification.recipientId).toBe(testUserId);
      expect(notification.type).toBe('cancellation');
      expect(notification.title).toContain('Test Experience');
    });
  });

  describe('sendWaitlistNotification', () => {
    it('should send waitlist notification', async () => {
      const notification = await notificationModel.sendWaitlistNotification(
        testUserId,
        'Test Experience',
        'تجربة اختبارية'
      );

      expect(notification).toBeDefined();
      expect(notification.recipientId).toBe(testUserId);
      expect(notification.type).toBe('waitlist');
      expect(notification.title).toContain('Test Experience');
    });
  });

  describe('sendSeatOfferedNotification', () => {
    it('should send seat offered notification', async () => {
      const notification = await notificationModel.sendSeatOfferedNotification(
        testUserId,
        'Test Experience',
        'تجربة اختبارية',
        '2026-02-28'
      );

      expect(notification).toBeDefined();
      expect(notification.recipientId).toBe(testUserId);
      expect(notification.type).toBe('seat_offered');
      expect(notification.title).toContain('Test Experience');
    });
  });
});
