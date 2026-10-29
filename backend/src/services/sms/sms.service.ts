import { SendSmsOptions, SmsMessageType, SmsResult } from './sms.types';
import { PhoneUtils } from './phoneUtils';
import { SmsFactory } from './smsFactory';
import smsLogModel from '../../models/smsLog.model';
import logger from '../../utils/logger';

export class SmsService {
  private static readonly MAX_SMS_PER_HOUR = 3;

  private static templates: Record<SmsMessageType, { en: string; ar: string }> = {
    '24h_reconfirmation': {
      en: "Yalla: Your experience '{{title}}' starts in 24h. Tap to reconfirm your attendance & view venue details: {{link}}",
      ar: "يلا: تبدأ تجربتك '{{title}}' خلال 24 ساعة. اضغط لتأكيد حضورك والاطلاع على تفاصيل المقر: {{link}}",
    },
    arrival_pin_unlocked: {
      en: 'Yalla: Attendance reconfirmed! Venue: {{venueName}}. Your Check-in PIN is {{pin}}. Details: {{link}}',
      ar: 'يلا: تم تأكيد الحضور! المقر: {{venueName}}. رمز الدخول الخاص بك هو {{pin}}. التفاصيل: {{link}}',
    },
    host_announcement: {
      en: "Yalla: Update for '{{title}}': {{message}}. Details: {{link}}",
      ar: "يلا: تحديث لتجربة '{{title}}': {{message}}. التفاصيل: {{link}}",
    },
    urgent_schedule_change: {
      en: "Yalla Urgent Update: Experience '{{title}}' schedule changed. Details: {{link}}",
      ar: "تحديث عاجل من يلا: تم تغيير موعد التجربة '{{title}}'. التفاصيل: {{link}}",
    },
  };

  /**
   * Render template placeholder variables.
   */
  public static renderMessage(
    messageType: SmsMessageType,
    params: Record<string, string>,
    language: 'en' | 'ar' = 'en'
  ): string {
    const langTemplates = this.templates[messageType] || this.templates['24h_reconfirmation'];
    const rawTemplate = langTemplates[language] || langTemplates['en'];

    return rawTemplate.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return key in params ? params[key] : match;
    });
  }

  /**
   * Main method to send SMS notification
   */
  public static async sendSms(options: SendSmsOptions): Promise<SmsResult> {
    const {
      userId,
      to,
      messageType,
      params,
      userLanguage = 'en',
      isTransactional = true,
      marketingConsent = false,
    } = options;

    // 1. Check marketing consent if non-transactional
    if (!isTransactional && !marketingConsent) {
      logger.info('[SmsService] Skipping non-transactional SMS due to missing marketing consent', {
        userId,
        to,
        messageType,
      });
      return {
        success: false,
        provider: 'none',
        error: 'User has not opted in to non-transactional SMS marketing',
        status: 'failed',
      };
    }

    // 2. Sanitize and validate phone number against E.164
    let sanitizedPhone: string;
    try {
      sanitizedPhone = PhoneUtils.sanitizeAndValidatePhone(to);
    } catch (validationErr: any) {
      logger.error('[SmsService] Phone validation failed', { error: validationErr.message, to });
      return {
        success: false,
        provider: 'none',
        error: validationErr.message,
        status: 'failed',
      };
    }

    // 3. Enforce rate-limiting (max 3 dispatches per phone number per hour)
    const recentSendCount = await smsLogModel.getRecentCountByPhone(sanitizedPhone, 1);
    if (recentSendCount >= this.MAX_SMS_PER_HOUR) {
      const rateLimitError = `Rate limit exceeded: maximum ${this.MAX_SMS_PER_HOUR} SMS dispatches per hour per phone number`;
      logger.warn('[SmsService] Rate limit exceeded', { phone: sanitizedPhone, recentSendCount });

      await smsLogModel.create({
        userId,
        phoneNumber: sanitizedPhone,
        provider: 'none',
        messageType,
        status: 'failed',
        errorMessage: rateLimitError,
      });

      return {
        success: false,
        provider: 'none',
        error: rateLimitError,
        status: 'failed',
      };
    }

    // 4. Render localized message template
    const messageBody = this.renderMessage(messageType, params, userLanguage);

    // 5. Send via SMS Factory (handles routing & failover)
    const result = await SmsFactory.sendSmsWithFallback(sanitizedPhone, messageBody);

    // 6. Log entry in sms_logs table
    try {
      await smsLogModel.create({
        userId,
        phoneNumber: sanitizedPhone,
        provider: result.provider,
        messageType,
        status: result.success ? (result.status || 'sent') : 'failed',
        providerMessageId: result.messageId || null,
        errorMessage: result.error || null,
      });
    } catch (logErr: any) {
      logger.error('[SmsService] Failed to record sms_logs entry', { error: logErr.message });
    }

    return result;
  }
}

export default SmsService;
