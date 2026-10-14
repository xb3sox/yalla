import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './DesignSystem';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('EmptyState Component', () => {
  it('should render title', () => {
    renderWithProvider(
      <EmptyState title="No items found" />
    );
    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('should render description when provided', () => {
    renderWithProvider(
      <EmptyState 
        title="No items" 
        description="Try adjusting your filters"
      />
    );
    expect(screen.getByText('Try adjusting your filters')).toBeTruthy();
  });

  it('should not render description when not provided', () => {
    renderWithProvider(
      <EmptyState title="No items" />
    );
    // Should not crash
    expect(screen.getByText('No items')).toBeTruthy();
  });

  it('should render icon when provided', () => {
    const icon = <div data-testid="test-icon">Icon</div>;
    renderWithProvider(
      <EmptyState title="No items" icon={icon} />
    );
    expect(screen.getByTestId('test-icon')).toBeTruthy();
  });

  it('should render action when provided', () => {
    const action = <button>Take Action</button>;
    renderWithProvider(
      <EmptyState title="No items" action={action} />
    );
    expect(screen.getByText('Take Action')).toBeTruthy();
  });

  it('should call action onClick when clicked', () => {
    const onClick = vi.fn();
    const action = <button onClick={onClick}>Click Me</button>;
    renderWithProvider(
      <EmptyState title="No items" action={action} />
    );
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be centered', () => {
    renderWithProvider(
      <EmptyState title="No items" />
    );
    const container = document.querySelector('.flex.flex-col.items-center');
    expect(container).toBeTruthy();
  });

  it('should have proper padding', () => {
    renderWithProvider(
      <EmptyState title="No items" />
    );
    const container = document.querySelector('.py-20');
    expect(container).toBeTruthy();
  });

  it('should have proper text alignment', () => {
    renderWithProvider(
      <EmptyState title="No items" />
    );
    const container = document.querySelector('.text-center');
    expect(container).toBeTruthy();
  });

  it('should render title with correct styling', () => {
    renderWithProvider(
      <EmptyState title="No items" />
    );
    const title = screen.getByText('No items');
    expect(title.classList.contains('text-base')).toBe(true);
    expect(title.classList.contains('font-semibold')).toBe(true);
    expect(title.classList.contains('text-text-primary')).toBe(true);
  });

  it('should render description with correct styling', () => {
    renderWithProvider(
      <EmptyState 
        title="No items" 
        description="Description text"
      />
    );
    const description = screen.getByText('Description text');
    expect(description.classList.contains('text-sm')).toBe(true);
    expect(description.classList.contains('text-text-secondary')).toBe(true);
  });

  it('should have proper spacing between elements', () => {
    renderWithProvider(
      <EmptyState 
        title="No items" 
        description="Description"
        action={<button>Action</button>}
      />
    );
    
    const title = screen.getByText('No items');
    const description = screen.getByText('Description');
    
    expect(title.classList.contains('mb-1.5') || title.classList.contains('mb-2')).toBe(true);
    expect(description.classList.contains('mb-6')).toBe(true);
  });

  it('should render icon with proper styling', () => {
    const icon = <div data-testid="icon">Icon</div>;
    renderWithProvider(
      <EmptyState title="No items" icon={icon} />
    );
    
    const iconContainer = document.querySelector('.mb-4');
    expect(iconContainer).toBeTruthy();
  });

  it('should handle long title', () => {
    const longTitle = 'This is a very long title that should still render properly';
    renderWithProvider(
      <EmptyState title={longTitle} />
    );
    expect(screen.getByText(longTitle)).toBeTruthy();
  });

  it('should handle long description', () => {
    const longDescription = 'This is a very long description that should still render properly and not break the layout';
    renderWithProvider(
      <EmptyState 
        title="No items" 
        description={longDescription}
      />
    );
    expect(screen.getByText(longDescription)).toBeTruthy();
  });

  it('should have max width for description', () => {
    renderWithProvider(
      <EmptyState 
        title="No items" 
        description="Description"
      />
    );
    const description = screen.getByText('Description');
    expect(description.classList.contains('max-w-xs')).toBe(true);
  });

  it('should render all elements in correct order', () => {
    const icon = <div data-testid="icon">Icon</div>;
    const action = <button>Action</button>;
    
    renderWithProvider(
      <EmptyState 
        title="Title" 
        description="Description"
        icon={icon}
        action={action}
      />
    );
    
    const container = document.querySelector('.flex.flex-col.items-center');
    const children = Array.from(container?.children || []);
    
    // Icon wrapper should contain icon
    expect(children[0]?.querySelector('[data-testid="icon"]')).toBeTruthy();
    // Title should be second
    expect(children[1]?.textContent).toBe('Title');
    // Description should be third
    expect(children[2]?.textContent).toBe('Description');
    // Action should be fourth
    expect(children[3]?.textContent).toBe('Action');
  });
});
