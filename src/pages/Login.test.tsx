import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './Login';
import { renderWithProviders } from '../test/utils';

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
    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/Yalla/i)).toBeTruthy();
    expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Register/i).length).toBeGreaterThan(0);
  });

  it('switches to register mode when register button is clicked', () => {
    renderWithProviders(<LoginPage />);

    const registerToggle = screen.getAllByRole('button', { name: /Register/i })[0];
    fireEvent.click(registerToggle);

    expect(screen.getByText(/Display Name/i)).toBeTruthy();
    expect(screen.getByText(/I confirm that I am 18 years or older/i)).toBeTruthy();
    expect(screen.getByText(/I agree to the terms and privacy policy/i)).toBeTruthy();
  });

  it('switches back to login mode when login button is clicked', () => {
    renderWithProviders(<LoginPage />);

    // Switch to register
    const registerToggle = screen.getAllByRole('button', { name: /Register/i })[0];
    fireEvent.click(registerToggle);
    expect(screen.getByText(/Display Name/i)).toBeTruthy();

    // Switch back to login
    const loginToggle = screen.getAllByRole('button', { name: /Login/i })[0];
    fireEvent.click(loginToggle);
    expect(screen.queryByText(/Display Name/i)).toBeFalsy();
  });

  it('renders phone input field', () => {
    renderWithProviders(<LoginPage />);

    const phoneInput = screen.getByPlaceholderText(/966/i);
    expect(phoneInput).toBeTruthy();
    expect(phoneInput.getAttribute('type')).toBe('tel');
  });

  it('renders password input field', () => {
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText(/password/i);
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.getAttribute('type')).toBe('password');
  });

  it('displays demo credentials', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByText(/Demo credentials/i)).toBeTruthy();
    expect(screen.getByText(/Participant: \+966501234567/)).toBeTruthy();
    expect(screen.getByText(/Operations: \+966503456789/)).toBeTruthy();
    expect(screen.getByText(/Admin: \+966506789012/)).toBeTruthy();
  });

  it('displays Arabic text', () => {
    renderWithProviders(<LoginPage />, { language: 'ar' });

    // Check for Arabic translations
    expect(screen.getByText(/اكتشف التجارب المحلية/i)).toBeTruthy();
  });

  it('has proper form structure', () => {
    renderWithProviders(<LoginPage />);

    const form = document.querySelector('form');
    expect(form).toBeTruthy();
  });

  it('has submit button', () => {
    renderWithProviders(<LoginPage />);

    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    expect(submitButton?.getAttribute('type')).toBe('submit');
  });

  it('has proper styling for mode toggle buttons', () => {
    renderWithProviders(<LoginPage />);

    const modeButtons = screen.getAllByRole('button');
    const loginButton = modeButtons.find(b => b.textContent?.trim() === 'Login' && b.getAttribute('type') !== 'submit');
    const registerButton = modeButtons.find(b => b.textContent?.trim() === 'Register');

    expect(loginButton?.className).toContain('bg-brand-500');
    expect(registerButton?.className).toContain('bg-surface-raised');
  });

  it('has centered layout', () => {
    renderWithProviders(<LoginPage />);

    const container = document.querySelector('.min-h-screen');
    expect(container?.className).toContain('flex');
    expect(container?.className).toContain('items-center');
    expect(container?.className).toContain('justify-center');
  });

  it('has max width for form', () => {
    renderWithProviders(<LoginPage />);

    const formContainer = document.querySelector('.max-w-md');
    expect(formContainer).toBeTruthy();
  });

  it('has logo section', () => {
    renderWithProviders(<LoginPage />);

    const logo = screen.getByText(/Yalla/i);
    expect(logo).toBeTruthy();
    expect(logo.className).toContain('text-3xl');
    expect(logo.className).toContain('font-bold');
  });
});
