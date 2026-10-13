import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('ConfirmDialog Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  it('should render when open is true', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeTruthy();
  });

  it('should not render when open is false', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirm Action')).toBeNull();
  });

  it('should render title', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} title="My Title" />);
    expect(screen.getByText('My Title')).toBeTruthy();
  });

  it('should render message', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} message="My message" />);
    expect(screen.getByText('My message')).toBeTruthy();
  });

  it('should render default cancel button', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should render default confirm button for danger variant', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="danger" />);
    expect(screen.getByText('Confirm deletion')).toBeTruthy();
  });

  it('should render default confirm button for warning variant', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="warning" />);
    expect(screen.getByText('Confirm')).toBeTruthy();
  });

  it('should render default confirm button for info variant', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="info" />);
    expect(screen.getByText('OK')).toBeTruthy();
  });

  it('should render custom cancel label', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} cancelLabel="Go Back" />);
    expect(screen.getByText('Go Back')).toBeTruthy();
  });

  it('should render custom confirm label', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} confirmLabel="Yes, Do It" />);
    expect(screen.getByText('Yes, Do It')).toBeTruthy();
  });

  it('should call onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    renderWithProvider(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    renderWithProvider(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    
    fireEvent.click(screen.getByText('Confirm deletion'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('should render with danger variant icon', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="danger" />);
    const iconContainer = document.querySelector('.bg-error-bg');
    expect(iconContainer).toBeTruthy();
  });

  it('should render with warning variant icon', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="warning" />);
    const iconContainer = document.querySelector('.bg-warning-bg');
    expect(iconContainer).toBeTruthy();
  });

  it('should render with info variant icon', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="info" />);
    const iconContainer = document.querySelector('.bg-info-bg');
    expect(iconContainer).toBeTruthy();
  });

  it('should render danger button for danger variant', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="danger" />);
    const confirmButton = screen.getByText('Confirm deletion');
    expect(confirmButton.classList.contains('bg-accent-600')).toBe(true);
  });

  it('should render primary button for warning variant', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="warning" />);
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton.classList.contains('bg-brand-600')).toBe(true);
  });

  it('should render primary button for info variant', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="info" />);
    const confirmButton = screen.getByText('OK');
    expect(confirmButton.classList.contains('bg-brand-600')).toBe(true);
  });

  it('should disable buttons when loading', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} loading={true} />);
    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Confirm deletion');
    
    expect(cancelButton.hasAttribute('disabled')).toBe(true);
    expect(confirmButton.hasAttribute('disabled')).toBe(true);
  });

  it('should show loading state on confirm button', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} loading={true} />);
    const confirmButton = screen.getByText('Confirm deletion');
    const spinner = confirmButton.querySelector('svg.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should render with correct icon for danger', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="danger" />);
    const icon = document.querySelector('.text-error');
    expect(icon).toBeTruthy();
  });

  it('should render with correct icon for warning', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="warning" />);
    const icon = document.querySelector('.text-warning');
    expect(icon).toBeTruthy();
  });

  it('should render with correct icon for info', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} variant="info" />);
    const icon = document.querySelector('.text-info');
    expect(icon).toBeTruthy();
  });

  it('should have proper layout', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);
    const layout = document.querySelector('.flex.items-start.gap-4');
    expect(layout).toBeTruthy();
  });

  it('should render icon container with correct size', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);
    const iconContainer = document.querySelector('.w-12.h-12');
    expect(iconContainer).toBeTruthy();
  });

  it('should render message with correct styling', () => {
    renderWithProvider(<ConfirmDialog {...defaultProps} />);
    const message = screen.getByText('Are you sure you want to proceed?');
    expect(message.classList.contains('text-sm')).toBe(true);
    expect(message.classList.contains('text-text-secondary')).toBe(true);
  });
});
