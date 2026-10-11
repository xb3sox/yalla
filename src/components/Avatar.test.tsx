import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';
import { AppProvider } from '../data/store';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('Avatar Component', () => {
  it('should render with single name', () => {
    renderWithProvider(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeTruthy();
  });

  it('should render with two names', () => {
    renderWithProvider(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('should render with three names', () => {
    renderWithProvider(<Avatar name="John Michael Doe" />);
    expect(screen.getByText('JM')).toBeTruthy();
  });

  it('should render with Arabic name', () => {
    renderWithProvider(<Avatar name="أحمد محمد" />);
    expect(screen.getByText('أم')).toBeTruthy();
  });

  it('should render with small size', () => {
    renderWithProvider(<Avatar name="John" size="sm" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('w-8')).toBe(true);
    expect(avatar?.classList.contains('h-8')).toBe(true);
  });

  it('should render with medium size', () => {
    renderWithProvider(<Avatar name="John" size="md" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('w-12')).toBe(true);
    expect(avatar?.classList.contains('h-12')).toBe(true);
  });

  it('should render with large size', () => {
    renderWithProvider(<Avatar name="John" size="lg" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('w-16')).toBe(true);
    expect(avatar?.classList.contains('h-16')).toBe(true);
  });

  it('should have rounded-full class', () => {
    renderWithProvider(<Avatar name="John" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('rounded-full')).toBe(true);
  });

  it('should have flex classes', () => {
    renderWithProvider(<Avatar name="John" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('flex')).toBe(true);
    expect(avatar?.classList.contains('items-center')).toBe(true);
    expect(avatar?.classList.contains('justify-center')).toBe(true);
  });

  it('should have font-semibold class', () => {
    renderWithProvider(<Avatar name="John" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('font-semibold')).toBe(true);
  });

  it('should have aria-label attribute', () => {
    renderWithProvider(<Avatar name="John Doe" />);
    const avatar = screen.getByLabelText('John Doe');
    expect(avatar).toBeTruthy();
  });

  it('should have consistent color based on name', () => {
    const { container: container1 } = renderWithProvider(<Avatar name="John" />);
    const { container: container2 } = renderWithProvider(<Avatar name="John" />);
    
    const avatar1 = container1.querySelector('div');
    const avatar2 = container2.querySelector('div');
    
    expect(avatar1?.className).toBe(avatar2?.className);
  });

  it('should have different colors for different names', () => {
    const { container: container1 } = renderWithProvider(<Avatar name="John" />);
    const { container: container2 } = renderWithProvider(<Avatar name="Jane" />);
    
    const avatar1 = container1.querySelector('div');
    const avatar2 = container2.querySelector('div');
    
    // They should have different color classes
    expect(avatar1?.className).not.toBe(avatar2?.className);
  });

  it('should handle empty name', () => {
    renderWithProvider(<Avatar name="" />);
    const avatar = document.querySelector('.rounded-full');
    expect(avatar).toBeTruthy();
  });

  it.skip('should handle name with special characters', () => {
    renderWithProvider(<Avatar name="John-Doe" />);
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('should handle name with numbers', () => {
    renderWithProvider(<Avatar name="User123" />);
    expect(screen.getByText('U')).toBeTruthy();
  });

  it('should handle name with spaces only', () => {
    renderWithProvider(<Avatar name="   " />);
    const avatar = document.querySelector('.rounded-full');
    expect(avatar).toBeTruthy();
  });

  it('should render with custom className', () => {
    renderWithProvider(<Avatar name="John" className="custom-class" />);
    const avatar = screen.getByText('J').closest('div');
    expect(avatar?.classList.contains('custom-class')).toBe(true);
  });

  it('should have text color based on background', () => {
    renderWithProvider(<Avatar name="John" />);
    const avatar = screen.getByText('J').closest('div');
    // Should have text color class
    expect(avatar?.className).toMatch(/text-/);
  });

  it('should have background color', () => {
    renderWithProvider(<Avatar name="John" />);
    const avatar = screen.getByText('J').closest('div');
    // Should have background color class
    expect(avatar?.className).toMatch(/bg-/);
  });
});
