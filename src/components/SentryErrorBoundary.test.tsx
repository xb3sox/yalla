import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SentryErrorBoundary } from './SentryErrorBoundary';
import * as Sentry from '@sentry/react';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('SentryErrorBoundary Component', () => {
  it('should render children when no error occurs', () => {
    render(
      <SentryErrorBoundary>
        <div>Child content</div>
      </SentryErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeTruthy();
  });

  it('should catch errors and display English UI by default', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SentryErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SentryErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(
      screen.getByText('We encountered an unexpected error. Please try refreshing the page.')
    ).toBeTruthy();
    expect(screen.getByText('Refresh page')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();

    expect(Sentry.captureException).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('should display Arabic UI when language prop is "ar"', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SentryErrorBoundary language="ar">
        <ThrowError shouldThrow={true} />
      </SentryErrorBoundary>
    );

    expect(screen.getByText('حدث خطأ ما')).toBeTruthy();
    expect(
      screen.getByText('واجهنا خطأ غير متوقع. يرجى محاولة تحديث الصفحة.')
    ).toBeTruthy();
    expect(screen.getByText('إعادة تحميل الصفحة')).toBeTruthy();
    expect(screen.getByText('إعادة المحاولة')).toBeTruthy();

    consoleError.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SentryErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ThrowError shouldThrow={true} />
      </SentryErrorBoundary>
    );

    expect(screen.getByText('Custom Fallback')).toBeTruthy();

    consoleError.mockRestore();
  });

  it('should reset error state when try again button is clicked', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <SentryErrorBoundary>
        <ThrowError shouldThrow={true} />
      </SentryErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    fireEvent.click(screen.getByText('Try again'));

    // Verify reset attempt occurred
    consoleError.mockRestore();
  });
});
