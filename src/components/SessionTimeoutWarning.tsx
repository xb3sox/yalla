import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Dialog, Button } from './DesignSystem';
import { Clock } from 'lucide-react';

export function SessionTimeoutWarning() {
  const { state } = useApp();
  const lang = state.language;
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    // Simulate session timeout warning after 25 minutes of inactivity
    const warningTimer = setTimeout(() => {
      setShowWarning(true);
      setTimeLeft(300); // 5 minutes to extend
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearTimeout(warningTimer);
  }, []);

  useEffect(() => {
    if (!showWarning) return;

    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setShowWarning(false);
          // In a real app, this would log the user out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning]);

  const handleExtend = () => {
    setShowWarning(false);
    setTimeLeft(300);
    // In a real app, this would extend the session on the server
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Dialog
      open={showWarning}
      onClose={() => {}} // Can't dismiss without action
      title={lang === 'ar' ? 'تحذير انتهاء الجلسة' : 'Session Timeout Warning'}
      actions={
        <Button variant="primary" onClick={handleExtend} className="w-full">
          {lang === 'ar' ? 'تمديد الجلسة' : 'Extend Session'}
        </Button>
      }
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-warning-bg flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-warning" />
        </div>
        <p className="text-sm text-text-secondary mb-4">
          {lang === 'ar'
            ? 'ستنتهي جلستك بسبب عدم النشاط.'
            : 'Your session will expire due to inactivity.'}
        </p>
        <div className="bg-surface-sunken rounded-lg p-4 mb-4">
          <p className="text-2xl font-bold text-text-primary tabular-nums">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {lang === 'ar' ? 'الوقت المتبقي' : 'Time remaining'}
          </p>
        </div>
        <p className="text-xs text-text-tertiary">
          {lang === 'ar'
            ? 'اضغط على "تمديد الجلسة" للبقاء مسجلاً للدخول.'
            : 'Click "Extend Session" to stay logged in.'}
        </p>
      </div>
    </Dialog>
  );
}
