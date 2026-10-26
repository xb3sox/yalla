export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: string; // 'twilio' | 'unifonic' | 'mock'
  error?: string;
  latencyMs?: number;
  status?: 'queued' | 'sent' | 'delivered' | 'failed';
  statusCode?: number;
}

export interface SmsProvider {
  name: string;
  sendSms(to: string, messageBody: string): Promise<SmsResult>;
}

export type SmsMessageType =
  | '24h_reconfirmation'
  | 'arrival_pin_unlocked'
  | 'host_announcement'
  | 'urgent_schedule_change';

export interface SendSmsOptions {
  userId?: string | null;
  to: string;
  messageType: SmsMessageType;
  params: Record<string, string>;
  userLanguage?: 'en' | 'ar';
  isTransactional?: boolean;
  marketingConsent?: boolean;
}
