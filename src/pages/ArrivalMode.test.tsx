import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ArrivalModePage } from './ArrivalMode';
import { api } from '../services/api';
import { renderWithProviders } from '../test/utils';

vi.mock('../services/api', () => ({
  api: {
    reservations: {
      checkIn: vi.fn().mockResolvedValue({ success: true })
    }
  }
}));


const showToastMock = vi.fn();

vi.mock('../components/Toast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/Toast')>();
  return {
    ...actual,
    useToast: () => ({
      showToast: showToastMock,
    }),
  };
});

describe('ArrivalModePage', () => {
  const mockOnBack = vi.fn();
  const mockExperienceId = 'exp-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    expect(screen.getAllByText(/Arrival/i).length).toBeGreaterThan(0);
  });

  it('renders Arabic title when language is Arabic', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />,
      { language: 'ar' }
    );

    expect(screen.getAllByText(/الوصول/i).length).toBeGreaterThan(0);
  });

  it('has back button', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    const backButton = screen.getByLabelText(/Back/i);
    expect(backButton).toBeTruthy();
  });

  it('calls onBack when back button is clicked', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    const backButton = screen.getByLabelText(/Back/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('does not report success when the check-in API call fails', async () => {
    vi.mocked(api.reservations.checkIn).mockRejectedValueOnce(new Error('network down'));

    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    // Open the arrival action and confirm
    fireEvent.click(screen.getByText(/I'?m here/));

    fireEvent.click(await screen.findByRole('button', { name: /^submit$/i }));

    await waitFor(() => {
      expect(api.reservations.checkIn).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith('error', expect.any(String));
    });

    expect(showToastMock).not.toHaveBeenCalledWith(
      'success',
      expect.stringMatching(/arrival|notified/i)
    );
  });

  it('displays not entitled message for non-confirmed reservations', () => {
    renderWithProviders(
      <ArrivalModePage experienceId="exp-3" onBack={mockOnBack} />
    );

    expect(screen.getByText(/Not yet available/i)).toBeTruthy();
  });

  it('displays Arabic not entitled message', () => {
    renderWithProviders(
      <ArrivalModePage experienceId="exp-3" onBack={mockOnBack} />,
      { language: 'ar' }
    );

    expect(screen.getByText(/غير متاح بعد/i)).toBeTruthy();
  });

  it('has proper page structure', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    const container = document.querySelector('.min-h-screen');
    expect(container).toBeTruthy();
  });

  it('has header with gradient background', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    const header = document.querySelector('.bg-brand-700');
    expect(header).toBeTruthy();
  });

  it('has proper padding', () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    const content = document.querySelector('.px-5');
    expect(content).toBeTruthy();
  });

  it('has centered message for not entitled', () => {
    renderWithProviders(
      <ArrivalModePage experienceId="exp-3" onBack={mockOnBack} />
    );

    const container = document.querySelector('.text-center');
    expect(container).toBeTruthy();
  });

  it('has icon for not entitled state', () => {
    renderWithProviders(
      <ArrivalModePage experienceId="exp-3" onBack={mockOnBack} />
    );

    const icon = document.querySelector('.w-10');
    expect(icon).toBeTruthy();
  });

  it('has explanation text', () => {
    renderWithProviders(
      <ArrivalModePage experienceId="exp-3" onBack={mockOnBack} />
    );

    expect(screen.getByText(/Exact venue details are available only/i)).toBeTruthy();
  });

  it('has Arabic explanation text', () => {
    renderWithProviders(
      <ArrivalModePage experienceId="exp-3" onBack={mockOnBack} />,
      { language: 'ar' }
    );

    expect(screen.getByText(/تفاصيل المكان الدقيق متاحة فقط/i)).toBeTruthy();
  });

  it('calls checkIn API when I am here action is clicked', async () => {
    renderWithProviders(
      <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
    );

    // Click "I'm Here" button
    const hereButton = screen.getByText(/I'm Here/i);
    fireEvent.click(hereButton);

    // Verify dialog opens and "Submit" is available
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    expect(submitButton).toBeTruthy();

    // Click submit
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.reservations.checkIn).toHaveBeenCalled();
    });
  });
});
