import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { AppProvider } from '../data/store';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  useLocation: () => ({ pathname: '/test' }),
}));

import { useAuth } from '../hooks/useAuth';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when not authenticated', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });

    render(
      <AppProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AppProvider>
    );

    expect(screen.getByTestId('navigate')).toBeTruthy();
    expect(screen.getByTestId('navigate').textContent).toBe('/login');
  });

  it('shows loading state when checking auth', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: true,
    });

    render(
      <AppProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AppProvider>
    );

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders children when authenticated', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', role: 'participant' },
      isLoading: false,
    });

    render(
      <AppProvider>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AppProvider>
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('allows access when user has required role', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', role: 'operations' },
      isLoading: false,
    });

    render(
      <AppProvider>
        <ProtectedRoute requiredRole="operations">
          <div>Staff Content</div>
        </ProtectedRoute>
      </AppProvider>
    );

    expect(screen.getByText('Staff Content')).toBeTruthy();
  });

  it('allows access for admin regardless of required role', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', role: 'admin' },
      isLoading: false,
    });

    render(
      <AppProvider>
        <ProtectedRoute requiredRole="operations">
          <div>Admin Content</div>
        </ProtectedRoute>
      </AppProvider>
    );

    expect(screen.getByText('Admin Content')).toBeTruthy();
  });

  it('denies access when user lacks required role', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-1', role: 'participant' },
      isLoading: false,
    });

    render(
      <AppProvider>
        <ProtectedRoute requiredRole="operations">
          <div>Staff Content</div>
        </ProtectedRoute>
      </AppProvider>
    );

    expect(screen.getByText('Access Denied')).toBeTruthy();
    expect(screen.queryByText('Staff Content')).toBeFalsy();
  });
});
