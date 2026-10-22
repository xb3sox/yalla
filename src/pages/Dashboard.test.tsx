import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './Dashboard';
import { AppProvider } from '../data/store';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    reservations: { list: vi.fn() },
    notifications: { list: vi.fn(), getUnreadCount: vi.fn() },
    favorites: { list: vi.fn() },
  },
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', display_name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.reservations.list as any).mockResolvedValue({ success: true, data: { reservations: [] } });
    (api.notifications.list as any).mockResolvedValue({ success: true, data: { notifications: [] } });
    (api.notifications.getUnreadCount as any).mockResolvedValue({ success: true, data: { unreadCount: 0 } });
    (api.favorites.list as any).mockResolvedValue({ success: true, data: { favorites: [] } });
  });

  it('renders dashboard with user name', async () => {
    render(<AppProvider><DashboardPage /></AppProvider>);
    await waitFor(() => expect(screen.getByText(/Welcome, Test User/i)).toBeTruthy());
  });

  it('displays stats cards', async () => {
    render(<AppProvider><DashboardPage /></AppProvider>);
    await waitFor(() => {
      expect(screen.getByText('Upcoming Reservations')).toBeTruthy();
      expect(screen.getByText('Unread Notifications')).toBeTruthy();
      expect(screen.getByText('Favorite Experiences')).toBeTruthy();
      expect(screen.getByText('Reward Points')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    (api.reservations.list as any).mockImplementation(() => new Promise(() => {}));
    render(<AppProvider><DashboardPage /></AppProvider>);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows error state when API fails', async () => {
    (api.reservations.list as any).mockRejectedValue(new Error('Network error'));
    render(<AppProvider><DashboardPage /></AppProvider>);
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });

  it('displays quick actions', async () => {
    render(<AppProvider><DashboardPage /></AppProvider>);
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeTruthy();
      expect(screen.getByText('Explore Experiences')).toBeTruthy();
    });
  });

  it('calculates reward points correctly', async () => {
    const mockReservations = [
      { id: 'res-1', state: 'completed', created_at: '2026-01-20T10:00:00Z' },
      { id: 'res-2', state: 'completed', created_at: '2026-01-15T10:00:00Z' },
    ];
    (api.reservations.list as any).mockResolvedValue({ success: true, data: { reservations: mockReservations } });
    render(<AppProvider><DashboardPage /></AppProvider>);
    await waitFor(() => {
      expect(screen.getByText('60')).toBeTruthy();
    });
  });

  it('calls onNavigate callback when quick action or stat card is clicked', async () => {
    const mockOnNavigate = vi.fn();
    render(<AppProvider><DashboardPage onNavigate={mockOnNavigate} /></AppProvider>);
    await waitFor(() => expect(screen.getByText('Explore Experiences')).toBeTruthy());

    screen.getByText('Explore Experiences').click();
    expect(mockOnNavigate).toHaveBeenCalledWith('explore');
  });

  it('calls onOpenNotifications when notification card button is clicked', async () => {
    const mockOnOpenNotifications = vi.fn();
    render(<AppProvider><DashboardPage onOpenNotifications={mockOnOpenNotifications} /></AppProvider>);
    await waitFor(() => expect(screen.getByText('Unread Notifications')).toBeTruthy());

    const notificationCard = screen.getByText('Unread Notifications').closest('div');
    const viewAllBtn = notificationCard?.querySelector('button');
    viewAllBtn?.click();
    expect(mockOnOpenNotifications).toHaveBeenCalled();
  });

  it('falls back to default title when Arabic notification title is missing in Arabic mode', async () => {
    (api.notifications.list as any).mockResolvedValue({
      success: true,
      data: {
        notifications: [
          {
            id: 'notif-1',
            title: 'English Title Only',
            body: 'English Body Only',
            state: 'delivered',
            created_at: '2026-01-20T10:00:00Z',
          },
        ],
      },
    });

    render(
      <AppProvider initialActions={[{ type: 'SET_LANGUAGE', payload: 'ar' }]}>
        <DashboardPage />
      </AppProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('English Title Only')).toBeTruthy();
      expect(screen.getByText('English Body Only')).toBeTruthy();
    });
  });
});
