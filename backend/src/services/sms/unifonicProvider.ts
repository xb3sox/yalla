import { SmsProvider, SmsResult } from './sms.types';
import logger from '../../utils/logger';

export class UnifonicSmsProvider implements SmsProvider {
  public name = 'unifonic';
  private appSid: string;
  private senderId: string;
  private apiUrl: string;

  constructor() {
    this.appSid = process.env.UNIFONIC_APPSID || '';
    this.senderId = process.env.UNIFONIC_SENDER_ID || 'Yalla';
    this.apiUrl =
      process.env.UNIFONIC_API_URL ||
      'https://api.unifonic.com/rest/SMS/messages/SendBatch';
  }

  public async sendSms(to: string, messageBody: string): Promise<SmsResult> {
    const startTime = Date.now();

    if (!this.appSid) {
      const latencyMs = Date.now() - startTime;
      logger.warn('[UnifonicSmsProvider] Unifonic AppSid not configured');
      return {
        success: false,
        provider: 'unifonic',
        error: 'Unifonic credentials not configured',
        status: 'failed',
        statusCode: 500,
        latencyMs,
      };
    }

    // Strip leading + for Unifonic if required, or keep e.g. 9665xxxxxxxx
    const formattedRecipient = to.replace(/^\+/, '');

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          AppSid: this.appSid,
          Recipient: formattedRecipient,
          Body: messageBody,
          SenderID: this.senderId,
        }).toString(),
      });

      const latencyMs = Date.now() - startTime;
      const data = (await response.json().catch(() => ({}))) as any;

      if (response.ok && (data.success === 'true' || data.success === true || data.data?.MessageID || data.MessageID)) {
        const messageId = String(data.data?.MessageID || data.MessageID || `unifonic-${Date.now()}`);
        logger.info('[UnifonicSmsProvider] SMS sent successfully', {
          to,
          messageId,
          latencyMs,
        });

        return {
          success: true,
          messageId,
          provider: 'unifonic',
          status: 'sent',
          statusCode: response.status,
          latencyMs,
        };
      }

      const errorMessage = data.errorMessage || data.message || `Unifonic API error (status ${response.status})`;
      logger.error('[UnifonicSmsProvider] API returned error', {
        to,
        status: response.status,
        error: errorMessage,
        latencyMs,
      });

      return {
        success: false,
        provider: 'unifonic',
        error: errorMessage,
        status: 'failed',
        statusCode: response.status,
        latencyMs,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      logger.error('[UnifonicSmsProvider] HTTP request failed', {
        to,
        error: error.message,
        latencyMs,
      });

      return {
        success: false,
        provider: 'unifonic',
        error: error.message || 'Unifonic request failed',
        status: 'failed',
        statusCode: 500,
        latencyMs,
      };
    }
  }
}
