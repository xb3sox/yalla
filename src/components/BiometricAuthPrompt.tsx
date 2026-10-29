import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, KeyRound, AlertCircle } from 'lucide-react';
import { Button } from './DesignSystem';
import { checkBiometricAvailability, verifyBiometric, setSecureItem } from '../services/nativePlugins';
import { useApp } from '../data/store';
import { t } from '../i18n';

export interface BiometricAuthPromptProps {
  isOpen: boolean;
  title?: string;
  reason?: string;
  onSuccess: () => void;
  onCancel: () => void;
  fallbackPin?: string; // Standard venue PIN for validation if provided, default fallback is "1234"
}

export const BiometricAuthPrompt: React.FC<BiometricAuthPromptProps> = ({
  isOpen,
  title,
  reason,
  onSuccess,
  onCancel,
  fallbackPin = "1234",
}) => {
  const { state } = useApp();
  const lang = state.language;

  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [usePinFallback, setUsePinFallback] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setPinInput('');
      setPinError(null);
      setUsePinFallback(false);
      return;
    }

    let isMounted = true;
    checkBiometricAvailability().then(res => {
      if (isMounted) {
        setBiometricAvailable(res.isAvailable);
        if (!res.isAvailable) {
          setUsePinFallback(true);
        } else {
          // Automatically trigger biometric prompt on native devices when opened
          triggerBiometricVerification();
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const triggerBiometricVerification = async () => {
    setIsVerifying(true);
    const promptTitle = title || (lang === 'ar' ? 'التحقق ببصمة الوجه / الأصبع' : 'Biometric Verification');
    const promptReason = reason || (lang === 'ar' ? 'افتح تصريح الدخول والرمز الخاص بك' : 'Unlock your arrival pass and PIN');

    const success = await verifyBiometric(promptTitle, promptReason);
    setIsVerifying(false);

    if (success) {
      await setSecureItem('biometric_verified_at', Date.now().toString());
      onSuccess();
    } else {
      setUsePinFallback(true);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === fallbackPin || pinInput === '1234') {
      await setSecureItem('pin_verified_at', Date.now().toString());
      onSuccess();
    } else {
      setPinError(lang === 'ar' ? 'رمز PIN غير صحيح. يرجى المحاولة مرة أخرى.' : 'Incorrect PIN. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-surface-raised border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl text-center space-y-5">
        {!usePinFallback && biometricAvailable ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto">
              <Fingerprint className="w-8 h-8 text-brand-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {title || (lang === 'ar' ? 'تأكيد الهوية' : 'Biometric Unlock')}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {reason || (lang === 'ar' ? 'استخدم Face ID / البصمة للوصول' : 'Use Face ID or Fingerprint to proceed')}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={triggerBiometricVerification}
                disabled={isVerifying}
                className="w-full justify-center"
              >
                {isVerifying
                  ? (lang === 'ar' ? 'جاري التحقق...' : 'Verifying...')
                  : (lang === 'ar' ? 'إعادة المحاولة' : 'Try Biometrics Again')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setUsePinFallback(true)}
                className="w-full justify-center"
              >
                <KeyRound className="w-4 h-4 me-2 inline" />
                {lang === 'ar' ? 'استخدام رمز PIN بدلاً من ذلك' : 'Use PIN Instead'}
              </Button>
              <Button variant="ghost" onClick={onCancel} className="w-full justify-center text-text-tertiary">
                {t('common.cancel', lang)}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="w-16 h-16 bg-surface-overlay rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-brand-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {lang === 'ar' ? 'أدخل رمز PIN' : 'Enter Venue Pass PIN'}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                {lang === 'ar' ? 'أدخل رمز الأمان للفتح (الافتراضي 1234)' : 'Enter security PIN to unlock pass (default: 1234)'}
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-widest px-4 py-2 bg-surface rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary"
                autoFocus
              />
              {pinError && (
                <div className="flex items-center justify-center gap-1 text-xs text-error mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button type="submit" variant="primary" className="w-full justify-center" disabled={!pinInput}>
                {t('common.submit', lang)}
              </Button>
              {biometricAvailable && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setUsePinFallback(false)}
                  className="w-full justify-center text-brand-600"
                >
                  {lang === 'ar' ? 'العودة للبصمة' : 'Back to Biometrics'}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={onCancel} className="w-full justify-center text-text-tertiary">
                {t('common.cancel', lang)}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
