import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/DesignSystem';
import { t } from '../i18n';
import { useApp } from '../data/store';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps = {}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adultAccepted, setAdultAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { login, register, isLoading, error, clearError } = useAuth();
  const { dispatch, state } = useApp();
  const lang = state.language;

  const handleLoginSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      dispatch({ type: 'SET_VIEW', payload: 'explore' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login(phone, password);
    if (success) {
      handleLoginSuccess();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await register({
      phone,
      password,
      display_name: displayName,
      adult_declaration_accepted: adultAccepted,
      terms_accepted: termsAccepted,
    });
    
    if (success) {
      handleLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Yalla</h1>
          <p className="text-text-secondary">
            {lang === 'ar' 
              ? 'اكتشف التجارب المحلية'
              : 'Discover local experiences'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'login'
                ? 'bg-brand-500 text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-sunken'
            }`}
          >
            {lang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'register'
                ? 'bg-brand-500 text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-surface-sunken'
            }`}
          >
            {lang === 'ar' ? 'إنشاء حساب' : 'Register'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <Input
              label={lang === 'ar' ? 'الاسم' : 'Display Name'}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={lang === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
              required
            />
          )}

          <Input
            label={lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={lang === 'ar' ? '+966 5X XXX XXXX' : '+966 5X XXX XXXX'}
            required
          />

          <Input
            label={lang === 'ar' ? 'كلمة المرور' : 'Password'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
            required
          />

          {mode === 'register' && (
            <div className="space-y-3">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={adultAccepted}
                  onChange={(e) => setAdultAccepted(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-text-secondary">
                  {lang === 'ar' 
                    ? 'أؤكد أن عمري 18 سنة أو أكثر'
                    : 'I confirm that I am 18 years or older'}
                </span>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                  required
                />
                <span className="text-sm text-text-secondary">
                  {lang === 'ar'
                    ? 'أوافق على الشروط وسياسة الخصوصية'
                    : 'I agree to the terms and privacy policy'}
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-3 bg-error-bg border border-error rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {mode === 'login'
              ? (lang === 'ar' ? 'تسجيل الدخول' : 'Login')
              : (lang === 'ar' ? 'إنشاء حساب' : 'Register')}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-surface-sunken rounded-lg">
          <p className="text-xs text-text-tertiary mb-2">
            {lang === 'ar' ? 'بيانات تجريبية:' : 'Demo credentials:'}
          </p>
          <div className="text-xs text-text-secondary space-y-1">
            <p>Participant: +966501234567 / password123</p>
            <p>Operations: +966503456789 / password123</p>
            <p>Admin: +966506789012 / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
