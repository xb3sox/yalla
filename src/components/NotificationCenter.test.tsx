import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenter, NotificationBell } from './NotificationCenter';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

// Helper: render NotificationCenter with an Arabic locale pre-seeded through
// the real reducer (keeps tests honest about default-English state).
const renderArabic = (ui: React.ReactElement, options?: Parameters<typeof renderWithProvider>[1]) =>
  renderWithProvider(ui, { ...options, language: 'ar' });

describe('NotificationCenter Component', () => {
  it('should not render when isOpen is false', () => {
    renderWithProvider(
      <NotificationCenter isOpen={false} onClose={() => {}} />
    );
    expect(screen.queryByText(/Notifications/i)).toBeNull();
  });

  it('should render when isOpen is true', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/Notifications/i)).toBeTruthy();
  });

  it('should render Arabic title when language is Arabic', () => {
    renderArabic(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/الإشعارات/i)).toBeTruthy();
  });

  it('should have close button', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeTruthy();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={onClose} />
    );
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should handle Escape key press to close', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={onClose} />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('should have aria-modal attribute', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('should have backdrop', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeTruthy();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={onClose} />
    );
    
    const backdrop = document.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalled();
  });

  it('should have proper z-index', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const panel = document.querySelector('.z-50');
    expect(panel).toBeTruthy();
  });

  it('should have slide-up animation', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const panel = document.querySelector('.slide-up');
    expect(panel).toBeTruthy();
  });

  it('should have role="dialog"', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
  });

  it('should have aria-label', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Notifications');
  });

  it('should display empty state when no notifications', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />,
      { extraActions: [{ type: 'CLEAR_NOTIFICATIONS' as const }] }
    );
    expect(screen.getByText(/No notifications yet/i)).toBeTruthy();
  });

  it('should display Arabic empty state', () => {
    renderArabic(
      <NotificationCenter isOpen={true} onClose={() => {}} />,
      { extraActions: [{ type: 'CLEAR_NOTIFICATIONS' as const }] }
    );
    expect(screen.getByText(/لا توجد إشعارات/i)).toBeTruthy();
  });

  it('should have max height', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const panel = document.querySelector('.max-h-96');
    expect(panel).toBeTruthy();
  });

  it('should be scrollable', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const content = document.querySelector('.overflow-y-auto');
    expect(content).toBeTruthy();
  });

  it('should have header border', () => {
    renderWithProvider(
      <NotificationCenter isOpen={true} onClose={() => {}} />
    );
    const header = document.querySelector('.border-b');
    expect(header).toBeTruthy();
  });
});

describe('NotificationBell Component', () => {
  it('should render bell icon', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should have aria-label', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const button = screen.getByLabelText('Notifications');
    expect(button).toBeTruthy();
  });

  it('should have Arabic aria-label', () => {
    renderArabic(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const button = screen.getByLabelText('الإشعارات');
    expect(button).toBeTruthy();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    renderWithProvider(
      <NotificationBell onClick={onClick} count={0} />
    );
    
    fireEvent.click(screen.getByLabelText('Notifications'));
    expect(onClick).toHaveBeenCalled();
  });

  it('should not show badge when count is 0', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const badge = document.querySelector('.bg-accent-500');
    expect(badge).toBeNull();
  });

  it('should show badge when count is greater than 0', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={5} />
    );
    const badge = screen.getByText('5');
    expect(badge).toBeTruthy();
  });

  it('should show "9+" when count is greater than 9', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={15} />
    );
    const badge = screen.getByText('9+');
    expect(badge).toBeTruthy();
  });

  it('should have proper badge styling', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={5} />
    );
    const badge = screen.getByText('5');
    expect(badge.classList.contains('bg-accent-500')).toBe(true);
    expect(badge.classList.contains('text-white')).toBe(true);
    expect(badge.classList.contains('rounded-full')).toBe(true);
  });

  it('should have hover effect', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const button = screen.getByLabelText('Notifications');
    expect(button.classList.contains('hover:bg-surface-sunken')).toBe(true);
  });

  it('should have transition effect', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const button = screen.getByLabelText('Notifications');
    expect(button.classList.contains('transition-colors')).toBe(true);
  });

  it('should have rounded-full class', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const button = screen.getByLabelText('Notifications');
    expect(button.classList.contains('rounded-full')).toBe(true);
  });

  it('should have proper padding', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={0} />
    );
    const button = screen.getByLabelText('Notifications');
    expect(button.classList.contains('p-2')).toBe(true);
  });

  it('should have relative position for badge', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={5} />
    );
    const button = screen.getByLabelText('Notifications');
    expect(button.classList.contains('relative')).toBe(true);
  });

  it('should position badge absolutely', () => {
    renderWithProvider(
      <NotificationBell onClick={() => {}} count={5} />
    );
    const badge = screen.getByText('5');
    expect(badge.classList.contains('absolute')).toBe(true);
    expect(badge.classList.contains('top-0.5')).toBe(true);
    expect(badge.classList.contains('end-0.5')).toBe(true);
  });
});
