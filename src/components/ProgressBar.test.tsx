import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('ProgressBar Component', () => {
  it('should render with default props', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
  });

  it('should render with 0% progress', () => {
    renderWithProvider(<ProgressBar progress={0} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('should render with 100% progress', () => {
    renderWithProvider(<ProgressBar progress={100} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should render with 50% progress', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('50');
  });

  it('should clamp progress to 0-100 range', () => {
    renderWithProvider(<ProgressBar progress={150} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('should clamp negative progress to 0', () => {
    renderWithProvider(<ProgressBar progress={-50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('should render with brand color', () => {
    renderWithProvider(<ProgressBar progress={50} color="brand" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('bg-brand-500')).toBe(true);
  });

  it('should render with success color', () => {
    renderWithProvider(<ProgressBar progress={50} color="success" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('bg-success')).toBe(true);
  });

  it('should render with warning color', () => {
    renderWithProvider(<ProgressBar progress={50} color="warning" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('bg-warning')).toBe(true);
  });

  it('should render with error color', () => {
    renderWithProvider(<ProgressBar progress={50} color="error" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('bg-error')).toBe(true);
  });

  it('should render with small size', () => {
    renderWithProvider(<ProgressBar progress={50} size="sm" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('h-1')).toBe(true);
  });

  it('should render with medium size', () => {
    renderWithProvider(<ProgressBar progress={50} size="md" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('h-2')).toBe(true);
  });

  it('should render with large size', () => {
    renderWithProvider(<ProgressBar progress={50} size="lg" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('h-3')).toBe(true);
  });

  it('should show label when showLabel is true', () => {
    renderWithProvider(<ProgressBar progress={50} showLabel label="Progress" />);
    expect(screen.getByText('Progress')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('should not show label when showLabel is false', () => {
    renderWithProvider(<ProgressBar progress={50} showLabel={false} label="Progress" />);
    expect(screen.queryByText('Progress')).toBeNull();
  });

  it('should show rounded percentage', () => {
    renderWithProvider(<ProgressBar progress={50.7} showLabel label="Progress" />);
    expect(screen.getByText('51%')).toBeTruthy();
  });

  it('should have correct aria-valuemin', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
  });

  it('should have correct aria-valuemax', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('should have aria-label when label is provided', () => {
    renderWithProvider(<ProgressBar progress={50} label="Test Progress" />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-label')).toBe('Test Progress');
  });

  it('should have default aria-label when no label is provided', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-label')).toBe('Progress');
  });

  it('should render with correct width style', () => {
    renderWithProvider(<ProgressBar progress={75} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.style.width).toBe('75%');
  });

  it('should have transition animation', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.classList.contains('transition-all')).toBe(true);
    expect(progressbar.classList.contains('duration-500')).toBe(true);
    expect(progressbar.classList.contains('ease-out')).toBe(true);
  });

  it('should render container with correct classes', () => {
    renderWithProvider(<ProgressBar progress={50} />);
    const container = document.querySelector('.bg-surface-sunken');
    expect(container).toBeTruthy();
    expect(container?.classList.contains('rounded-full')).toBe(true);
    expect(container?.classList.contains('overflow-hidden')).toBe(true);
  });

  it('should handle decimal progress values', () => {
    renderWithProvider(<ProgressBar progress={33.33} showLabel label="Test" />);
    expect(screen.getByText('33%')).toBeTruthy();
  });

  it('should handle progress at boundaries', () => {
    const { rerender } = renderWithProvider(<ProgressBar progress={0} showLabel label="Test" />);
    expect(screen.getByText('0%')).toBeTruthy();
    
    rerender(<ProgressBar progress={100} showLabel label="Test" />);
    expect(screen.getByText('100%')).toBeTruthy();
  });
});
