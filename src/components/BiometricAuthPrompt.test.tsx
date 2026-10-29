import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BiometricAuthPrompt } from './BiometricAuthPrompt';
import { AppProvider } from '../data/store';
import * as nativePlugins from '../services/nativePlugins';

vi.mock('../services/nativePlugins', () => ({
  checkBiometricAvailability: vi.fn(),
  verifyBiometric: vi.fn(),
  setSecureItem: vi.fn().mockResolvedValue(true),
}));

describe('BiometricAuthPrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PIN fallback when biometrics are unavailable (e.g. web)', async () => {
    vi.mocked(nativePlugins.checkBiometricAvailability).mockResolvedValue({ isAvailable: false });

    render(
      <AppProvider>
        <BiometricAuthPrompt
          isOpen={true}
          onSuccess={vi.fn()}
          onCancel={vi.fn()}
        />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Enter Venue Pass PIN')).toBeTruthy();
    });

    expect(screen.getByPlaceholderText('••••')).toBeTruthy();
  });

  it('handles PIN submission correctly', async () => {
    vi.mocked(nativePlugins.checkBiometricAvailability).mockResolvedValue({ isAvailable: false });
    const onSuccess = vi.fn();

    render(
      <AppProvider>
        <BiometricAuthPrompt
          isOpen={true}
          onSuccess={onSuccess}
          onCancel={vi.fn()}
          fallbackPin="1234"
        />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••')).toBeTruthy();
    });

    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: '1234' } });

    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows error on incorrect PIN', async () => {
    vi.mocked(nativePlugins.checkBiometricAvailability).mockResolvedValue({ isAvailable: false });
    const onSuccess = vi.fn();

    render(
      <AppProvider>
        <BiometricAuthPrompt
          isOpen={true}
          onSuccess={onSuccess}
          onCancel={vi.fn()}
          fallbackPin="1234"
        />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••')).toBeTruthy();
    });

    const input = screen.getByPlaceholderText('••••');
    fireEvent.change(input, { target: { value: '0000' } });

    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Incorrect PIN. Please try again.')).toBeTruthy();
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('allows clicking biometric button when available on native', async () => {
    vi.mocked(nativePlugins.checkBiometricAvailability).mockResolvedValue({ isAvailable: true, biometricType: 'FACE_ID' });
    vi.mocked(nativePlugins.verifyBiometric).mockResolvedValue(true);
    const onSuccess = vi.fn();

    render(
      <AppProvider>
        <BiometricAuthPrompt
          isOpen={true}
          onSuccess={onSuccess}
          onCancel={vi.fn()}
        />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Biometric Unlock')).toBeTruthy();
    });

    const retryBtn = screen.getByText('Try Biometrics Again');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(nativePlugins.verifyBiometric).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
