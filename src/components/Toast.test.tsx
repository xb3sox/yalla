import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

// Test component that uses the toast hook
const TestComponent = () => {
  const { showToast } = useToast();
  
  return (
    <div>
      <button onClick={() => showToast('success', 'Success message')}>
        Show Success
      </button>
      <button onClick={() => showToast('error', 'Error message')}>
        Show Error
      </button>
      <button onClick={() => showToast('info', 'Info message')}>
        Show Info
      </button>
    </div>
  );
};

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render toast provider', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeTruthy();
  });

  it('should show success toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeTruthy();
    });
  });

  it('should show error toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Error'));
    
    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeTruthy();
    });
  });

  it('should show info toast when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Info'));
    
    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeTruthy();
    });
  });

  it('should auto-dismiss toast after duration', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeTruthy();
    });

    // Fast-forward time
    vi.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.queryByText('Success message')).toBeNull();
    });
  });

  it('should dismiss toast when close button is clicked', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeTruthy();
    });

    // Find and click close button
    const closeButton = screen.getByLabelText('Dismiss');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Success message')).toBeNull();
    });
  });

  it('should show multiple toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    fireEvent.click(screen.getByText('Show Error'));
    fireEvent.click(screen.getByText('Show Info'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeTruthy();
      expect(screen.getByText('Error message')).toBeTruthy();
      expect(screen.getByText('Info message')).toBeTruthy();
    });
  });

  it('should have correct role for accessibility', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      const toast = screen.getByRole('alert');
      expect(toast).toBeTruthy();
    });
  });

  it('should have aria-live attribute for screen readers', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Success'));
    
    await waitFor(() => {
      const toast = screen.getByRole('alert');
      expect(toast.getAttribute('aria-live')).toBe('polite');
    });
  });
});
