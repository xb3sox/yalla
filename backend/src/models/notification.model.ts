import pool from '../config/database';
import logger from '../utils/logger';
import pushNotificationService from '../services/pushNotification.service';
import { SmsService } from '../services/sms/sms.service';
import userModel from './user.model';

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  state: string;
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
  category?: string;
  action_url?: string;
  read_at?: Date;
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
  category?: string;
  action_url?: string;
}

export interface SendNotificationInput {
  recipient_id: string;
  type: 'email' | 'sms' | 'push';
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
  category?: string;
  action_url?: string;
}

class NotificationModel {
  /**
   * Create a notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const anyIn = input as any;
    const recipientId = input.recipient_id || anyIn.recipientId;
    const category = input.category || anyIn.category || 'booking';
    const actionUrl = input.action_url || anyIn.actionUrl || null;

    const query = `
      INSERT INTO notifications (
        recipient_id, type, state, title, title_ar, body, body_ar, category, action_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      recipientId,
      input.type,
      'queued',
      input.title,
      input.title_ar || anyIn.titleAr || '',
      input.body,
      input.body_ar || anyIn.bodyAr || '',
      category,
      actionUrl,
    ];
    
    const result = await pool.query(query, values);
    logger.info('Notification created', { 
      notificationId: result.rows[0].id,
      recipientId,
      type: input.type,
      category,
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
   * Get notifications for user with optional category filtering
   */
  async findByRecipient(
    recipientId: string,
    limit: number = 50,
    offset: number = 0,
    category?: string
  ): Promise<Notification[]> {
    if (category && category !== 'all') {
      const query = `
        SELECT * FROM notifications
        WHERE recipient_id = $1 AND category = $2
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `;
      const result = await pool.query(query, [recipientId, category, limit, offset]);
      return result.rows;
    }

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
      WHERE recipient_id = $1 AND (state = 'queued' OR state = 'sent' OR delivered_at IS NULL)
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
   * Mark notification as delivered / read
   */
  async markAsDelivered(notificationId: string): Promise<Notification> {
    const query = `
      UPDATE notifications
      SET state = 'delivered', delivered_at = CURRENT_TIMESTAMP, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId]);
    
    logger.info('Notification marked as delivered', { notificationId });
    
    return result.rows[0];
  }

  /**
   * Mark all notifications as delivered / read for recipient
   */
  async markAllAsDelivered(recipientId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET state = 'delivered', delivered_at = CURRENT_TIMESTAMP, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE recipient_id = $1 AND (state != 'delivered' OR delivered_at IS NULL)
    `;
    const result = await pool.query(query, [recipientId]);
    return result.rowCount || 0;
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
      await this.markAsSent(notificationId);
      
      logger.info('Email notification sent', { 
        notificationId,
        recipientId: notification.recipient_id 
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
      const user = await userModel.findById(notification.recipient_id);
      if (user && user.phone) {
        await SmsService.sendSms({
          userId: notification.recipient_id,
          to: user.phone,
          messageType: 'host_announcement',
          params: {
            title: notification.title,
            message: notification.body,
            link: 'https://yalla.app',
          },
          userLanguage: user.language === 'ar' ? 'ar' : 'en',
        });
      }
      await this.markAsSent(notificationId);
      
      logger.info('SMS notification sent', { 
        notificationId,
        recipientId: notification.recipient_id 
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
      await pushNotificationService.sendPushNotificationToUser(notification.recipient_id, {
        title: notification.title_ar || notification.title,
        body: notification.body_ar || notification.body,
        url: (notification as any).action_url || '/',
        dir: 'rtl',
        lang: 'ar',
      });
      await this.markAsSent(notificationId);
      
      logger.info('Push notification sent', { 
        notificationId,
        recipientId: notification.recipient_id,
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
    const notification = await this.create(input);
    await this.send(notification.id, input.type);
    return notification;
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<any[]> {
    const query = `
      SELECT category, email_enabled, sms_enabled, push_enabled
      FROM notification_preferences
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Update user notification preferences
   */
  async updatePreference(
    userId: string,
    category: string,
    prefs: { emailEnabled?: boolean; smsEnabled?: boolean; pushEnabled?: boolean }
  ): Promise<any> {
    const query = `
      INSERT INTO notification_preferences (user_id, category, email_enabled, sms_enabled, push_enabled)
      VALUES ($1, $2, COALESCE($3, true), COALESCE($4, true), COALESCE($5, true))
      ON CONFLICT (user_id, category)
      DO UPDATE SET
        email_enabled = COALESCE($3, notification_preferences.email_enabled),
        sms_enabled = COALESCE($4, notification_preferences.sms_enabled),
        push_enabled = COALESCE($5, notification_preferences.push_enabled),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await pool.query(query, [
      userId,
      category,
      prefs.emailEnabled,
      prefs.smsEnabled,
      prefs.pushEnabled,
    ]);
    return result.rows[0];
  }

  /**
   * Send reconfirmation reminder
   */
  async sendReconfirmationReminder(recipientId: string, experienceTitle: string, experienceTitleAr: string, expiryDate: string): Promise<Notification> {
    return await this.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Action Required: Reconfirm Your Attendance',
      title_ar: 'مطلوب إجراء: تأكيد الحضور',
      body: `Please reconfirm your attendance for "${experienceTitle}" before ${expiryDate} to keep your spot and receive the exact location.`,
      body_ar: `يرجى إعادة تأكيد حضورك لـ "${experienceTitleAr}" قبل ${expiryDate} للاحتفاظ بمكانك واستلام الموقع الدقيق.`,
      category: 'reminder',
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
      category: 'booking',
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
      category: 'booking',
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
      category: 'booking',
    });
  }
}

export default new NotificationModel();
