import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { MyPlansPage } from './MyPlans';
import { renderWithProviders } from '../test/utils';

// Mock useToast hook
vi.mock('../components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('MyPlansPage', () => {
  const mockOnViewExperience = vi.fn();
  const mockOnGoToArrival = vi.fn();
  const mockOnGoToFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />
    );

    expect(screen.getByText(/My Plans/i)).toBeTruthy();
  });

  it('renders Arabic title when language is Arabic', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { language: 'ar' }
    );

    expect(screen.getByText(/خططي/i)).toBeTruthy();
  });

  it('displays empty state when no reservations', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { extraActions: [{ type: 'CLEAR_RESERVATIONS' }] }
    );

    expect(screen.getByText(/No plans yet/i)).toBeTruthy();
  });

  it('displays Arabic empty state', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { language: 'ar', extraActions: [{ type: 'CLEAR_RESERVATIONS' }] }
    );

    expect(screen.getByText(/لم تحجز أي تجارب بعد/i)).toBeTruthy();
  });

  it('has explore message in empty state', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { extraActions: [{ type: 'CLEAR_RESERVATIONS' }] }
    );

    expect(screen.getByText(/Start exploring/i)).toBeTruthy();
  });

  it('has proper page structure', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />
    );

    const container = document.querySelector('.px-5');
    expect(container).toBeTruthy();
  });

  it('has proper padding', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />
    );

    const container = document.querySelector('.px-5');
    expect(container).toBeTruthy();
  });

  it('has proper spacing', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />
    );

    const title = screen.getByText(/My Plans/i);
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('font-bold');
  });

  it('has empty state with icon', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { extraActions: [{ type: 'CLEAR_RESERVATIONS' }] }
    );

    const icon = document.querySelector('.w-10');
    expect(icon).toBeTruthy();
  });

  it('has empty state with description', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { extraActions: [{ type: 'CLEAR_RESERVATIONS' }] }
    );

    expect(screen.getByText(/You haven't booked any experiences yet. Start exploring!/i)).toBeTruthy();
  });

  it('has Arabic description', () => {
    renderWithProviders(
      <MyPlansPage
        onViewExperience={mockOnViewExperience}
        onGoToArrival={mockOnGoToArrival}
        onGoToFeedback={mockOnGoToFeedback}
      />,
      { language: 'ar', extraActions: [{ type: 'CLEAR_RESERVATIONS' }] }
    );

    expect(screen.getByText(/لم تحجز أي تجارب بعد. ابدأ بالاستكشاف!/i)).toBeTruthy();
  });
});
