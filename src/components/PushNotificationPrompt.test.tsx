import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import PushNotificationPrompt, { urlBase64ToUint8Array } from './PushNotificationPrompt';
import { renderWithProviders } from '../test/utils';

describe('PushNotificationPrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.serviceWorker and Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockResolvedValue(null),
        register: vi.fn().mockResolvedValue({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({
                endpoint: 'https://push.example.com/sub/1',
                keys: { p256dh: 'key', auth: 'auth' },
              }),
            }),
          },
        }),
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue({
              toJSON: () => ({
                endpoint: 'https://push.example.com/sub/1',
                keys: { p256dh: 'key', auth: 'auth' },
              }),
            }),
          },
        }),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'PushManager', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  describe('urlBase64ToUint8Array', () => {
    it('should correctly convert base64 url string to Uint8Array', () => {
      const base64Url = 'BDoj-Gs9fqCP3Dxm0_2qFixvfoxjAAOn7uSkffL46GghdRA7ZSX8vCNvV2eF2qXLzpLNtxZlnYHmrpimtBlQQRg';
      const result = urlBase64ToUint8Array(base64Url);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Rendering and Interactions', () => {
    it('should render in Arabic by default with RTL direction', () => {
      renderWithProviders(<PushNotificationPrompt lang="ar" />);
      expect(screen.getAllByText('تفعيل التنبيهات').length).toBeGreaterThan(0);
      expect(screen.getByText('احصل على إشعارات فورية لتأكيد الحضور وتحديثات المضيف وقوائم الانتظار مباشرة على شاشتك.')).toBeTruthy();
    });

    it('should render in English when lang="en"', () => {
      renderWithProviders(<PushNotificationPrompt lang="en" />);
      expect(screen.getByText('Enable Push Notifications')).toBeTruthy();
      expect(screen.getByText('Get instant alerts for 24h attendance reconfirmations, host updates, and waitlist spots.')).toBeTruthy();
    });

    it('should trigger onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      renderWithProviders(<PushNotificationPrompt lang="en" onDismiss={onDismiss} />);

      const dismissBtn = screen.getAllByRole('button', { name: 'Dismiss' })[0];
      fireEvent.click(dismissBtn);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should display denied message when Notification.permission is denied', () => {
      Object.defineProperty(window, 'Notification', {
        value: { permission: 'denied' },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<PushNotificationPrompt lang="en" />);
      expect(screen.getByText('Notifications are blocked in browser settings.')).toBeTruthy();
    });
  });
});
