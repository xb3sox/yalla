import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RewardsWidget } from './RewardsWidget';
import { renderWithProviders } from '../test/utils';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    rewards: {
      get: vi.fn(),
      redeem: vi.fn()
    }
  }
}));

const renderWithProvider = renderWithProviders;

describe('RewardsWidget Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.rewards.get as any).mockResolvedValue({
      success: true,
      data: {
        transactions: [
          { type: 'earn', points: 100 },
          { type: 'earn', points: 50 },
          { type: 'redeem', points: -20 },
        ]
      }
    });
  });

  it('should render rewards widget', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      expect(screen.getByText(/Reward Points/i)).toBeTruthy();
    });
  });

  it('should render Arabic title when language is Arabic', async () => {
    renderWithProvider(<RewardsWidget />, { language: 'ar' });
    await waitFor(() => {
      expect(screen.getByText(/نقاط المكافآت/i)).toBeTruthy();
    });
  });

  it('should display total points after fetching', async () => {
    renderWithProvider(<RewardsWidget />);
    // Should display 150 points (100 + 50 from earn transactions)
    await waitFor(() => {
      expect(screen.getByText('150')).toBeTruthy();
    });
  });

  it('should display tier', async () => {
    renderWithProvider(<RewardsWidget />);
    // 150 points is Bronze tier
    await waitFor(() => {
      const tierElement = document.querySelector('.text-sm.font-semibold');
      expect(tierElement).toBeTruthy();
    });
  });

  it('should display tier icon', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      const iconElement = document.querySelector('.text-2xl');
      expect(iconElement).toBeTruthy();
    });
  });

  it('should display progress bar', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      const progressElement = document.querySelector('[role="progressbar"]');
      expect(progressElement).toBeTruthy();
    });
  });

  it('should display points to next tier', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      const pointsToGo = screen.getByText(/points to go/i);
      expect(pointsToGo).toBeTruthy();
    });
  });

  it('should display Arabic points to next tier', async () => {
    renderWithProvider(<RewardsWidget />, { language: 'ar' });
    await waitFor(() => {
      const pointsToGo = screen.getByText(/نقطة متبقية/i);
      expect(pointsToGo).toBeTruthy();
    });
  });

  it('should display how to earn points section', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      expect(screen.getByText(/How to earn points/i)).toBeTruthy();
    });
  });

  it('should display Arabic how to earn points', async () => {
    renderWithProvider(<RewardsWidget />, { language: 'ar' });
    await waitFor(() => {
      expect(screen.getByText(/كيف تكسب النقاط/i)).toBeTruthy();
    });
  });

  it('should display booking points', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      expect(screen.getByText('10')).toBeTruthy();
      expect(screen.getByText(/Booking/i)).toBeTruthy();
    });
  });

  it('should display Arabic booking label', async () => {
    renderWithProvider(<RewardsWidget />, { language: 'ar' });
    await waitFor(() => {
      expect(screen.getByText(/حجز/i)).toBeTruthy();
    });
  });

  it('should display attendance points', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      expect(screen.getByText('20')).toBeTruthy();
      expect(screen.getByText(/Attend/i)).toBeTruthy();
    });
  });

  it('should display Arabic attendance label', async () => {
    renderWithProvider(<RewardsWidget />, { language: 'ar' });
    await waitFor(() => {
      expect(screen.getByText(/حضور/i)).toBeTruthy();
    });
  });

  it('should display review points', async () => {
    renderWithProvider(<RewardsWidget />);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText(/Review/i)).toBeTruthy();
    });
  });

  it('should display Arabic review label', async () => {
    renderWithProvider(<RewardsWidget />, { language: 'ar' });
    await waitFor(() => {
      expect(screen.getByText(/تقييم/i)).toBeTruthy();
    });
  });
});
