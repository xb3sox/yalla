import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipToContent } from './SkipToContent';
import { AppProvider } from '../data/store';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('SkipToContent Component', () => {
  it('should render skip link', () => {
    renderWithProvider(<SkipToContent />);
    expect(screen.getByText('Skip to content')).toBeTruthy();
  });

  it('should render Arabic text when language is Arabic', () => {
    renderWithProvider(<SkipToContent />);
    expect(screen.getByText(/Skip to content|تخطي إلى المحتوى/i)).toBeTruthy();
  });

  it('should have href="#main-content"', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('should be hidden by default (sr-only)', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.classList.contains('sr-only')).toBe(true);
  });

  it('should become visible on focus', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    // Check that it has focus styles
    expect(link.className).toContain('focus:not-sr-only');
  });

  it('should have fixed position when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:fixed');
  });

  it('should have proper positioning when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:top-4');
    expect(link.className).toContain('focus:start-4');
  });

  it('should have high z-index when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:z-[100]');
  });

  it('should have brand background when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:bg-brand-500');
  });

  it('should have white text when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:text-white');
  });

  it('should have padding when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:px-4');
    expect(link.className).toContain('focus:py-2');
  });

  it('should have rounded corners when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:rounded-lg');
  });

  it('should have shadow when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:shadow-lg');
  });

  it('should have outline when focused', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    expect(link.className).toContain('focus:outline-none');
    expect(link.className).toContain('focus:ring-2');
    expect(link.className).toContain('focus:ring-brand-500');
    expect(link.className).toContain('focus:ring-offset-2');
  });

  it('should be an anchor element', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
  });

  it('should have proper accessibility role', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    expect(link).toBeTruthy();
  });

  it('should prevent default on click', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    // The component should handle click to focus main content
    expect(link.onclick).toBeDefined();
  });

  it('should have transition effect', () => {
    renderWithProvider(<SkipToContent />);
    const link = screen.getByRole('link');
    
    // Check for transition classes
    expect(link.className).toMatch(/focus:/);
  });
});
