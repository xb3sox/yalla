import React, { useEffect, useState } from 'react';
import { loadStripe, PaymentRequest } from '@stripe/stripe-js';
import StripeNativeService from '../services/stripeNative';

interface ApplePayButtonProps {
  amount: number; // Amount in SAR
  label: string;
  reservationId: string;
  onSuccess?: (paymentIntentId?: string) => void;
  onError?: (error: Error) => void;
  publishableKey?: string;
  isNativeDevice?: boolean;
}

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  amount,
  label,
  reservationId,
  onSuccess,
  onError,
  publishableKey,
  isNativeDevice = false,
}) => {
  const [stripe, setStripe] = useState<any>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const key = publishableKey || (import.meta.env ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY : '') || 'pk_test_sample';

  useEffect(() => {
    let isMounted = true;

    const initWebStripe = async () => {
      try {
        const stripeObj = await loadStripe(key);
        if (!stripeObj || !isMounted) return;

        setStripe(stripeObj);

        // Configure PaymentRequest for Apple Pay / Web Payment Request API
        const pr = stripeObj.paymentRequest({
          country: 'SA',
          currency: 'sar',
          total: {
            label,
            amount: Math.round(amount * 100), // SAR in halalas
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        // Check availability
        const result = await pr.canMakePayment();
        if (isMounted) {
          if (result && (result.applePay || isNativeDevice)) {
            setPaymentRequest(pr);
            setCanMakePayment(true);
          } else if (isNativeDevice) {
            setCanMakePayment(true);
          } else {
            setCanMakePayment(Boolean(result));
          }
          setLoading(false);
        }

        // Handle payment method authorization in Web
        pr.on('paymentmethod', async (ev) => {
          try {
            // Call backend to create payment intent or handle confirmation
            if (onSuccess) {
              onSuccess(ev.paymentMethod.id);
            }
            ev.complete('success');
          } catch (err: any) {
            ev.complete('fail');
            if (onError) onError(err);
          }
        });
      } catch (err: any) {
        if (isMounted) {
          setLoading(false);
          if (onError) onError(err);
        }
      }
    };

    if (isNativeDevice) {
      setCanMakePayment(true);
      setLoading(false);
    } else {
      initWebStripe();
    }

    return () => {
      isMounted = false;
    };
  }, [amount, label, key, isNativeDevice]);

  const handleNativePayment = async () => {
    try {
      setLoading(true);
      const res = await StripeNativeService.presentApplePay({
        amount,
        label,
        merchantIdentifier: 'merchant.app.yalla',
        countryCode: 'SA',
        currencyCode: 'SAR',
      });

      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        if (onError) onError(new Error('Apple Pay cancelled or failed'));
      }
    } catch (err: any) {
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWebPayment = async () => {
    if (paymentRequest) {
      paymentRequest.show();
    }
  };

  if (loading) {
    return (
      <button
        disabled
        aria-label="Loading Apple Pay"
        className="w-full py-3 px-4 bg-black text-white rounded-lg opacity-50 flex items-center justify-center space-x-2 RTL:space-x-reverse cursor-not-allowed"
      >
        <span>Loading Apple Pay...</span>
      </button>
    );
  }

  if (!canMakePayment) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="apple-pay-button"
      onClick={isNativeDevice ? handleNativePayment : handleWebPayment}
      className="w-full py-3 px-4 bg-black hover:bg-gray-900 text-white font-medium rounded-lg shadow transition-colors flex items-center justify-center space-x-2 RTL:space-x-reverse"
      aria-label="Pay with Apple Pay"
    >
      <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170" aria-hidden="true">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.02.24-9.88-1.87-14.59-6.35-3.12-2.71-7.05-7.39-11.78-14.04-5.83-8.19-10.45-17.56-13.88-28.11-3.42-10.56-5.13-20.93-5.13-31.11 0-14.12 3.58-26.02 10.74-35.7 7.16-9.67 16.33-14.61 27.52-14.82 4.69 0 9.87 1.15 15.54 3.47 5.66 2.32 9.47 3.5 11.43 3.5 1.57 0 5.48-1.22 11.74-3.67 6.26-2.45 11.66-3.56 16.2-3.35 12.02.94 21.48 5.26 28.38 12.96-10.87 6.59-16.18 15.69-15.93 27.3.25 9.17 3.82 16.8 10.71 22.89 6.89 6.09 15.02 9.5 24.39 10.23-.88 2.72-1.88 5.42-3.02 8.11zm-28.84-100.9c0 7.02-2.6 13.78-7.8 20.28-5.89 7.21-13.2 11.36-21.93 12.45-.25-1.06-.38-2.06-.38-3.02 0-6.89 2.76-13.71 8.28-20.46 2.76-3.37 6.21-6.19 10.35-8.46 4.14-2.27 8.18-3.5 12.12-3.69.13 1 .2 1.96.2 2.9z" />
      </svg>
      <span>Pay with Apple Pay ({amount} SAR)</span>
    </button>
  );
};

export default ApplePayButton;
