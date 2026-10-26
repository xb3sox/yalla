import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfilePrivacy } from './ProfilePrivacy';
import { renderWithProviders } from '../test/utils';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  apiClient: {
    clearTokens: vi.fn(),
  },
  api: {
    user: {
      exportData: vi.fn(),
      deleteAccount: vi.fn(),
      updatePreferences: vi.fn(),
    },
  },
}));

describe('ProfilePrivacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders privacy page header and section headings', () => {
    renderWithProviders(<ProfilePrivacy />);

    expect(screen.getByText(/Privacy & Data Rights/i)).toBeTruthy();
    expect(screen.getByText(/Profile Data Correction/i)).toBeTruthy();
    expect(screen.getByText(/Export my data/i)).toBeTruthy();
    expect(screen.getByText(/Delete my data/i)).toBeTruthy();
  });

  it('renders data correction inputs with current user values', () => {
    renderWithProviders(<ProfilePrivacy />);

    const displayNameInput = screen.getByDisplayValue(/Ahmed/i);
    expect(displayNameInput).toBeTruthy();
  });

  it('triggers download when Export Data button is clicked', async () => {
    (api.user.exportData as any).mockResolvedValueOnce({
      data: { profile: { id: 'user-1' } },
    });

    globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    renderWithProviders(<ProfilePrivacy />);

    const exportBtn = screen.getByRole('button', { name: /Download Data Archive/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(api.user.exportData).toHaveBeenCalled();
    });
  });

  it('opens deletion modal when Request Account Deletion button is clicked', () => {
    renderWithProviders(<ProfilePrivacy />);

    const requestDeleteBtn = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestDeleteBtn);

    expect(screen.getByText(/Confirm Permanent Account Deletion/i)).toBeTruthy();
    expect(screen.getByLabelText(/Re-enter Password to Confirm/i)).toBeTruthy();
  });

  it('submits account deletion request when password is provided and confirmed', async () => {
    (api.user.deleteAccount as any).mockResolvedValueOnce({
      success: true,
      message: 'Account deleted',
    });

    renderWithProviders(<ProfilePrivacy />);

    // Open deletion modal
    const requestDeleteBtn = screen.getByRole('button', { name: /Request Account Deletion/i });
    fireEvent.click(requestDeleteBtn);

    // Enter password
    const passwordInput = screen.getByLabelText(/Re-enter Password to Confirm/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /Confirm Permanent Erasure/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.user.deleteAccount).toHaveBeenCalledWith({
        password: 'password123',
        confirm: true,
      });
    });
  });

  it('renders Arabic interface correctly', () => {
    renderWithProviders(<ProfilePrivacy />, { language: 'ar' });

    expect(screen.getByText(/الخصوصية وحماية البيانات/i)).toBeTruthy();
    expect(screen.getByText(/تصحيح وتحديث البيانات الشخصية/i)).toBeTruthy();
    expect(screen.getByText(/تنزيل أرشيف البيانات \(JSON\)/i)).toBeTruthy();
  });
});
