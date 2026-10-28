import notificationModel from '../../src/models/notification.model';
import userModel from '../../src/models/user.model';

// Rewritten against the current model contract: notifications carry
// body/body_ar and a delivery lifecycle (queued -> sent -> delivered /
// failed). "Unread" means state='queued'; there is no read flag and no
// delete (the previous suite tested a removed API generation).
describe('Notification Model', () => {
  let testUserId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    const user = await userModel.create({
      phone: '+966507777777',
      password: 'password123',
      display_name: 'Notification Test User',
      language: 'en',
      adult_declaration_accepted: true,
      terms_accepted: true,
    } as any);
    testUserId = user.id;
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('create', () => {
    it('should create a notification in queued state', async () => {
      const notification = await notificationModel.create({
        recipient_id: testUserId,
        type: 'email',
        title: 'Booking Confirmed',
        title_ar: 'تم تأكيد الحجز',
        body: 'Your booking has been confirmed',
        body_ar: 'تم تأكيد حجزك',
      } as any);

      expect(notification.id).toBeDefined();
      expect(notification.recipient_id).toBe(testUserId);
      expect(notification.type).toBe('email');
      expect(notification.title).toBe('Booking Confirmed');
      expect(notification.body).toBe('Your booking has been confirmed');
      expect(notification.state).toBe('queued');

      testNotificationId = notification.id;
    });
  });

  describe('findById', () => {
    it('should find notification by ID', async () => {
      const notification = await notificationModel.findById(testNotificationId);
      expect(notification?.id).toBe(testNotificationId);
      expect(notification?.recipient_id).toBe(testUserId);
    });

    it('should return null for non-existent ID', async () => {
      const notification = await notificationModel.findById(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(notification).toBeNull();
    });
  });

  describe('findByRecipient / getUnreadCount', () => {
    it('should find notifications by recipient and count unread (queued)', async () => {
      const notifications = await notificationModel.findByRecipient(testUserId);
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications.every((n) => n.recipient_id === testUserId)).toBe(true);

      const unread = await notificationModel.getUnreadCount(testUserId);
      expect(unread).toBeGreaterThan(0);
    });

    it('should respect limit and offset', async () => {
      const page = await notificationModel.findByRecipient(testUserId, 1, 0);
      expect(page.length).toBe(1);
    });
  });

  describe('delivery lifecycle', () => {
    it('should mark as sent, then delivered (drops unread count)', async () => {
      const sent = await notificationModel.markAsSent(testNotificationId);
      expect(sent.state).toBe('sent');
      expect(sent.sent_at).toBeDefined();

      const before = await notificationModel.getUnreadCount(testUserId);
      const delivered = await notificationModel.markAsDelivered(testNotificationId);
      expect(delivered.state).toBe('delivered');
      expect(delivered.delivered_at).toBeDefined();
      expect(await notificationModel.getUnreadCount(testUserId)).toBe(before);
    });

    it('should mark as failed', async () => {
      const created = await notificationModel.create({
        recipient_id: testUserId,
        type: 'sms',
        title: 'Failure probe',
        title_ar: 'اختبار',
        body: 'will fail',
        body_ar: 'سيفشل',
      } as any);

      const failed = await notificationModel.markAsFailed(created.id, 'provider down');
      expect(failed.state).toBe('failed');
    });

    it('should throw when sending a non-existent notification', async () => {
      await expect(
        notificationModel.send('00000000-0000-0000-0000-000000000000', 'email')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('templated senders (createAndSend)', () => {
    it('should send booking confirmation', async () => {
      const notification = await notificationModel.sendBookingConfirmation(
        testUserId,
        'Sunset Art Walk',
        'جولة فنية',
        '2027-03-01',
        '17:00'
      );

      expect(notification.title).toBe('Booking Confirmed');
      expect(notification.type).toBe('email');

      const stored = await notificationModel.findById(notification.id);
      expect(stored?.state).toBe('sent');
      expect(stored?.body).toContain('Sunset Art Walk');
    });

    it('should send reconfirmation reminder', async () => {
      const notification = await notificationModel.sendReconfirmationReminder(
        testUserId,
        'Sunset Art Walk',
        'جولة فنية',
        '2027-02-28'
      );
      expect(notification.title).toBe('Reconfirmation Required');
    });

    it('should send cancellation notification', async () => {
      const notification = await notificationModel.sendCancellationNotification(
        testUserId,
        'Sunset Art Walk',
        'جولة فنية'
      );
      expect(notification.title).toBe('Booking Cancelled');
    });

    it('should send waitlist notification', async () => {
      const notification = await notificationModel.sendWaitlistNotification(
        testUserId,
        'Sunset Art Walk',
        'جولة فنية'
      );
      expect(notification.title).toBe('Added to Waitlist');
    });

    it('should send seat offered notification', async () => {
      const notification = await notificationModel.sendSeatOfferedNotification(
        testUserId,
        'Sunset Art Walk',
        'جولة فنية',
        '2027-02-28'
      );
      expect(notification.title).toBe('Seat Offered');
    });
  });
});
