import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Input, Select } from '../components/DesignSystem';
import { Phone, Shield, CheckCircle } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const [step, setStep] = useState<'phone' | 'code' | 'adult' | 'preferences' | 'complete'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [adultAccepted, setAdultAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [area, setArea] = useState('');
  const [expLang, setExpLang] = useState<'en' | 'ar'>('en');

  const handleNext = () => {
    switch (step) {
      case 'phone': if (phone.trim()) setStep('code'); break;
      case 'code': setStep('adult'); break;
      case 'adult': if (adultAccepted && termsAccepted) setStep('preferences'); break;
      case 'preferences':
        setStep('complete');
        setTimeout(onComplete, 1500);
        break;
    }
  };

  const steps = ['phone', 'code', 'adult', 'preferences', 'complete'];
  const progress = (steps.indexOf(step) + 1) / 4;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div className="h-full bg-brand-500 transition-all duration-500 ease-out" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
      </div>

      {/* Logo + Illustration */}
      <div className="flex flex-col items-center pt-12 pb-8">
        <div className="w-48 h-48 mb-4 opacity-90 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
            <defs>
              <linearGradient id="onboardingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14736A" />
                <stop offset="100%" stopColor="#0B3A35" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#onboardingGrad)" opacity="0.1" />
            <circle cx="100" cy="100" r="70" fill="url(#onboardingGrad)" opacity="0.2" />
            <circle cx="100" cy="100" r="50" fill="url(#onboardingGrad)" opacity="0.3" />
            <path d="M 70 120 Q 100 80 130 120" stroke="#14736A" strokeWidth="3" fill="none" />
            <circle cx="70" cy="120" r="8" fill="#14736A" />
            <circle cx="100" cy="95" r="8" fill="#14736A" />
            <circle cx="130" cy="120" r="8" fill="#14736A" />
            <path d="M 85 140 L 100 155 L 115 140" stroke="#D95030" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Y</span>
          </div>
          <span className="text-xl font-semibold text-text-primary tracking-tight">Yalla</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-10">
        {step === 'phone' && (
          <div className="space-y-6 slide-up">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-brand-600" />
              </div>
              <h1 className="text-xl font-bold text-text-primary">{t('onboarding.phoneVerification', lang)}</h1>
              <p className="text-sm text-text-secondary mt-1.5">{lang === 'ar' ? 'أدخل رقم هاتفك للبدء' : 'Enter your phone number to get started'}</p>
            </div>
            <Input
              label={lang === 'ar' ? 'رقم الهاتف' : 'Phone number'}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('onboarding.phonePlaceholder', lang)}
            />
            <Button variant="primary" size="lg" className="w-full" disabled={!phone.trim()} onClick={handleNext}>
              {t('common.next', lang)}
            </Button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-6 slide-up">
            <div className="text-center">
              <h1 className="text-xl font-bold text-text-primary">{t('onboarding.verifyCode', lang)}</h1>
              <p className="text-sm text-text-secondary mt-1.5">{lang === 'ar' ? `أرسلنا رمزاً إلى ${phone}` : `We sent a code to ${phone}`}</p>
            </div>
            <Input
              label={lang === 'ar' ? 'رمز التحقق' : 'Verification code'}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              maxLength={4}
            />
            <p className="text-xs text-text-tertiary text-center">{lang === 'ar' ? 'استخدم أي رمز للاختبار' : 'Use any code for testing'}</p>
            <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
              {t('common.confirm', lang)}
            </Button>
          </div>
        )}

        {step === 'adult' && (
          <div className="space-y-6 slide-up">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-brand-600" />
              </div>
              <h1 className="text-xl font-bold text-text-primary">{t('onboarding.adultDeclaration', lang)}</h1>
            </div>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 bg-surface-raised rounded-xl border border-border cursor-pointer hover:bg-surface-sunken transition-colors">
                <input type="checkbox" checked={adultAccepted} onChange={(e) => setAdultAccepted(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-border text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-text-primary">{t('onboarding.adultText', lang)}</span>
              </label>
              <label className="flex items-start gap-3 p-4 bg-surface-raised rounded-xl border border-border cursor-pointer hover:bg-surface-sunken transition-colors">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-5 h-5 rounded border-border text-brand-600 focus:ring-brand-500" />
                <span className="text-sm text-text-primary">{t('onboarding.termsAccept', lang)}</span>
              </label>
            </div>
            <Button variant="primary" size="lg" className="w-full" disabled={!adultAccepted || !termsAccepted} onClick={handleNext}>
              {t('common.next', lang)}
            </Button>
          </div>
        )}

        {step === 'preferences' && (
          <div className="space-y-6 slide-up">
            <div className="text-center">
              <h1 className="text-xl font-bold text-text-primary">{t('onboarding.preferences', lang)}</h1>
              <p className="text-sm text-text-secondary mt-1.5 max-w-xs mx-auto">{t('onboarding.whyCollectText', lang)}</p>
            </div>
            <div className="space-y-4">
              <Select
                label={t('onboarding.preferredArea', lang)}
                options={[
                  { value: '', label: lang === 'ar' ? 'اختر...' : 'Select...' },
                  { value: 'Riyadh', label: lang === 'ar' ? 'الرياض' : 'Riyadh' },
                  { value: 'Jeddah', label: lang === 'ar' ? 'جدة' : 'Jeddah' },
                  { value: 'Al Khobar', label: lang === 'ar' ? 'الخبر' : 'Al Khobar' },
                ]}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
              <Select
                label={t('onboarding.experienceLanguage', lang)}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ar', label: 'العربية' },
                ]}
                value={expLang}
                onChange={(e) => setExpLang(e.target.value as 'en' | 'ar')}
              />
              <Select
                label={t('onboarding.budgetRange', lang)}
                options={[
                  { value: '', label: lang === 'ar' ? 'اختر...' : 'Select...' },
                  { value: '100-200', label: `100–200 ${t('common.sar', lang)}` },
                  { value: '200-350', label: `200–350 ${t('common.sar', lang)}` },
                  { value: '350-500', label: `350–500 ${t('common.sar', lang)}` },
                ]}
              />
            </div>
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full" 
              onClick={() => {
                // Save preferences to state
                if (state.user && area) {
                  dispatch({
                    type: 'LOGIN',
                    payload: {
                      ...state.user,
                      preferences: {
                        ...state.user.preferences,
                        preferredArea: area,
                        experienceLanguage: expLang,
                      }
                    }
                  });
                }
                handleNext();
              }}
            >
              {lang === 'ar' ? 'ابدأ الاستكشاف' : 'Start exploring'}
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-16 text-center slide-up">
            <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-5">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {lang === 'ar' ? 'مرحباً بك!' : 'Welcome!'}
            </h2>
            <p className="text-sm text-text-secondary">
              {lang === 'ar' ? 'جاري تحضير تجاربك...' : 'Preparing your experiences...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
