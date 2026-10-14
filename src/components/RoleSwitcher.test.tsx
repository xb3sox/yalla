import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleSwitcher } from './RoleSwitcher';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('RoleSwitcher Component', () => {
  it('should not render when isOpen is false', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={false} onClose={() => {}} />
    );
    expect(screen.queryByText(/Switch Role/i)).toBeNull();
  });

  it('should render when isOpen is true', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/Switch Role/i)).toBeTruthy();
  });

  it('should render Arabic title when language is Arabic', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />,
        { language: 'ar' },
    );
    expect(screen.getAllByText(/تبديل الدور/i).length).toBeGreaterThan(0);
  });

  it('should display all role options', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/^Participant$/i)).toBeTruthy();
    expect(screen.getByText(/^Operations$/i)).toBeTruthy();
    expect(screen.getByText(/^Support$/i)).toBeTruthy();
    expect(screen.getByText(/^Trust & Safety$/i)).toBeTruthy();
  });

  it('should display Arabic role names', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />,
        { language: 'ar' },
    );
    expect(screen.getByText(/^مشارك$/i)).toBeTruthy();
    expect(screen.getByText(/^العمليات$/i)).toBeTruthy();
    expect(screen.getByText(/^الدعم$/i)).toBeTruthy();
    expect(screen.getByText(/^الثقة والسلامة$/i)).toBeTruthy();
  });

  it('should display role descriptions', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/Discover and book experiences/i)).toBeTruthy();
    expect(screen.getByText(/Manage plans, hosts, and venues/i)).toBeTruthy();
    expect(screen.getByText(/Handle support requests/i)).toBeTruthy();
    expect(screen.getByText(/Review safety cases/i)).toBeTruthy();
  });

  it('should display Arabic role descriptions', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />,
        { language: 'ar' },
    );
    expect(screen.getByText(/اكتشف واحجز التجارب/i)).toBeTruthy();
    expect(screen.getByText(/إدارة الخطط والمضيفين والأماكن/i)).toBeTruthy();
    expect(screen.getByText(/معالجة طلبات الدعم/i)).toBeTruthy();
    expect(screen.getByText(/مراجعة حالات السلامة/i)).toBeTruthy();
  });

  it('should have close button', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const closeButton = screen.getByLabelText('Close');
    expect(closeButton).toBeTruthy();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={onClose} />
    );
    
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should have backdrop', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const backdrop = document.querySelector('.bg-black\\/20');
    expect(backdrop).toBeTruthy();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={onClose} />
    );
    
    const backdrop = document.querySelector('.bg-black\\/20');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(onClose).toHaveBeenCalled();
  });

  it('should have proper z-index', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const panel = document.querySelector('.z-50');
    expect(panel).toBeTruthy();
  });

  it('should have slide-up animation', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const panel = document.querySelector('.slide-up');
    expect(panel).toBeTruthy();
  });

  it('should have role="dialog"', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
  });

  it('should have aria-label', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('Switch Role');
  });

  it('should display footer message', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    expect(screen.getByText(/Role switching is for demonstration only/i)).toBeTruthy();
  });

  it('should display Arabic footer message', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />,
        { language: 'ar' },
    );
    expect(screen.getByText(/تبديل الدور للمحاكاة فقط/i)).toBeTruthy();
  });

  it('should highlight current role', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    // Current role should have different styling
    const participantButton = screen.getByText(/Participant/i).closest('button');
    expect(participantButton?.classList.contains('bg-brand-50')).toBe(true);
  });

  it('should have icons for each role', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('should have proper button styling', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const buttons = screen.getAllByRole('button').filter(b => b.getAttribute('aria-label') !== 'Close' && !b.querySelector('svg.lucide-x'));
    buttons.forEach(button => {
      expect(button.classList.contains('w-full')).toBe(true);
      expect(button.classList.contains('flex')).toBe(true);
      expect(button.classList.contains('items-start')).toBe(true);
      expect(button.classList.contains('gap-3')).toBe(true);
      expect(button.classList.contains('p-3')).toBe(true);
      expect(button.classList.contains('rounded-lg')).toBe(true);
    });
  });

  it('should have hover effect for non-current roles', () => {
    renderWithProvider(
      <RoleSwitcher isOpen={true} onClose={() => {}} />
    );
    const operationsButton = screen.getByText(/Operations/i).closest('button');
    expect(operationsButton?.classList.contains('hover:bg-surface-sunken')).toBe(true);
  });
});
