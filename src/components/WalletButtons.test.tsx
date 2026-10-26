import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletButtons } from './WalletButtons';
import { renderWithProviders } from '../test/utils';

describe('WalletButtons Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Add to Apple Wallet" and "Add to Google Wallet" buttons', () => {
    renderWithProviders(<WalletButtons reservationId="res-123" />);

    const appleButton = screen.getByRole('button', { name: /Add to Apple Wallet/i });
    const googleButton = screen.getByRole('button', { name: /Add to Google Wallet/i });

    expect(appleButton).toBeTruthy();
    expect(googleButton).toBeTruthy();
  });

  it('renders venue privacy disclosure notice', () => {
    renderWithProviders(<WalletButtons reservationId="res-123" />);

    expect(
      screen.getByText(/Exact venue GPS coordinates and check-in PIN/i)
    ).toBeTruthy();
  });

  it('triggers Apple Wallet download when Apple button is clicked', async () => {
    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['fake_pass_pkpass']),
    });
    vi.stubGlobal('fetch', globalFetch);

    renderWithProviders(<WalletButtons reservationId="res-123" />);

    const appleButton = screen.getByRole('button', { name: /Add to Apple Wallet/i });
    fireEvent.click(appleButton);

    await waitFor(() => {
      expect(globalFetch).toHaveBeenCalledWith(
        '/api/v1/reservations/res-123/wallet/apple',
        expect.any(Object)
      );
    });

    vi.unstubAllGlobals();
  });

  it('triggers Google Wallet redirect when Google button is clicked', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { saveUrl: 'https://pay.google.com/gp/v/save/jwt123' },
      }),
    });
    vi.stubGlobal('fetch', globalFetch);

    renderWithProviders(<WalletButtons reservationId="res-123" />);

    const googleButton = screen.getByRole('button', { name: /Add to Google Wallet/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://pay.google.com/gp/v/save/jwt123',
        '_blank',
        'noopener,noreferrer'
      );
    });

    windowOpenSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
