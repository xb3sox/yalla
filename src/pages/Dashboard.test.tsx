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

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
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
});
