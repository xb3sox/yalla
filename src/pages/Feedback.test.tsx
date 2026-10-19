import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackPage } from './Feedback';
import { renderWithProviders } from '../test/utils';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    feedbacks: {
      create: vi.fn(),
      getByExperience: vi.fn(),
    },
  },
}));

describe('FeedbackPage', () => {
  const mockOnBack = vi.fn();
  const mockOnBookAnother = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and allows submitting feedback', async () => {
    (api.feedbacks.getByExperience as any).mockResolvedValue({
      success: true,
      data: [],
    });

    (api.feedbacks.create as any).mockResolvedValue({
      success: true,
      data: {
        id: 'fb-test',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 5,
        descriptionAccurate: true,
        comfortableOrganized: true,
        comment: 'Great!',
        createdAt: new Date().toISOString(),
      },
    });

    const extraActions: any[] = [
      { type: 'LOGIN', payload: { id: 'user-1', email: 'test@example.com', display_name: 'Test', role: 'participant' } },
    ];

    renderWithProviders(
      <FeedbackPage
        reservationId="res-1"
        onBack={mockOnBack}
        onBookAnother={mockOnBookAnother}
      />,
      {
        extraActions
      }
    );

    // Wait for the history loading to complete
    await waitFor(() => {
      expect(screen.getByText('Sunset Art Walk')).toBeTruthy();
    });

    // Select Rating
    const star5 = screen.getByLabelText('5/5');
    await userEvent.click(star5);

    // Select Yes/No
    const yesButtons = screen.getAllByRole('button', { name: 'Yes' });
    await userEvent.click(yesButtons[0]);
    await userEvent.click(yesButtons[1]);

    // Type comment
    const textarea = screen.getByPlaceholderText('Optional...');
    await userEvent.type(textarea, 'Great!');

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit feedback' });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.feedbacks.create).toHaveBeenCalledWith({
        reservationId: 'res-1',
        planId: 'exp-1',
        worthTime: 5,
        descriptionAccurate: true,
        comfortableOrganized: true,
        comment: 'Great!',
      });
    });

    expect(screen.getAllByText('Thank you for your feedback!').length).toBeGreaterThan(0);
  });

    it('loads history and shows submitted state if already submitted', async () => {
    (api.feedbacks.getByExperience as any).mockResolvedValue({
      success: true,
      data: [{
        id: 'fb-test-existing',
        reservationId: 'res-1',
        participantId: 'user-1',
        planId: 'exp-1',
        worthTime: 5,
        descriptionAccurate: true,
        comfortableOrganized: true,
        createdAt: new Date().toISOString(),
      }],
    });

    const extraActions: any[] = [
      { type: 'LOGIN', payload: { id: 'user-1', email: 'test@example.com', display_name: 'Test', role: 'participant' } },
    ];

    renderWithProviders(
      <FeedbackPage
        reservationId="res-1"
        onBack={mockOnBack}
        onBookAnother={mockOnBookAnother}
      />,
      {
        extraActions
      }
    );

    await waitFor(() => {
      expect(screen.getAllByText('Thank you for your feedback!').length).toBeGreaterThan(0);
    });

      // Ensure we fetched the history
      expect(api.feedbacks.getByExperience).toHaveBeenCalledWith('exp-1');
    });
  });
