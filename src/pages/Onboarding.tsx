import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Input, Select } from '../components/DesignSystem';
import { Phone, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

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
  const [budget, setBudget] = useState('');
  const [expLang, setExpLang] = useState<'en' | 'ar'>('en');

  const handleNext = () => {
    switch (step) {
      case 'phone':
        if (phone.trim()) setStep('code');
        break;
      case 'code':
        setStep('adult');
        break;
      case 'adult':
        if (adultAccepted && termsAccepted) setStep('preferences');
        break;
      case 'preferences':
        setStep('complete');
        setTimeout(onComplete, 1500);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center pt-12 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">Y</span>
          </div>
          <span className="text-2xl font-bold text-charcoal-900">Yalla</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-8 mb-8">
        <div className="flex gap-2">
          {['phone', 'adult', 'preferences'].map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
              ['phone', 'code', 'adult', 'preferences', 'complete'].indexOf(step) > i ? 'bg-teal-500' : 'bg-sand-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8">
        {step === 'phone' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-charcoal-900 mb-2">{t('onboarding.phoneVerification', lang)}</h1>
              <p className="text-sm text-charcoal-500">{lang === 'ar' ? 'أدخل رقم هاتفك للبدء' : 'Enter your phone number to get started'}</p>
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
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold text-charcoal-900 mb-2">{t('onboarding.verifyCode', lang)}</h1>
              <p className="text-sm text-charcoal-500">{lang === 'ar' ? `أرسلنا رمزاً إلى ${phone}` : `We sent a code to ${phone}`}</p>
            </div>
            <Input
              label={lang === 'ar' ? 'رمز التحقق' : 'Verification code'}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              maxLength={4}
            />
            <p className="text-xs text-charcoal-400 text-center">
              {lang === 'ar' ? 'استخدم أي رمز للاختبار' : 'Use any code for testing'}
            </p>
            <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
              {t('common.confirm', lang)}
            </Button>
          </div>
        )}

        {step === 'adult' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-charcoal-900 mb-2">{t('onboarding.adultDeclaration', lang)}</h1>
            </div>
            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-sand-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adultAccepted}
                  onChange={(e) => setAdultAccepted(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-sand-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-charcoal-700">{t('onboarding.adultText', lang)}</span>
              </label>
              <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-sand-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-sand-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-charcoal-700">{t('onboarding.termsAccept', lang)}</span>
              </label>
            </div>
            <Button variant="primary" size="lg" className="w-full" disabled={!adultAccepted || !termsAccepted} onClick={handleNext}>
              {t('common.next', lang)}
            </Button>
          </div>
        )}

        {step === 'preferences' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold text-charcoal-900 mb-2">{t('onboarding.preferences', lang)}</h1>
              <p className="text-sm text-charcoal-500">{t('onboarding.whyCollectText', lang)}</p>
            </div>
            <div className="space-y-4">
              <Select
                label={t('onboarding.preferredArea', lang)}
                options={[
                  { value: '', label: lang === 'ar' ? 'اختر...' : 'Select...' },
                  { value: 'riyadh', label: lang === 'ar' ? 'الرياض' : 'Riyadh' },
                  { value: 'jeddah', label: lang === 'ar' ? 'جدة' : 'Jeddah' },
                  { value: 'khobar', label: lang === 'ar' ? 'الخبر' : 'Al Khobar' },
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
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
              {lang === 'ar' ? 'ابدأ الاستكشاف' : 'Start exploring'}
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-charcoal-900 mb-2">
              {lang === 'ar' ? 'مرحباً بك في يلا!' : 'Welcome to Yalla!'}
            </h2>
            <p className="text-sm text-charcoal-500">
              {lang === 'ar' ? 'جاري تحضير تجاربك...' : 'Preparing your experiences...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
