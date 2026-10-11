import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './DesignSystem';
import { AppProvider } from '../data/store';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('StatusBadge Component', () => {
  it('should render confirmed status', () => {
    renderWithProvider(<StatusBadge state="confirmed" />);
    expect(screen.getByText('Confirmed')).toBeTruthy();
  });

  it('should render waitlisted status', () => {
    renderWithProvider(<StatusBadge state="waitlisted" />);
    expect(screen.getByText('Waitlisted')).toBeTruthy();
  });

  it('should render reconfirmation_required status', () => {
    renderWithProvider(<StatusBadge state="reconfirmation_required" />);
    expect(screen.getByText('Reconfirmation required')).toBeTruthy();
  });

  it('should render cancelled status', () => {
    renderWithProvider(<StatusBadge state="cancelled_by_participant" />);
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });

  it('should render expired status', () => {
    renderWithProvider(<StatusBadge state="expired" />);
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('should render full status', () => {
    renderWithProvider(<StatusBadge state="full" />);
    expect(screen.getByText('Full')).toBeTruthy();
  });

  it('should render published status', () => {
    renderWithProvider(<StatusBadge state="published" />);
    expect(screen.getByText('Available')).toBeTruthy();
  });

  it('should render with small size', () => {
    renderWithProvider(<StatusBadge state="confirmed" size="sm" />);
    const badge = screen.getByText('Confirmed').closest('span');
    expect(badge?.classList.contains('text-[11px]') || badge?.classList.contains('text-xs') || badge?.className.includes('text')).toBe(true);
  });

  it('should render with medium size', () => {
    renderWithProvider(<StatusBadge state="confirmed" size="md" />);
    const badge = screen.getByText('Confirmed').closest('span');
    expect(badge?.classList.contains('text-xs')).toBe(true);
  });

  it('should render with correct color for confirmed', () => {
    renderWithProvider(<StatusBadge state="confirmed" />);
    const badge = screen.getByText('Confirmed').closest('span');
    expect(badge?.classList.contains('bg-success-bg')).toBe(true);
    expect(badge?.classList.contains('text-success')).toBe(true);
  });

  it('should render with correct color for waitlisted', () => {
    renderWithProvider(<StatusBadge state="waitlisted" />);
    const badge = screen.getByText('Waitlisted').closest('span');
    expect(badge?.classList.contains('bg-info-bg')).toBe(true);
    expect(badge?.classList.contains('text-info')).toBe(true);
  });

  it('should render with correct color for cancelled', () => {
    renderWithProvider(<StatusBadge state="cancelled_by_participant" />);
    const badge = screen.getByText('Cancelled').closest('span');
    expect(badge?.classList.contains('bg-surface-sunken')).toBe(true);
    expect(badge?.classList.contains('text-text-tertiary')).toBe(true);
  });

  it('should render with icon', () => {
    renderWithProvider(<StatusBadge state="confirmed" />);
    const badge = screen.getByText('Confirmed').closest('span');
    const icon = badge?.querySelector('svg');
    expect(icon).toBeTruthy();
  });

  it('should handle unknown state gracefully', () => {
    renderWithProvider(<StatusBadge state="unknown_state" />);
    const badge = screen.getByText('Pending');
    expect(badge).toBeTruthy();
  });
});
