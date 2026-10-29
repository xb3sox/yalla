import { Router } from 'express';
import {
  getUserNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getPreferences,
  updatePreferences,
  sendTestNotification,
  sendBookingConfirmation,
  sendReconfirmationReminder,
  sendCancellationNotification,
} from '../controllers/notification.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/notifications/vapid-public-key
 * @desc    Get VAPID Public Key for Web Push
 * @access  Public
 */
router.get('/vapid-public-key', getVapidPublicKey);

/**
 * @route   POST /api/v1/notifications/subscribe
 * @desc    Save VAPID PushSubscription object
 * @access  Private
 */
router.post('/subscribe', authenticate, subscribe);

/**
 * @route   POST /api/v1/notifications/unsubscribe
 * @route   DELETE /api/v1/notifications/unsubscribe
 * @desc    Remove VAPID PushSubscription endpoint
 * @access  Private
 */
router.post('/unsubscribe', authenticate, unsubscribe);
router.delete('/unsubscribe', authenticate, unsubscribe);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications (supports ?category= and ?limit=)
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
 * @route   POST /api/v1/notifications/mark-all-read
 * @route   PATCH /api/v1/notifications/read-all
 * @desc    Mark all user notifications as read
 * @access  Private
 */
router.post('/mark-all-read', authenticate, markAllAsRead);
router.patch('/read-all', authenticate, markAllAsRead);

/**
 * @route   GET /api/v1/notifications/preferences
 * @desc    Get user notification category preferences
 * @access  Private
 */
router.get('/preferences', authenticate, getPreferences);

/**
 * @route   PUT /api/v1/notifications/preferences/:category
 * @desc    Update notification preference for a category
 * @access  Private
 */
router.put('/preferences/:category', authenticate, updatePreferences);

/**
 * @route   GET /api/v1/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', authenticate, getNotificationById);

/**
 * @route   POST /api/v1/notifications/:id/read
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.post('/:id/read', authenticate, markAsRead);
router.patch('/:id/read', authenticate, markAsRead);

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
