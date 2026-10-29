import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';
import { api } from '../services/api';

export interface PushNotificationPromptProps {
  lang?: 'en' | 'ar';
  onDismiss?: () => void;
  onSubscribed?: () => void;
}

/**
 * Utility to convert base64 URL VAPID key to Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  lang = 'ar',
  onDismiss,
  onSubscribed,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isRtl = lang === 'ar';

  const t = {
    ar: {
      title: 'تفعيل التنبيهات',
      body: 'احصل على إشعارات فورية لتأكيد الحضور وتحديثات المضيف وقوائم الانتظار مباشرة على شاشتك.',
      enableBtn: 'تفعيل التنبيهات',
      submitting: 'جاري التفعيل...',
      subscribedMsg: 'تم تفعيل التنبيهات بنجاح!',
      deniedMsg: 'تم رفض الإشعارات من إعدادات المتصفح.',
      unsupportedMsg: 'المتصفح لا يدعم إشعارات الويب Push.',
      dismiss: 'إغلاق',
    },
    en: {
      title: 'Enable Push Notifications',
      body: 'Get instant alerts for 24h attendance reconfirmations, host updates, and waitlist spots.',
      enableBtn: 'Enable Notifications',
      submitting: 'Enabling...',
      subscribedMsg: 'Notifications enabled successfully!',
      deniedMsg: 'Notifications are blocked in browser settings.',
      unsupportedMsg: 'Web Push notifications are not supported by this browser.',
      dismiss: 'Dismiss',
    },
  }[lang];

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!('Notification' in window)) {
        throw new Error('Notification API not supported');
      }

      const resPermission = await Notification.requestPermission();
      setPermission(resPermission);

      if (resPermission !== 'granted') {
        setLoading(false);
        return;
      }

      // Fetch VAPID key
      const vapidRes = await api.notifications.getVapidPublicKey();
      const vapidPublicKey = vapidRes.data?.publicKey;

      if (!vapidPublicKey) {
        throw new Error('VAPID public key unavailable');
      }

      // Get or register SW registration
      let swRegistration = await navigator.serviceWorker.getRegistration();
      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.register('/sw.js');
      }
      await navigator.serviceWorker.ready;

      // Subscribe to Push
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      let subscription = await swRegistration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey as unknown as BufferSource,
        });
      }

      // Send subscription to backend
      await api.notifications.subscribePush(subscription.toJSON());

      setSubscribed(true);
      if (onSubscribed) {
        onSubscribed();
      }
    } catch (err: any) {
      console.error('Push notification opt-in error:', err);
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (permission === 'denied') {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <BellOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{t.deniedMsg}</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 hover:bg-amber-100 rounded text-amber-600" aria-label={t.dismiss}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (subscribed) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center justify-between text-sm"
      >
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{t.subscribedMsg}</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1 hover:bg-emerald-100 rounded text-emerald-600" aria-label={t.dismiss}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="p-4 bg-teal-50 border border-teal-200 rounded-xl shadow-sm space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-600 text-white rounded-lg flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-teal-900 text-sm">{t.title}</h4>
            <p className="text-xs text-teal-700 mt-0.5 leading-relaxed">{t.body}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-teal-100 rounded text-teal-600 transition-colors"
            aria-label={t.dismiss}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 rounded-lg transition-colors"
          >
            {t.dismiss}
          </button>
        )}
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="px-4 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
        >
          {loading ? t.submitting : t.enableBtn}
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPrompt;
