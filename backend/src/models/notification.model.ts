import pool from '../config/database';
import logger from '../utils/logger';

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  state: string;
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
  created_at: Date;
  sent_at?: Date;
  delivered_at?: Date;
  updated_at: Date;
}

export interface CreateNotificationInput {
  recipient_id: string;
  type: string;
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
}

export interface SendNotificationInput {
  recipient_id: string;
  type: 'email' | 'sms' | 'push';
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
}

class NotificationModel {
  /**
   * Create a notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const query = `
      INSERT INTO notifications (
        recipient_id, type, state, title, title_ar, body, body_ar
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      input.recipient_id,
      input.type,
      'queued',
      input.title,
      input.title_ar,
      input.body,
      input.body_ar,
    ];
    
    const result = await pool.query(query, values);
    logger.info('Notification created', { 
      notificationId: result.rows[0].id,
      recipientId: input.recipient_id,
      type: input.type 
    });
    
    return result.rows[0];
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<Notification | null> {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Get notifications for user
   */
  async findByRecipient(recipientId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE recipient_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [recipientId, limit, offset]);
    
    return result.rows;
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE recipient_id = $1 AND state = 'queued'
    `;
    const result = await pool.query(query, [recipientId]);
    
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Mark notification as sent
   */
  async markAsSent(notificationId: string): Promise<Notification> {
    const query = `
      UPDATE notifications
      SET state = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    
    logger.info('Notification marked as sent', { notificationId });
    
    return result.rows[0];
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(notificationId: string): Promise<Notification> {
    const query = `
      UPDATE notifications
      SET state = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    
    logger.info('Notification marked as delivered', { notificationId });
    
    return result.rows[0];
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(notificationId: string, error: string): Promise<Notification> {
    const query = `
      UPDATE notifications
      SET state = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    
    logger.error('Notification failed', { notificationId, error });
    
    return result.rows[0];
  }

  /**
   * Send notification via email
   */
  async sendEmail(notificationId: string): Promise<void> {
    const notification = await this.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    try {
      // NOTE: Email service integration placeholder
      // In production, integrate with SendGrid, AWS SES, or similar service
      // For MVP, we track notification state in database without actual email delivery
      // To enable real email sending, implement email service client here
      await this.markAsSent(notificationId);
      
      logger.info('Email notification queued', { 
        notificationId,
        recipientId: notification.recipient_id,
        note: 'Email service not configured - notification tracked in database only'
      });
    } catch (error: any) {
      await this.markAsFailed(notificationId, error.message);
      throw error;
    }
  }

  /**
   * Send notification via SMS
   */
  async sendSMS(notificationId: string): Promise<void> {
    const notification = await this.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    try {
      // NOTE: SMS service integration placeholder
      // In production, integrate with Twilio, AWS SNS, or similar service
      // For MVP, we track notification state in database without actual SMS delivery
      // To enable real SMS sending, implement SMS service client here
      await this.markAsSent(notificationId);
      
      logger.info('SMS notification queued', { 
        notificationId,
        recipientId: notification.recipient_id,
        note: 'SMS service not configured - notification tracked in database only'
      });
    } catch (error: any) {
      await this.markAsFailed(notificationId, error.message);
      throw error;
    }
  }

  /**
   * Send notification via push
   */
  async sendPush(notificationId: string): Promise<void> {
    const notification = await this.findById(notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }

    try {
      // NOTE: Push notification service integration placeholder
      // In production, integrate with Firebase Cloud Messaging, OneSignal, or similar service
      // For MVP, we track notification state in database without actual push delivery
      // To enable real push notifications, implement push service client here
      await this.markAsSent(notificationId);
      
      logger.info('Push notification queued', { 
        notificationId,
        recipientId: notification.recipient_id,
        note: 'Push service not configured - notification tracked in database only'
      });
    } catch (error: any) {
      await this.markAsFailed(notificationId, error.message);
      throw error;
    }
  }

  /**
   * Send notification based on type
   */
  async send(notificationId: string, type: 'email' | 'sms' | 'push'): Promise<void> {
    switch (type) {
      case 'email':
        await this.sendEmail(notificationId);
        break;
      case 'sms':
        await this.sendSMS(notificationId);
        break;
      case 'push':
        await this.sendPush(notificationId);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }

  /**
   * Create and send notification
   */
  async createAndSend(input: SendNotificationInput): Promise<Notification> {
    // Create notification
    const notification = await this.create({
      recipient_id: input.recipient_id,
      type: input.type,
      title: input.title,
      title_ar: input.title_ar,
      body: input.body,
      body_ar: input.body_ar,
    });

    // Send notification
    await this.send(notification.id, input.type);

    return notification;
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(recipientId: string, experienceTitle: string, experienceTitleAr: string, date: string, time: string): Promise<Notification> {
    return await this.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Booking Confirmed',
      title_ar: 'تم تأكيد الحجز',
      body: `Your booking for "${experienceTitle}" on ${date} at ${time} has been confirmed.`,
      body_ar: `تم تأكيد حجزك لـ "${experienceTitleAr}" في ${date} الساعة ${time}.`,
    });
  }

  /**
   * Send reconfirmation reminder
   */
  async sendReconfirmationReminder(recipientId: string, experienceTitle: string, experienceTitleAr: string, expiryDate: string): Promise<Notification> {
    return await this.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Reconfirmation Required',
      title_ar: 'إعادة التأكيد مطلوبة',
      body: `Please reconfirm your attendance for "${experienceTitle}" by ${expiryDate}.`,
      body_ar: `يرجى إعادة تأكيد حضورك لـ "${experienceTitleAr}" قبل ${expiryDate}.`,
    });
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(recipientId: string, experienceTitle: string, experienceTitleAr: string): Promise<Notification> {
    return await this.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Booking Cancelled',
      title_ar: 'تم إلغاء الحجز',
      body: `Your booking for "${experienceTitle}" has been cancelled.`,
      body_ar: `تم إلغاء حجزك لـ "${experienceTitleAr}".`,
    });
  }

  /**
   * Send waitlist notification
   */
  async sendWaitlistNotification(recipientId: string, experienceTitle: string, experienceTitleAr: string): Promise<Notification> {
    return await this.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Added to Waitlist',
      title_ar: 'تمت إضافتك إلى قائمة الانتظار',
      body: `You have been added to the waitlist for "${experienceTitle}". We'll notify you when a spot opens.`,
      body_ar: `تمت إضافتك إلى قائمة الانتظار لـ "${experienceTitleAr}". سنُعلمك عند توفر مكان.`,
    });
  }

  /**
   * Send seat offered notification
   */
  async sendSeatOfferedNotification(recipientId: string, experienceTitle: string, experienceTitleAr: string, expiryDate: string): Promise<Notification> {
    return await this.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Seat Offered',
      title_ar: 'تم عرض مقعد',
      body: `A seat is now available for "${experienceTitle}". Please confirm by ${expiryDate}.`,
      body_ar: `متوفر الآن مقعد لـ "${experienceTitleAr}". يرجى التأكيد قبل ${expiryDate}.`,
    });
  }
}

export default new NotificationModel();
