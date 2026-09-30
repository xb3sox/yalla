import { Router } from 'express';
import {
  getUserNotifications,
  getNotificationById,
  markAsRead,
  getUnreadCount,
  sendTestNotification,
  sendBookingConfirmation,
  sendReconfirmationReminder,
  sendCancellationNotification,
} from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticate, getUserNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', authenticate, getUnreadCount);

/**
 * @route   GET /api/v1/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', authenticate, getNotificationById);

/**
 * @route   POST /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', authenticate, markAsRead);

/**
 * @route   POST /api/v1/notifications/test
 * @desc    Send test notification (staff only)
 * @access  Private (Staff)
 */
router.post(
  '/test',
  authenticate,
  authorize('operations', 'support', 'admin'),
  sendTestNotification
);

/**
 * @route   POST /api/v1/notifications/booking-confirmation
 * @desc    Send booking confirmation (staff only)
 * @access  Private (Staff)
 */
router.post(
  '/booking-confirmation',
  authenticate,
  authorize('operations', 'admin'),
  sendBookingConfirmation
);

/**
 * @route   POST /api/v1/notifications/reconfirmation-reminder
 * @desc    Send reconfirmation reminder (staff only)
 * @access  Private (Staff)
 */
router.post(
  '/reconfirmation-reminder',
  authenticate,
  authorize('operations', 'admin'),
  sendReconfirmationReminder
);

/**
 * @route   POST /api/v1/notifications/cancellation
 * @desc    Send cancellation notification (staff only)
 * @access  Private (Staff)
 */
router.post(
  '/cancellation',
  authenticate,
  authorize('operations', 'admin'),
  sendCancellationNotification
);

export default router;
