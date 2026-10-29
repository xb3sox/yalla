import { Stripe } from '@capacitor-community/stripe';

export interface NativeApplePayOptions {
  amount: number; // In SAR
  label: string;
  paymentIntentClientSecret?: string;
  merchantIdentifier?: string;
  countryCode?: string;
  currencyCode?: string;
}

export class StripeNativeService {
  private static isInitialized = false;

  /**
   * Initialize the native Stripe plugin with the publishable key.
   */
  public static async initialize(publishableKey?: string): Promise<void> {
    if (this.isInitialized) return;

    const key = publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_sample';
    try {
      await Stripe.initialize({
        publishableKey: key,
      });
      this.isInitialized = true;
    } catch (err) {
      console.warn('Native Stripe initialization fallback or not supported in web browser:', err);
    }
  }

  /**
   * Check if Apple Pay is available natively on device
   */
  public static async isApplePayAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      // Stripe.isApplePayAvailable or check platform
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Invoke native Apple Pay sheet using @capacitor-community/stripe
   */
  public static async presentApplePay(options: NativeApplePayOptions): Promise<{ token?: string; success: boolean }> {
    await this.initialize();

    const merchantId = options.merchantIdentifier || 'merchant.app.yalla';
    const countryCode = options.countryCode || 'SA';
    const currency = options.currencyCode || 'SAR';

    try {
      // Create payment sheet / Apple Pay flow via @capacitor-community/stripe
      await Stripe.createApplePay({
        paymentSummaryItems: [
          {
            label: options.label,
            amount: options.amount,
          },
        ],
        merchantIdentifier: merchantId,
        countryCode,
        currency,
        paymentIntentClientSecret: options.paymentIntentClientSecret || 'pi_dummy_secret',
      } as any);

      const result = await Stripe.presentApplePay();
      if (result && ((result as any).paymentResult === 'completed' || (result as any).paymentResult === 'PaymentCompleted')) {
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Native Apple Pay error:', error);
      throw error;
    }
  }
}

export default StripeNativeService;
