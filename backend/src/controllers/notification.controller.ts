import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import notificationModel from '../models/notification.model';
import pushNotificationService from '../services/pushNotification.service';
import logger from '../utils/logger';
import { EmailService } from '../services/email.service';

/**
 * Get VAPID Public Key
 */
export const getVapidPublicKey = async (_req: AuthRequest, res: Response) => {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    res.json({
      success: true,
      data: { publicKey },
    });
  } catch (error: any) {
    logger.error('Get VAPID public key failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_VAPID_KEY_FAILED',
        message: 'Failed to retrieve VAPID public key',
      },
    });
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const subscriptionData = req.body.subscription || req.body;
    const { endpoint, keys } = subscriptionData || {};

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUBSCRIPTION',
          message: 'Invalid push subscription payload. Endpoint and keys (p256dh, auth) are required.',
        },
      });
    }

    const userAgent = req.headers['user-agent'];
    const saved = await pushNotificationService.saveSubscription(
      req.user.userId,
      { endpoint, keys },
      userAgent
    );

    res.status(201).json({
      success: true,
      data: { subscription: saved },
      message: 'Push subscription saved successfully',
    });
  } catch (error: any) {
    logger.error('Push subscription failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIBE_FAILED',
        message: 'Failed to save push subscription',
      },
    });
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const endpoint = req.body.endpoint || req.query.endpoint;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ENDPOINT',
          message: 'Subscription endpoint is required',
        },
      });
    }

    await pushNotificationService.deleteSubscription(req.user.userId, endpoint as string);

    res.json({
      success: true,
      message: 'Push subscription removed successfully',
    });
  } catch (error: any) {
    logger.error('Unsubscribe failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UNSUBSCRIBE_FAILED',
        message: 'Failed to unsubscribe from push notifications',
      },
    });
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const notifications = await notificationModel.findByRecipient(
      req.user.userId,
      limit,
      offset
    );

    const unreadCount = await notificationModel.getUnreadCount(req.user.userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
      meta: {
        limit,
        offset,
        count: notifications.length,
      },
    });
  } catch (error: any) {
    logger.error('Get notifications failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NOTIFICATIONS_FAILED',
        message: 'Failed to get notifications',
      },
    });
  }
};

/**
 * Get notification by ID
 */
export const getNotificationById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const notification = await notificationModel.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    // Check ownership
    if (notification.recipient_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this notification',
        },
      });
    }

    res.json({
      success: true,
      data: { notification },
    });
  } catch (error: any) {
    logger.error('Get notification failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NOTIFICATION_FAILED',
        message: 'Failed to get notification',
      },
    });
  }
};

/**
 * Mark notification as read (delivered)
 */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const notification = await notificationModel.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found',
        },
      });
    }

    // Check ownership
    if (notification.recipient_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to mark this notification',
        },
      });
    }

    const updated = await notificationModel.markAsDelivered(id);

    logger.info('Notification marked as read', { 
      notificationId: id,
      userId: req.user.userId 
    });

    res.json({
      success: true,
      data: { notification: updated },
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    logger.error('Mark notification as read failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'MARK_READ_FAILED',
        message: 'Failed to mark notification as read',
      },
    });
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const count = await notificationModel.getUnreadCount(req.user.userId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    logger.error('Get unread count failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_UNREAD_COUNT_FAILED',
        message: 'Failed to get unread count',
      },
    });
  }
};

/**
 * Send test notification (staff only)
 */
export const sendTestNotification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { recipientId, type, title, titleAr, body, bodyAr } = req.body;

    const notification = await notificationModel.createAndSend({
      recipient_id: recipientId,
      type,
      title,
      title_ar: titleAr,
      body,
      body_ar: bodyAr,
    });

    logger.info('Test notification sent', { 
      staffId: req.user.userId,
      notificationId: notification.id 
    });

    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Test notification sent successfully',
    });
  } catch (error: any) {
    logger.error('Send test notification failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_NOTIFICATION_FAILED',
        message: 'Failed to send notification',
      },
    });
  }
};

/**
 * Send booking confirmation notification
 */
export const sendBookingConfirmation = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { recipientId, experienceTitle, experienceTitleAr, date, time } = req.body;

    const emailContent = EmailService.generateBookingConfirmationEmail({
      experienceTitle,
      experienceTitleAr,
      date,
      time
    });

    const notification = await notificationModel.createAndSend({
      recipient_id: recipientId,
      type: 'email',
      title: 'Booking Confirmed',
      title_ar: 'تم تأكيد الحجز',
      body: emailContent.html,
      body_ar: emailContent.text
    });

    logger.info('Booking confirmation sent', { 
      notificationId: notification.id,
      recipientId 
    });

    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Booking confirmation sent successfully',
    });
  } catch (error: any) {
    logger.error('Send booking confirmation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_BOOKING_CONFIRMATION_FAILED',
        message: 'Failed to send booking confirmation',
      },
    });
  }
};

/**
 * Send reconfirmation reminder
 */
export const sendReconfirmationReminder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { recipientId, experienceTitle, experienceTitleAr, expiryDate } = req.body;

    const notification = await notificationModel.sendReconfirmationReminder(
      recipientId,
      experienceTitle,
      experienceTitleAr,
      expiryDate
    );

    logger.info('Reconfirmation reminder sent', { 
      notificationId: notification.id,
      recipientId 
    });

    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Reconfirmation reminder sent successfully',
    });
  } catch (error: any) {
    logger.error('Send reconfirmation reminder failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_RECONFIRMATION_REMINDER_FAILED',
        message: 'Failed to send reconfirmation reminder',
      },
    });
  }
};

/**
 * Send cancellation notification
 */
export const sendCancellationNotification = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { recipientId, experienceTitle, experienceTitleAr } = req.body;

    const notification = await notificationModel.sendCancellationNotification(
      recipientId,
      experienceTitle,
      experienceTitleAr
    );

    logger.info('Cancellation notification sent', { 
      notificationId: notification.id,
      recipientId 
    });

    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Cancellation notification sent successfully',
    });
  } catch (error: any) {
    logger.error('Send cancellation notification failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_CANCELLATION_NOTIFICATION_FAILED',
        message: 'Failed to send cancellation notification',
      },
    });
  }
};
