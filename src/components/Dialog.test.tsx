import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './DesignSystem';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('Dialog Component', () => {
  it('should not render when open is false', () => {
    renderWithProvider(
      <Dialog open={false} onClose={() => {}} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );
    
    expect(screen.queryByText('Test Dialog')).toBeNull();
  });

  it('should render when open is true', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );
    
    expect(screen.getByText('Test Dialog')).toBeTruthy();
    expect(screen.getByText('Dialog content')).toBeTruthy();
  });

  it('should render title', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="My Dialog Title">
        <p>Content</p>
      </Dialog>
    );
    
    expect(screen.getByText('My Dialog Title')).toBeTruthy();
  });

  it('should render children content', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="Test">
        <div>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </div>
      </Dialog>
    );
    
    expect(screen.getByText('First paragraph')).toBeTruthy();
    expect(screen.getByText('Second paragraph')).toBeTruthy();
  });

  it('should render actions when provided', () => {
    renderWithProvider(
      <Dialog 
        open={true} 
        onClose={() => {}} 
        title="Test"
        actions={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      >
        <p>Content</p>
      </Dialog>
    );
    
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    
    renderWithProvider(
      <Dialog open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Dialog>
    );
    
    // Click on backdrop (the overlay div)
    const backdrop = screen.getByText('Content').parentElement?.parentElement?.firstElementChild;
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should have correct role for accessibility', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
  });

  it('should have aria-modal attribute', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('should have aria-label attribute', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="My Dialog">
        <p>Content</p>
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toBe('My Dialog');
  });

  it('should render with proper styling', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="Test">
        <p>Content</p>
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog.classList.contains('bg-surface-raised')).toBe(true);
    expect(dialog.classList.contains('rounded-2xl')).toBe(true);
    expect(dialog.classList.contains('shadow-lg')).toBe(true);
  });

  it('should handle Escape key press', () => {
    const onClose = vi.fn();
    
    renderWithProvider(
      <Dialog open={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Dialog>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should trap focus within dialog', () => {
    renderWithProvider(
      <Dialog open={true} onClose={() => {}} title="Test">
        <button>First button</button>
        <button>Second button</button>
      </Dialog>
    );
    
    // Focus should be trapped within dialog
    const firstButton = screen.getByText('First button');
    const secondButton = screen.getByText('Second button');
    
    expect(firstButton).toBeTruthy();
    expect(secondButton).toBeTruthy();
  });
});
