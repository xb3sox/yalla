import twilio from 'twilio';
import { SmsProvider, SmsResult } from './sms.types';
import config from '../../config';
import logger from '../../utils/logger';

export class TwilioSmsProvider implements SmsProvider {
  public name = 'twilio';
  private client: twilio.Twilio | null = null;
  private fromNumberOrSenderId: string;

  constructor() {
    const accountSid = config.sms.accountSid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = config.sms.authToken || process.env.TWILIO_AUTH_TOKEN;
    this.fromNumberOrSenderId =
      process.env.TWILIO_SENDER_ID ||
      config.sms.phoneNumber ||
      process.env.TWILIO_PHONE_NUMBER ||
      'Yalla';

    if (accountSid && authToken) {
      try {
        this.client = twilio(accountSid, authToken);
      } catch (err: any) {
        logger.error('Failed to initialize Twilio client', { error: err.message });
      }
    }
  }

  public async sendSms(to: string, messageBody: string): Promise<SmsResult> {
    const startTime = Date.now();

    if (!this.client) {
      const latencyMs = Date.now() - startTime;
      logger.warn('[TwilioSmsProvider] Twilio client not initialized or missing credentials');
      return {
        success: false,
        provider: 'twilio',
        error: 'Twilio credentials not configured',
        status: 'failed',
        statusCode: 500,
        latencyMs,
      };
    }

    try {
      const response = await this.client.messages.create({
        body: messageBody,
        to,
        from: this.fromNumberOrSenderId,
      });

      const latencyMs = Date.now() - startTime;
      logger.info('[TwilioSmsProvider] SMS sent successfully', {
        to,
        sid: response.sid,
        status: response.status,
        latencyMs,
      });

      return {
        success: true,
        messageId: response.sid,
        provider: 'twilio',
        status: response.status === 'queued' || response.status === 'sent' || response.status === 'delivered'
          ? (response.status as 'queued' | 'sent' | 'delivered')
          : 'sent',
        statusCode: 200,
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const statusCode = error.status || error.statusCode || 500;
      logger.error('[TwilioSmsProvider] Failed to send SMS', {
        to,
        error: error.message,
        code: error.code,
        statusCode,
        latencyMs,
      });

      return {
        success: false,
        provider: 'twilio',
        error: error.message || 'Twilio send failed',
        status: 'failed',
        statusCode,
        latencyMs,
      };
    }
  }
}
