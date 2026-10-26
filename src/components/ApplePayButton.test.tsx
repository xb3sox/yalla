import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { ApplePayButton } from './ApplePayButton';
import StripeNativeService from '../services/stripeNative';
import * as stripeJs from '@stripe/stripe-js';

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}));

vi.mock('../services/stripeNative', () => ({
  default: {
    presentApplePay: vi.fn(),
    isApplePayAvailable: vi.fn(),
  },
}));

describe('ApplePayButton Component', () => {
  const defaultProps = {
    amount: 150,
    label: 'Experience Reservation',
    reservationId: 'res_123',
    onSuccess: vi.fn(),
    onError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders web Apple Pay button when canMakePayment returns true with applePay: true', async () => {
    const mockPaymentRequest = {
      canMakePayment: vi.fn().mockResolvedValue({ applePay: true }),
      on: vi.fn(),
      show: vi.fn(),
    };

    const mockStripe = {
      paymentRequest: vi.fn().mockReturnValue(mockPaymentRequest),
    };

    vi.spyOn(stripeJs, 'loadStripe').mockResolvedValue(mockStripe as any);

    render(<ApplePayButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('apple-pay-button')).toBeInTheDocument();
    });

    expect(mockStripe.paymentRequest).toHaveBeenCalledWith({
      country: 'SA',
      currency: 'sar',
      total: {
        label: 'Experience Reservation',
        amount: 15000, // 150 SAR in halalas
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Click button calls show
    fireEvent.click(screen.getByTestId('apple-pay-button'));
    expect(mockPaymentRequest.show).toHaveBeenCalled();
  });

  it('renders nothing when canMakePayment returns null/false for web', async () => {
    const mockPaymentRequest = {
      canMakePayment: vi.fn().mockResolvedValue(null),
      on: vi.fn(),
    };

    const mockStripe = {
      paymentRequest: vi.fn().mockReturnValue(mockPaymentRequest),
    };

    vi.spyOn(stripeJs, 'loadStripe').mockResolvedValue(mockStripe as any);

    render(<ApplePayButton {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
    });
  });

  it('invokes native Stripe Apple Pay presentation when isNativeDevice is true', async () => {
    vi.mocked(StripeNativeService.presentApplePay).mockResolvedValue({
      success: true,
    });

    render(<ApplePayButton {...defaultProps} isNativeDevice={true} />);

    const button = screen.getByTestId('apple-pay-button');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(StripeNativeService.presentApplePay).toHaveBeenCalledWith({
        amount: 150,
        label: 'Experience Reservation',
        merchantIdentifier: 'merchant.app.yalla',
        countryCode: 'SA',
        currencyCode: 'SAR',
      });
      expect(defaultProps.onSuccess).toHaveBeenCalled();
    });
  });
});
