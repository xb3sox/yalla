import { SmsProvider, SmsResult } from './sms.types';
import { PhoneUtils } from './phoneUtils';
import { TwilioSmsProvider } from './twilioProvider';
import { UnifonicSmsProvider } from './unifonicProvider';
import { MockSmsProvider } from './mockProvider';
import logger from '../../utils/logger';

export class SmsFactory {
  private static mockProvider = new MockSmsProvider();
  private static twilioProvider = new TwilioSmsProvider();
  private static unifonicProvider = new UnifonicSmsProvider();

  /**
   * Returns primary and backup providers based on destination phone number & env config.
   */
  public static getProviders(to: string): { primary: SmsProvider; backup: SmsProvider | null } {
    const configuredProvider = process.env.SMS_PROVIDER;

    if (configuredProvider === 'mock' || process.env.NODE_ENV === 'test') {
      return { primary: this.mockProvider, backup: null };
    }

    if (configuredProvider === 'twilio') {
      return { primary: this.twilioProvider, backup: this.unifonicProvider };
    }

    if (configuredProvider === 'unifonic') {
      return { primary: this.unifonicProvider, backup: this.twilioProvider };
    }

    // Default routing: GCC / Saudi Arabia (+966) -> Unifonic primary, Twilio backup
    if (PhoneUtils.isGccPhoneNumber(to)) {
      return { primary: this.unifonicProvider, backup: this.twilioProvider };
    }

    // International numbers -> Twilio primary, Unifonic backup
    return { primary: this.twilioProvider, backup: this.unifonicProvider };
  }

  /**
   * Sends SMS via primary provider and retries once via backup provider on 5xx or server errors.
   */
  public static async sendSmsWithFallback(to: string, messageBody: string): Promise<SmsResult> {
    const { primary, backup } = this.getProviders(to);

    logger.info(`[SmsFactory] Attempting dispatch via primary provider '${primary.name}'`, { to });
    const result = await primary.sendSms(to, messageBody);

    // If primary succeeds, return result
    if (result.success) {
      return result;
    }

    // Check if error is a 5xx / server error qualifying for failover
    const isServerError = !result.statusCode || result.statusCode >= 500;

    if (backup && isServerError) {
      logger.warn(
        `[SmsFactory] Primary provider '${primary.name}' failed with server error (${result.statusCode || '5xx'}). Retrying once via backup provider '${backup.name}'`,
        { to, error: result.error }
      );

      const backupResult = await backup.sendSms(to, messageBody);

      if (backupResult.success) {
        logger.info(`[SmsFactory] Failover to backup provider '${backup.name}' succeeded`, { to });
      } else {
        logger.error(`[SmsFactory] Failover to backup provider '${backup.name}' also failed`, {
          to,
          error: backupResult.error,
        });
      }

      return backupResult;
    }

    return result;
  }
}
