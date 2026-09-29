import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArrivalModePage } from './ArrivalMode';
import { AppProvider } from '../data/store';

// Mock useToast hook
vi.mock('../components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ArrivalModePage', () => {
  const mockOnBack = vi.fn();
  const mockExperienceId = 'exp-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    expect(screen.getByText(/Arrival/i)).toBeTruthy();
  });

  it('renders Arabic title when language is Arabic', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    expect(screen.getByText(/الوصول/i)).toBeTruthy();
  });

  it('has back button', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const backButton = screen.getByLabelText(/Back/i);
    expect(backButton).toBeTruthy();
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const backButton = screen.getByLabelText(/Back/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('displays not entitled message for non-confirmed reservations', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    // Should show not entitled message since we're using mock data
    expect(screen.getByText(/Not yet available/i)).toBeTruthy();
  });

  it('displays Arabic not entitled message', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    expect(screen.getByText(/غير متاح بعد/i)).toBeTruthy();
  });

  it('has proper page structure', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const container = document.querySelector('.min-h-screen');
    expect(container).toBeTruthy();
  });

  it('has header with gradient background', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const header = document.querySelector('.bg-brand-700');
    expect(header).toBeTruthy();
  });

  it('has proper padding', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const content = document.querySelector('.px-5');
    expect(content).toBeTruthy();
  });

  it('has centered message for not entitled', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const container = document.querySelector('.text-center');
    expect(container).toBeTruthy();
  });

  it('has icon for not entitled state', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    const icon = document.querySelector('.w-12');
    expect(icon).toBeTruthy();
  });

  it('has explanation text', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    expect(screen.getByText(/Exact venue details are available only/i)).toBeTruthy();
  });

  it('has Arabic explanation text', () => {
    render(
      <AppProvider>
        <ArrivalModePage experienceId={mockExperienceId} onBack={mockOnBack} />
      </AppProvider>
    );

    expect(screen.getByText(/تفاصيل المكان الدقيقة متاحة فقط/i)).toBeTruthy();
  });
});
