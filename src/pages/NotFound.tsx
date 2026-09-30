import { useNavigate } from 'react-router-dom';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button } from '../components/DesignSystem';
import { Home, Search, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const lang = state.language;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <svg
            className="w-48 h-48 mx-auto"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Circle */}
            <circle cx="100" cy="100" r="90" fill="#F3F4F6" />
            
            {/* Question Mark */}
            <path
              d="M 80 70 Q 80 50 100 50 Q 120 50 120 70 Q 120 85 100 90 L 100 100"
              stroke="#14736A"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="100" cy="120" r="5" fill="#14736A" />
            
            {/* Decorative Elements */}
            <circle cx="40" cy="60" r="4" fill="#F59E0B" opacity="0.6" />
            <circle cx="160" cy="80" r="6" fill="#F59E0B" opacity="0.6" />
            <circle cx="50" cy="150" r="5" fill="#14736A" opacity="0.4" />
            <circle cx="150" cy="140" r="4" fill="#14736A" opacity="0.4" />
          </svg>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-brand-600 mb-4">404</h1>

        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          {lang === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h2>
        
        <p className="text-text-secondary mb-8">
          {lang === 'ar'
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
            : "Sorry, the page you're looking for doesn't exist or has been moved."}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {lang === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/explore')}
            className="flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {lang === 'ar' ? 'استكشف التجارب' : 'Explore'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'ar' ? 'رجوع' : 'Go Back'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-surface-sunken rounded-lg">
          <p className="text-sm text-text-secondary">
            {lang === 'ar'
              ? 'إذا كنت تعتقد أن هذا خطأ، يرجى '
              : "If you believe this is a mistake, please "}
            <button
              onClick={() => navigate('/support')}
              className="text-brand-600 hover:text-brand-700 font-medium underline"
            >
              {lang === 'ar' ? 'التواصل مع الدعم' : 'contact support'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
