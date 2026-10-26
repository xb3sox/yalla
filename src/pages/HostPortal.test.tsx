import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import { HostPortalPage } from './HostPortal';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    host: {
      getSummary: vi.fn(),
      getExperiences: vi.fn(),
      getPayouts: vi.fn(),
      getRoster: vi.fn(),
      scheduleSession: vi.fn(),
      patchSession: vi.fn(),
      verifyPin: vi.fn(),
    },
  },
}));

describe('HostPortalPage', () => {
  const mockSummary = {
    overallRating: 4.8,
    totalEarnings: 1200,
    upcomingSessions: 3,
    totalAttendeesServed: 25,
    platformCommissionRate: 0.15,
  };

  const mockExperiences = [
    {
      id: 'exp-1',
      title: 'Pottery Workshop',
      title_ar: 'ورشة الفخار',
      date: '2027-05-01',
      time: '18:00',
      price: 150,
      capacity: 8,
      booked: 6,
      planState: 'published',
    },
  ];

  const mockPayouts = {
    pendingBalance: 500,
    totalPaidOut: 1200,
    payouts: [
      {
        id: 'exp-completed-1',
        sessionTitle: 'Past Pottery Class',
        sessionTitleAr: 'درس الفخار السابق',
        date: '2027-04-01',
        attendees: 5,
        grossRevenue: 750,
        platformFee: 112.5,
        netPayout: 637.5,
        stripeTransferStatus: 'transferred',
      },
    ],
  };

  const mockRoster = [
    {
      id: 'res-1',
      participantId: 'user-100',
      participantName: 'Ahmad Al-Mansoor',
      state: 'confirmed',
      pin: 'ABC123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.host.getSummary).mockResolvedValue({ success: true, data: mockSummary } as any);
    vi.mocked(api.host.getExperiences).mockResolvedValue({ success: true, data: mockExperiences } as any);
    vi.mocked(api.host.getPayouts).mockResolvedValue({ success: true, data: mockPayouts } as any);
    vi.mocked(api.host.getRoster).mockResolvedValue({ success: true, data: mockRoster } as any);
  });

  it('renders Host Portal header and overview metrics', async () => {
    renderWithProviders(<HostPortalPage />, { role: 'host' });

    await waitFor(() => {
      expect(screen.getByText('Host Portal')).toBeTruthy();
      expect(screen.getByText('25')).toBeTruthy(); // total attendees
      expect(screen.getByText('4.8 / 5.0')).toBeTruthy(); // rating
      expect(screen.getByText('1200 SAR')).toBeTruthy(); // earnings
    });
  });

  it('navigates through tabs: Calendar, Attendees, Earnings & Payouts', async () => {
    renderWithProviders(<HostPortalPage />, { role: 'host' });

    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeTruthy();
    });

    // Switch to Calendar tab
    const calendarTab = screen.getByText('Calendar');
    fireEvent.click(calendarTab);

    await waitFor(() => {
      expect(screen.getByText('6 / 8 seats booked')).toBeTruthy();
      expect(screen.getByText('75%')).toBeTruthy(); // seat utilization
    });

    // Switch to Attendees tab
    const attendeesTab = screen.getByText('Attendees');
    fireEvent.click(attendeesTab);

    await waitFor(() => {
      expect(screen.getByText('Enter Check-in PIN')).toBeTruthy();
      expect(screen.getByText('Ahmad Al-Mansoor')).toBeTruthy();
    });

    // Switch to Earnings & Payouts tab
    const payoutsTab = screen.getByText('Earnings & Payouts');
    fireEvent.click(payoutsTab);

    await waitFor(() => {
      expect(screen.getByText('Past Pottery Class')).toBeTruthy();
      expect(screen.getByText('+637.5 SAR')).toBeTruthy();
    });
  });

  it('allows checking in an attendee via PIN', async () => {
    vi.mocked(api.host.verifyPin).mockResolvedValue({
      success: true,
      message: 'Check-in successful',
      data: { id: 'res-1', state: 'checked_in' },
    } as any);

    renderWithProviders(<HostPortalPage />, { role: 'host' });

    // Go to Attendees tab
    await waitFor(() => {
      fireEvent.click(screen.getByText('Attendees'));
    });

    const pinInput = screen.getByPlaceholderText('Enter 6-character PIN or UUID prefix...');
    fireEvent.change(pinInput, { target: { value: 'ABC123' } });

    const checkInBtn = screen.getByText('Check In');
    fireEvent.click(checkInBtn);

    await waitFor(() => {
      expect(api.host.verifyPin).toHaveBeenCalledWith('exp-1', 'ABC123');
      expect(screen.getByText('Attendee checked in successfully')).toBeTruthy();
    });
  });

  it('handles scheduling new session modal submit', async () => {
    vi.mocked(api.host.scheduleSession).mockResolvedValue({
      success: true,
      data: { id: 'exp-2', title: 'New Cooking Class' },
    } as any);

    renderWithProviders(<HostPortalPage />, { role: 'host' });

    await waitFor(() => {
      expect(screen.getByText('Schedule New Session')).toBeTruthy();
    });

    const scheduleBtn = screen.getByText('Schedule New Session');
    fireEvent.click(scheduleBtn);

    const titleInput = screen.getByLabelText('Session Title');
    fireEvent.change(titleInput, { target: { value: 'New Cooking Class' } });

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.host.scheduleSession).toHaveBeenCalledTimes(1);
    });
  });

  it('displays error when attempting to reduce capacity below confirmed count', async () => {
    vi.mocked(api.host.patchSession).mockResolvedValue({
      success: false,
      error: {
        code: 'CAPACITY_TOO_LOW',
        message: 'Cannot reduce session capacity below current confirmed bookings.',
      },
    } as any);

    renderWithProviders(<HostPortalPage />, { role: 'host' });

    // Go to Calendar tab
    await waitFor(() => {
      fireEvent.click(screen.getByText('Calendar'));
    });

    const capacityInput = screen.getByRole('spinbutton');
    fireEvent.change(capacityInput, { target: { value: '4' } });

    await waitFor(() => {
      expect(api.host.patchSession).toHaveBeenCalledWith('exp-1', { capacity: 4 });
      expect(screen.getByText(/Cannot reduce/i)).toBeTruthy();
    });
  });
});
