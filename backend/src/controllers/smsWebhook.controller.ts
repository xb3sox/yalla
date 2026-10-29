import { Request, Response } from 'express';
import smsLogModel from '../models/smsLog.model';
import logger from '../utils/logger';

/**
 * Normalizes delivery status strings from various SMS gateways into standard SmsLog status
 */
function normalizeSmsStatus(rawStatus: string): 'queued' | 'sent' | 'delivered' | 'failed' {
  if (!rawStatus) return 'sent';
  const lower = String(rawStatus).toLowerCase();

  if (lower.includes('deliver')) {
    return 'delivered';
  }
  if (lower.includes('fail') || lower.includes('undeliver') || lower.includes('reject') || lower.includes('error')) {
    return 'failed';
  }
  if (lower.includes('queue')) {
    return 'queued';
  }
  if (lower.includes('sent') || lower.includes('dispatch')) {
    return 'sent';
  }

  return 'sent';
}

/**
 * Webhook handler for SMS delivery status updates (Twilio & Unifonic)
 */
export const handleSmsStatusWebhook = async (req: Request, res: Response) => {
  try {
    const payload = { ...req.query, ...req.body };

    // Support Twilio fields: MessageSid / SmsSid, MessageStatus / SmsStatus
    // Support Unifonic fields: id / messageId / MessageID, status / Status
    const providerMessageId =
      payload.MessageSid ||
      payload.SmsSid ||
      payload.messageId ||
      payload.MessageID ||
      payload.id;

    const rawStatus =
      payload.MessageStatus ||
      payload.SmsStatus ||
      payload.status ||
      payload.Status ||
      payload.message_status;

    const errorMessage =
      payload.ErrorMessage ||
      payload.error_message ||
      payload.error ||
      payload.ErrorCode ||
      null;

    if (!providerMessageId) {
      logger.warn('[SmsWebhook] Webhook payload missing messageId', { payload });
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MESSAGE_ID',
          message: 'Webhook payload must contain messageId or MessageSid',
        },
      });
    }

    const normalizedStatus = normalizeSmsStatus(rawStatus);

    logger.info('[SmsWebhook] Processing delivery status update', {
      providerMessageId,
      rawStatus,
      normalizedStatus,
      errorMessage,
    });

    const updatedLog = await smsLogModel.updateStatusByProviderMessageId(
      String(providerMessageId),
      normalizedStatus,
      errorMessage ? String(errorMessage) : null
    );

    if (!updatedLog) {
      logger.info('[SmsWebhook] No sms_log record found matching providerMessageId', {
        providerMessageId,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'SMS delivery status updated',
      data: {
        providerMessageId,
        status: normalizedStatus,
        updated: !!updatedLog,
      },
    });
  } catch (error: any) {
    logger.error('[SmsWebhook] Failed to process SMS status webhook', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'WEBHOOK_PROCESSING_FAILED',
        message: 'Failed to process webhook status update',
      },
    });
  }
};
