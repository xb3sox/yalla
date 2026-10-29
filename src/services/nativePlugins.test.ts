import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isNativePlatform,
  triggerHaptic,
  checkBiometricAvailability,
  verifyBiometric,
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  parseDeepLinkUrl,
  setupDeepLinks,
  initializeNativeApp,
} from './nativePlugins';

import { Capacitor } from '@capacitor/core';

// Mock Capacitor Core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

// Mock Capacitor Haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn().mockResolvedValue(undefined),
  },
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
}));

// Mock Native Biometric
vi.mock('@capgo/capacitor-native-biometric', () => ({
  NativeBiometric: {
    isAvailable: vi.fn().mockResolvedValue({ isAvailable: true, biometryType: 'FACE_ID' }),
    verifyIdentity: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Secure Storage Plugin
vi.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: {
    set: vi.fn().mockResolvedValue({ value: true }),
    get: vi.fn().mockResolvedValue({ value: 'secret-val' }),
    remove: vi.fn().mockResolvedValue({ value: true }),
  },
}));

// Mock App plugin
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockReturnValue(Promise.resolve({ remove: vi.fn() })),
  },
}));

// Mock StatusBar and SplashScreen
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn().mockResolvedValue(undefined),
  },
  Style: {
    Dark: 'DARK',
  },
}));

vi.mock('@capacitor/splash-screen', () => ({
  SplashScreen: {
    hide: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('nativePlugins', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('isNativePlatform', () => {
    it('returns false when on web browser', () => {
      expect(isNativePlatform()).toBe(false);
    });
  });

  describe('triggerHaptic', () => {
    it('does not invoke Haptics on web platform', async () => {
      const { Haptics } = await import('@capacitor/haptics');
      await triggerHaptic();
      expect(Haptics.impact).not.toHaveBeenCalled();
    });

    it('invokes Haptics on native platform', async () => {
      const { Haptics } = await import('@capacitor/haptics');
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      await triggerHaptic();
      expect(Haptics.impact).toHaveBeenCalled();
    });
  });

  describe('Biometrics', () => {
    it('returns isAvailable false on web', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      const res = await checkBiometricAvailability();
      expect(res).toEqual({ isAvailable: false });
    });

    it('checks biometric availability on native', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      const res = await checkBiometricAvailability();
      expect(res.isAvailable).toBe(true);
      expect(res.biometricType).toBe('FACE_ID');
    });

    it('verifies biometric identity on native', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      const success = await verifyBiometric('Title', 'Reason');
      expect(success).toBe(true);
    });
  });

  describe('Secure Storage', () => {
    it('uses localStorage as web fallback', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      const setOk = await setSecureItem('auth_token', 'token-123');
      expect(setOk).toBe(true);

      const val = await getSecureItem('auth_token');
      expect(val).toBe('token-123');

      const removeOk = await removeSecureItem('auth_token');
      expect(removeOk).toBe(true);
      expect(await getSecureItem('auth_token')).toBeNull();
    });

    it('uses SecureStoragePlugin on native platform', async () => {
      const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');

      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      await setSecureItem('auth_token', 'token-123');
      expect(SecureStoragePlugin.set).toHaveBeenCalledWith({ key: 'auth_token', value: 'token-123' });

      const val = await getSecureItem('auth_token');
      expect(SecureStoragePlugin.get).toHaveBeenCalledWith({ key: 'auth_token' });
      expect(val).toBe('secret-val');

      await removeSecureItem('auth_token');
      expect(SecureStoragePlugin.remove).toHaveBeenCalledWith({ key: 'auth_token' });
    });
  });

  describe('Deep Link Parser', () => {
    it('parses custom scheme yalla://arrival/:reservationId', () => {
      const parsed = parseDeepLinkUrl('yalla://arrival/res-999');
      expect(parsed).toEqual({
        route: 'arrival',
        params: { reservationId: 'res-999' },
      });
    });

    it('parses universal link https://yalla.app/arrival/:reservationId', () => {
      const parsed = parseDeepLinkUrl('https://yalla.app/arrival/res-888');
      expect(parsed).toEqual({
        route: 'arrival',
        params: { reservationId: 'res-888' },
      });
    });

    it('returns null for unknown URLs', () => {
      const parsed = parseDeepLinkUrl('https://yalla.app/unknown');
      expect(parsed).toBeNull();
    });

    it('handles setupDeepLinks on native', async () => {
      const { App } = await import('@capacitor/app');

      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      const handler = vi.fn();
      const cleanup = setupDeepLinks(handler);

      expect(App.addListener).toHaveBeenCalledWith('appUrlOpen', expect.any(Function));
      expect(typeof cleanup).toBe('function');
    });
  });

  describe('initializeNativeApp', () => {
    it('initializes status bar and hides splash screen on native', async () => {
      const { StatusBar } = await import('@capacitor/status-bar');
      const { SplashScreen } = await import('@capacitor/splash-screen');

      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

      await initializeNativeApp();

      expect(StatusBar.setStyle).toHaveBeenCalled();
      expect(SplashScreen.hide).toHaveBeenCalled();
    });
  });
});
