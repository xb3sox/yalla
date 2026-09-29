import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './Login';
import { AppProvider } from '../data/store';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    isLoading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

// Mock useNavigate
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    expect(screen.getByText(/Yalla/i)).toBeTruthy();
    expect(screen.getByText(/Login/i)).toBeTruthy();
    expect(screen.getByText(/Register/i)).toBeTruthy();
  });

  it('switches to register mode when register button is clicked', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const registerButton = screen.getByText(/Register/i);
    fireEvent.click(registerButton);

    expect(screen.getByText(/Display Name/i)).toBeTruthy();
    expect(screen.getByText(/I confirm that I am 18 years or older/i)).toBeTruthy();
    expect(screen.getByText(/I agree to the terms and privacy policy/i)).toBeTruthy();
  });

  it('switches back to login mode when login button is clicked', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    // Switch to register
    fireEvent.click(screen.getByText(/Register/i));
    expect(screen.getByText(/Display Name/i)).toBeTruthy();

    // Switch back to login
    fireEvent.click(screen.getByText(/Login/i));
    expect(screen.queryByText(/Display Name/i)).toBeFalsy();
  });

  it('renders phone input field', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const phoneInput = screen.getByPlaceholderText(/966/i);
    expect(phoneInput).toBeTruthy();
    expect(phoneInput.getAttribute('type')).toBe('tel');
  });

  it('renders password input field', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const passwordInput = screen.getByPlaceholderText(/password/i);
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('displays demo credentials', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    expect(screen.getByText(/Demo credentials/i)).toBeTruthy();
    expect(screen.getByText(/Participant: \+966501234567/)).toBeTruthy();
    expect(screen.getByText(/Operations: \+966503456789/)).toBeTruthy();
    expect(screen.getByText(/Admin: \+966506789012/)).toBeTruthy();
  });

  it('displays Arabic text', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    // Check for Arabic translations
    expect(screen.getByText(/اكتشف التجارب المحلية/i)).toBeTruthy();
  });

  it('has proper form structure', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const form = document.querySelector('form');
    expect(form).toBeTruthy();
  });

  it('has submit button', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const submitButton = screen.getByRole('button', { name: /Login/i });
    expect(submitButton).toBeTruthy();
    expect(submitButton.getAttribute('type')).toBe('submit');
  });

  it('has proper styling for mode toggle buttons', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const loginButton = screen.getByText(/Login/i);
    const registerButton = screen.getByText(/Register/i);

    // Active button should have brand color
    expect(loginButton.className).toContain('bg-brand-500');
    // Inactive button should have surface color
    expect(registerButton.className).toContain('bg-surface-raised');
  });

  it('has centered layout', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const container = document.querySelector('.min-h-screen');
    expect(container?.className).toContain('flex');
    expect(container?.className).toContain('items-center');
    expect(container?.className).toContain('justify-center');
  });

  it('has max width for form', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const formContainer = document.querySelector('.max-w-md');
    expect(formContainer).toBeTruthy();
  });

  it('has logo section', () => {
    render(
      <AppProvider>
        <LoginPage />
      </AppProvider>
    );

    const logo = screen.getByText(/Yalla/i);
    expect(logo).toBeTruthy();
    expect(logo.className).toContain('text-3xl');
    expect(logo.className).toContain('font-bold');
  });
});
