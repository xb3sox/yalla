import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackToTop } from './BackToTop';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('BackToTop Component', () => {
  it('should not render when scroll position is less than 500px', () => {
    renderWithProvider(<BackToTop />);
    expect(screen.queryByLabelText('Back to top')).toBeNull();
  });

  it('should render when scroll position is greater than 500px', () => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    
    renderWithProvider(<BackToTop />);
    
    // Trigger scroll event
    fireEvent.scroll(window);
    
    expect(screen.getByLabelText('Back to top')).toBeTruthy();
  });

  it('should have correct aria-label', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button).toBeTruthy();
  });

  it('should scroll to top when clicked', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;
    
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    fireEvent.click(button);
    
    expect(scrollToMock).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth',
    });
  });

  it('should have fixed position', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('fixed')).toBe(true);
  });

  it('should have proper z-index', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('z-30')).toBe(true);
  });

  it('should have rounded-full class', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('rounded-full')).toBe(true);
  });

  it('should have proper size', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('w-10')).toBe(true);
    expect(button.classList.contains('h-10')).toBe(true);
  });

  it('should have shadow', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('shadow-md')).toBe(true);
  });

  it('should have hover effect', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('hover:bg-surface-sunken')).toBe(true);
  });

  it('should have transition effect', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('transition-all')).toBe(true);
  });

  it('should render arrow icon with aria-hidden', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('should have focus visible styling for keyboard navigation', () => {
    Object.defineProperty(window, 'scrollY', { value: 600, writable: true });
    renderWithProvider(<BackToTop />);
    fireEvent.scroll(window);

    const button = screen.getByLabelText('Back to top');
    expect(button.classList.contains('focus-visible:outline-brand-500')).toBe(true);
  });
});
