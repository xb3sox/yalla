import { Router } from 'express';
import { handleSmsStatusWebhook } from '../controllers/smsWebhook.controller';
import { rateLimitGlobal } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @route   POST /api/v1/webhooks/sms/status
 * @route   GET /api/v1/webhooks/sms/status
 * @desc    Receive delivery status report (DLR) from SMS gateways (Twilio / Unifonic)
 * @access  Public (Gateway Callback)
 */
// Apply global rate limiting to prevent abuse and payload flooding on public gateway callbacks
router.use('/sms/status', rateLimitGlobal);

router.post('/sms/status', handleSmsStatusWebhook);
router.get('/sms/status', handleSmsStatusWebhook);

export default router;
