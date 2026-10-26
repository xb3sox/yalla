import { SmsProvider, SmsResult } from './sms.types';
import logger from '../../utils/logger';

export class MockSmsProvider implements SmsProvider {
  public name = 'mock';

  public async sendSms(to: string, messageBody: string): Promise<SmsResult> {
    const startTime = Date.now();
    const mockMessageId = `mock-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    logger.info('[MockSmsProvider] Sending SMS', {
      to,
      messageBody,
      messageId: mockMessageId,
    });

    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      messageId: mockMessageId,
      provider: 'mock',
      status: 'sent',
      statusCode: 200,
      latencyMs,
    };
  }
}
