import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useApp } from '../data/store';
import { t } from '../i18n';

export function OfflineIndicator() {
  const { state } = useApp();
  const lang = state.language;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed top-14 start-0 end-0 bg-warning-bg border-b border-warning/20 z-50 px-4 py-2 flex items-center justify-center gap-2 slide-up"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="w-4 h-4 text-warning" />
      <span className="text-sm font-medium text-warning">
        {lang === 'ar' ? 'أنت غير متصل بالإنترنت' : "You're offline"}
      </span>
    </div>
  );
}
