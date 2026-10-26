import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

/**
 * Haptics helper
 */
export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }
  try {
    await Haptics.impact({ style });
  } catch (err) {
    // Silently ignore haptic failures on unsupported platforms
  }
};

/**
 * Biometrics helper
 */
export interface BiometricCheckResult {
  isAvailable: boolean;
  biometricType?: string;
}

export const checkBiometricAvailability = async (): Promise<BiometricCheckResult> => {
  if (!isNativePlatform()) {
    return { isAvailable: false };
  }
  try {
    const result = await NativeBiometric.isAvailable();
    return {
      isAvailable: result.isAvailable,
      biometricType: result.biometryType ? String(result.biometryType) : undefined,
    };
  } catch (err) {
    return { isAvailable: false };
  }
};

export const verifyBiometric = async (title: string, reason: string): Promise<boolean> => {
  if (!isNativePlatform()) {
    return false;
  }
  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title,
      subtitle: '',
      description: '',
      maxAttempts: 3,
    });
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Secure Storage helper
 * Never log key or value contents to console logs for security compliance.
 */
export const setSecureItem = async (key: string, value: string): Promise<boolean> => {
  if (!isNativePlatform()) {
    try {
      localStorage.setItem(`secure_${key}`, value);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await SecureStoragePlugin.set({ key, value });
    return true;
  } catch (err) {
    return false;
  }
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  if (!isNativePlatform()) {
    return localStorage.getItem(`secure_${key}`);
  }

  try {
    const result = await SecureStoragePlugin.get({ key });
    return result.value;
  } catch (err) {
    return null;
  }
};

export const removeSecureItem = async (key: string): Promise<boolean> => {
  if (!isNativePlatform()) {
    localStorage.removeItem(`secure_${key}`);
    return true;
  }

  try {
    await SecureStoragePlugin.remove({ key });
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * Deep Linking helper
 * Handles yalla://arrival/:reservationId and https://yalla.app/arrival/:reservationId
 */
export const parseDeepLinkUrl = (urlStr: string): { route: string; params: Record<string, string> } | null => {
  try {
    const url = new URL(urlStr);
    const path = url.pathname || '';

    // Custom scheme yalla://arrival/:id or https://yalla.app/arrival/:id
    // On custom scheme url.hostname might be 'arrival' and url.pathname '/:id' or url.pathname '/arrival/:id'
    let fullPath = path;
    if (url.protocol === 'yalla:') {
      fullPath = `/${url.hostname}${path}`;
    }

    const arrivalMatch = fullPath.match(/^\/arrival\/(.+)$/);
    if (arrivalMatch) {
      return {
        route: 'arrival',
        params: { reservationId: arrivalMatch[1] },
      };
    }

    return null;
  } catch (err) {
    return null;
  }
};

export const setupDeepLinks = (onDeepLink: (link: { route: string; params: Record<string, string> }) => void) => {
  if (!isNativePlatform()) {
    return () => {};
  }

  const listener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const parsed = parseDeepLinkUrl(event.url);
    if (parsed) {
      onDeepLink(parsed);
    }
  });

  return () => {
    listener.then(l => l.remove()).catch(() => {});
  };
};

/**
 * Native Status & Splash Bar setup
 */
export const initializeNativeApp = async (): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await StatusBar.setStyle({ style: Style.Dark });
  } catch (err) {
    // Ignore
  }

  try {
    await SplashScreen.hide();
  } catch (err) {
    // Ignore
  }
};
