import { Router } from 'express';
import { handleSmsStatusWebhook } from '../controllers/smsWebhook.controller';

const router = Router();

/**
 * @route   POST /api/v1/webhooks/sms/status
 * @route   GET /api/v1/webhooks/sms/status
 * @desc    Receive delivery status report (DLR) from SMS gateways (Twilio / Unifonic)
 * @access  Public (Gateway Callback)
 */
router.post('/sms/status', handleSmsStatusWebhook);
router.get('/sms/status', handleSmsStatusWebhook);

export default router;
