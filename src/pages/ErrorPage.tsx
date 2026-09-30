import { useNavigate } from 'react-router-dom';
import { useApp } from '../data/store';
import { Button } from '../components/DesignSystem';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorPage({ error, resetErrorBoundary }: ErrorPageProps) {
  const navigate = useNavigate();
  const { state } = useApp();
  const lang = state.language;

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Error Illustration */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-error-bg rounded-full flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-error" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-error mb-4">Oops!</h1>

        {/* Error Message */}
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          {lang === 'ar' ? 'حدث خطأ ما' : 'Something Went Wrong'}
        </h2>
        
        <p className="text-text-secondary mb-6">
          {lang === 'ar'
            ? 'نعتذر، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
            : "We're sorry, an unexpected error occurred. Please try again."}
        </p>

        {/* Error Details (Development Only) */}
        {error && import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-surface-sunken rounded-lg text-left">
            <p className="text-xs font-mono text-text-tertiary mb-2">
              <strong>Error:</strong> {error.message}
            </p>
            {error.stack && (
              <details className="text-xs">
                <summary className="cursor-pointer text-text-tertiary hover:text-text-secondary">
                  Stack Trace
                </summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={handleRetry}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            {lang === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-surface-sunken rounded-lg">
          <p className="text-sm text-text-secondary mb-2">
            {lang === 'ar'
              ? 'إذا استمرت المشكلة، يرجى'
              : 'If the problem persists, please'}
          </p>
          <button
            onClick={() => navigate('/support')}
            className="text-brand-600 hover:text-brand-700 font-medium underline text-sm"
          >
            {lang === 'ar' ? 'التواصل مع فريق الدعم' : 'contact our support team'}
          </button>
        </div>
      </div>
    </div>
  );
}
