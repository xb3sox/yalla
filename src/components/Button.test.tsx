import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './DesignSystem';
import { AppProvider } from '../data/store';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('Button Component', () => {
  it('should render with text', () => {
    renderWithProvider(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeTruthy();
  });

  it('should render as button element', () => {
    renderWithProvider(<Button>Click</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    renderWithProvider(<Button onClick={onClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render primary variant by default', () => {
    renderWithProvider(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('bg-brand-600')).toBe(true);
  });

  it('should render secondary variant', () => {
    renderWithProvider(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('bg-surface-raised')).toBe(true);
    expect(button.classList.contains('border')).toBe(true);
  });

  it('should render ghost variant', () => {
    renderWithProvider(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('text-brand-600')).toBe(true);
    expect(button.classList.contains('bg-transparent')).toBe(true);
  });

  it('should render danger variant', () => {
    renderWithProvider(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('bg-accent-600')).toBe(true);
  });

  it('should render small size', () => {
    renderWithProvider(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('px-3')).toBe(true);
    expect(button.classList.contains('py-2')).toBe(true);
    expect(button.classList.contains('text-sm')).toBe(true);
  });

  it('should render medium size by default', () => {
    renderWithProvider(<Button>Medium</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('px-5')).toBe(true);
    expect(button.classList.contains('py-2.5')).toBe(true);
    expect(button.classList.contains('text-[15px]')).toBe(true);
  });

  it('should render large size', () => {
    renderWithProvider(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('px-6')).toBe(true);
    expect(button.classList.contains('py-3.5')).toBe(true);
    expect(button.classList.contains('text-base')).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    renderWithProvider(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('should be disabled when loading prop is true', () => {
    renderWithProvider(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('should show loading spinner when loading', () => {
    renderWithProvider(<Button loading>Loading</Button>);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should have proper opacity when disabled', () => {
    renderWithProvider(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('opacity-50')).toBe(true);
  });

  it('should have pointer-events-none when disabled', () => {
    renderWithProvider(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('pointer-events-none')).toBe(true);
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    renderWithProvider(<Button disabled onClick={onClick}>Disabled</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    const onClick = vi.fn();
    renderWithProvider(<Button loading onClick={onClick}>Loading</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should have rounded corners', () => {
    renderWithProvider(<Button>Rounded</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('rounded-xl')).toBe(true);
  });

  it('should have transition classes', () => {
    renderWithProvider(<Button>Transition</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('transition-all')).toBe(true);
    expect(button.classList.contains('duration-200')).toBe(true);
  });

  it('should have flex layout', () => {
    renderWithProvider(<Button>Flex</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('inline-flex')).toBe(true);
    expect(button.classList.contains('items-center')).toBe(true);
    expect(button.classList.contains('justify-center')).toBe(true);
  });

  it('should have font-medium', () => {
    renderWithProvider(<Button>Font</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('font-medium')).toBe(true);
  });

  it('should have select-none', () => {
    renderWithProvider(<Button>Select</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('select-none')).toBe(true);
  });

  it('should render with icon', () => {
    renderWithProvider(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    expect(screen.getByText('Icon')).toBeTruthy();
    expect(screen.getByText('Text')).toBeTruthy();
  });

  it('should have min-height for small size', () => {
    renderWithProvider(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('min-h-[36px]')).toBe(true);
  });

  it('should have min-height for medium size', () => {
    renderWithProvider(<Button size="md">Medium</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('min-h-[44px]')).toBe(true);
  });

  it('should have min-height for large size', () => {
    renderWithProvider(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('min-h-[52px]')).toBe(true);
  });

  it('should accept custom className', () => {
    renderWithProvider(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('custom-class')).toBe(true);
  });

  it('should forward other props', () => {
    renderWithProvider(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button');
    expect(button.getAttribute('type')).toBe('submit');
  });

  it('should have hover effect for primary variant', () => {
    renderWithProvider(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('hover:bg-brand-700')).toBe(true);
  });

  it('should have active effect for primary variant', () => {
    renderWithProvider(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole('button');
    expect(button.classList.contains('active:bg-brand-800')).toBe(true);
  });
});
