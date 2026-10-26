import { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle } from 'lucide-react';
import { Button } from './DesignSystem';
import type { Language } from '../types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  language?: Language;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SentryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SentryErrorBoundary caught an error:', error, errorInfo);
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lang = this.props.language || 'en';
      const isArabic = lang === 'ar';

      const content = {
        en: {
          title: 'Something went wrong',
          subtitle: 'We encountered an unexpected error. Please try refreshing the page.',
          refresh: 'Refresh page',
          tryAgain: 'Try again',
        },
        ar: {
          title: 'حدث خطأ ما',
          subtitle: 'واجهنا خطأ غير متوقع. يرجى محاولة تحديث الصفحة.',
          refresh: 'إعادة تحميل الصفحة',
          tryAgain: 'إعادة المحاولة',
        },
      }[isArabic ? 'ar' : 'en'];

      return (
        <div
          className="min-h-screen bg-surface flex items-center justify-center p-6"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-error-bg flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{content.title}</h2>
            <p className="text-sm text-text-secondary mb-6">{content.subtitle}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                {content.refresh}
              </Button>
              <Button variant="primary" onClick={this.handleReset}>
                {content.tryAgain}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
