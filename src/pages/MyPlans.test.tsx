import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyPlansPage } from './MyPlans';
import { AppProvider } from '../data/store';

// Mock useToast hook
vi.mock('../components/Toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('MyPlansPage', () => {
  const mockOnViewExperience = vi.fn();
  const mockOnGoToArrival = vi.fn();
  const mockOnGoToFeedback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    expect(screen.getByText(/My Plans/i)).toBeTruthy();
  });

  it('renders Arabic title when language is Arabic', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>,
        { language: 'ar' },
    );

    expect(screen.getByText(/خططي/i)).toBeTruthy();
  });

  it('displays empty state when no reservations', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    expect(screen.getByText(/No plans yet/i)).toBeTruthy();
  });

  it('displays Arabic empty state', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>,
        { language: 'ar' },
    );

    expect(screen.getByText(/لا توجد خطط بعد/i)).toBeTruthy();
  });

  it('has explore button in empty state', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    const exploreButton = screen.getByText(/Explore experiences/i);
    expect(exploreButton).toBeTruthy();
  });

  it('has proper page structure', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    const container = document.querySelector('.min-h-screen');
    expect(container).toBeTruthy();
  });

  it('has proper padding', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    const container = document.querySelector('.px-5');
    expect(container).toBeTruthy();
  });

  it('has proper spacing', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    const title = screen.getByText(/My Plans/i);
    expect(title.className).toContain('text-2xl');
    expect(title.className).toContain('font-bold');
  });

  it('has empty state with icon', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    const icon = document.querySelector('.w-16');
    expect(icon).toBeTruthy();
  });

  it('has empty state with description', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>
    );

    expect(screen.getByText(/Start exploring to find your next experience/i)).toBeTruthy();
  });

  it('has Arabic description', () => {
    render(
      <AppProvider>
        <MyPlansPage
          onViewExperience={mockOnViewExperience}
          onGoToArrival={mockOnGoToArrival}
          onGoToFeedback={mockOnGoToFeedback}
        />
      </AppProvider>,
        { language: 'ar' },
    );

    expect(screen.getByText(/ابدأ الاستكشاف للعثور على تجربتك القادمة/i)).toBeTruthy();
  });
});
