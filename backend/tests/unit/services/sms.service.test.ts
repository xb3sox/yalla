import { PhoneUtils } from '../../../src/services/sms/phoneUtils';
import { SmsFactory } from '../../../src/services/sms/smsFactory';
import { SmsService } from '../../../src/services/sms/sms.service';
import { SmsProvider } from '../../../src/services/sms/sms.types';
import smsLogModel from '../../../src/models/smsLog.model';

describe('PhoneUtils', () => {
  describe('sanitizeAndValidatePhone', () => {
    it('should format and validate standard E.164 phone numbers', () => {
      expect(PhoneUtils.sanitizeAndValidatePhone('+966512345678')).toBe('+966512345678');
      expect(PhoneUtils.sanitizeAndValidatePhone('  +966 51 234 5678 ')).toBe('+966512345678');
      expect(PhoneUtils.sanitizeAndValidatePhone('00966512345678')).toBe('+966512345678');
      expect(PhoneUtils.sanitizeAndValidatePhone('+1 (415) 555-2671')).toBe('+14155552671');
    });

    it('should throw an error for invalid phone numbers', () => {
      expect(() => PhoneUtils.sanitizeAndValidatePhone('invalid')).toThrow();
      expect(() => PhoneUtils.sanitizeAndValidatePhone('123')).toThrow();
      expect(() => PhoneUtils.sanitizeAndValidatePhone('+000123')).toThrow();
      expect(() => PhoneUtils.sanitizeAndValidatePhone('')).toThrow();
    });
  });

  describe('isGccPhoneNumber', () => {
    it('should identify Saudi and GCC phone numbers correctly', () => {
      expect(PhoneUtils.isGccPhoneNumber('+966512345678')).toBe(true); // Saudi
      expect(PhoneUtils.isGccPhoneNumber('+971501234567')).toBe(true); // UAE
      expect(PhoneUtils.isGccPhoneNumber('+96591234567')).toBe(true);  // Kuwait
      expect(PhoneUtils.isGccPhoneNumber('+97451234567')).toBe(true);  // Qatar
      expect(PhoneUtils.isGccPhoneNumber('+97331234567')).toBe(true);  // Bahrain
      expect(PhoneUtils.isGccPhoneNumber('+96891234567')).toBe(true);  // Oman
      expect(PhoneUtils.isGccPhoneNumber('+14155552671')).toBe(false);  // US
      expect(PhoneUtils.isGccPhoneNumber('+447911123456')).toBe(false); // UK
    });
  });
});

describe('SmsFactory Provider Routing & Failover', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should route GCC numbers to Unifonic as primary in production mode', () => {
    delete process.env.SMS_PROVIDER;
    delete process.env.NODE_ENV;

    const { primary, backup } = SmsFactory.getProviders('+966512345678');
    expect(primary.name).toBe('unifonic');
    expect(backup?.name).toBe('twilio');
  });

  it('should route non-GCC international numbers to Twilio as primary', () => {
    delete process.env.SMS_PROVIDER;
    delete process.env.NODE_ENV;

    const { primary, backup } = SmsFactory.getProviders('+14155552671');
    expect(primary.name).toBe('twilio');
    expect(backup?.name).toBe('unifonic');
  });

  it('should trigger backup provider failover when primary fails with 5xx error', async () => {
    const mockPrimary: SmsProvider = {
      name: 'primaryMock',
      sendSms: jest.fn().mockResolvedValue({
        success: false,
        provider: 'primaryMock',
        statusCode: 503,
        error: 'Service Unavailable',
      }),
    };

    const mockBackup: SmsProvider = {
      name: 'backupMock',
      sendSms: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'backup-msg-123',
        provider: 'backupMock',
        statusCode: 200,
      }),
    };

    jest.spyOn(SmsFactory, 'getProviders').mockReturnValue({
      primary: mockPrimary,
      backup: mockBackup,
    });

    const result = await SmsFactory.sendSmsWithFallback('+966512345678', 'Test message');

    expect(mockPrimary.sendSms).toHaveBeenCalledTimes(1);
    expect(mockBackup.sendSms).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.provider).toBe('backupMock');

    jest.restoreAllMocks();
  });
});

describe('SmsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderMessage', () => {
    it('should render 24h_reconfirmation template in English', () => {
      const rendered = SmsService.renderMessage(
        '24h_reconfirmation',
        { title: 'Stargazing in AlUla', link: 'https://yalla.app/a/tok123' },
        'en'
      );
      expect(rendered).toContain("Yalla: Your experience 'Stargazing in AlUla' starts in 24h.");
      expect(rendered).toContain('https://yalla.app/a/tok123');
    });

    it('should render 24h_reconfirmation template in Arabic', () => {
      const rendered = SmsService.renderMessage(
        '24h_reconfirmation',
        { title: 'مراقبة النجوم في العلا', link: 'https://yalla.app/a/tok123' },
        'ar'
      );
      expect(rendered).toContain("يلا: تبدأ تجربتك 'مراقبة النجوم في العلا' خلال 24 ساعة.");
      expect(rendered).toContain('https://yalla.app/a/tok123');
    });

    it('should render arrival_pin_unlocked template in English and Arabic', () => {
      const enMsg = SmsService.renderMessage(
        'arrival_pin_unlocked',
        { venueName: 'Secret Oasis', pin: '849201', link: 'https://yalla.app/a/tok123' },
        'en'
      );
      expect(enMsg).toContain('Venue: Secret Oasis');
      expect(enMsg).toContain('Your Check-in PIN is 849201');

      const arMsg = SmsService.renderMessage(
        'arrival_pin_unlocked',
        { venueName: 'Secret Oasis', pin: '849201', link: 'https://yalla.app/a/tok123' },
        'ar'
      );
      expect(arMsg).toContain('المقر: Secret Oasis');
      expect(arMsg).toContain('رمز الدخول الخاص بك هو 849201');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce maximum 3 SMS dispatches per hour per phone number', async () => {
      jest.spyOn(smsLogModel, 'getRecentCountByPhone').mockResolvedValue(3);
      jest.spyOn(smsLogModel, 'create').mockResolvedValue({} as any);

      const result = await SmsService.sendSms({
        to: '+966512345678',
        messageType: '24h_reconfirmation',
        params: { title: 'Test', link: 'https://yalla.app/a/1' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded: maximum 3 SMS dispatches per hour');
    });
  });

  describe('Marketing Consent', () => {
    it('should block non-transactional SMS if marketing consent is missing', async () => {
      const result = await SmsService.sendSms({
        to: '+966512345678',
        messageType: 'host_announcement',
        params: { title: 'Test', message: 'Hello', link: 'https://yalla.app/a/1' },
        isTransactional: false,
        marketingConsent: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('User has not opted in to non-transactional SMS marketing');
    });
  });
});
