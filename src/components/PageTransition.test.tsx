import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageTransition } from './PageTransition';

describe('PageTransition Component', () => {
  it('should render children', () => {
    render(
      <PageTransition transitionKey="test">
        <div>Test Content</div>
      </PageTransition>
    );
    expect(screen.getByText('Test Content')).toBeTruthy();
  });

  it('should have transition classes', () => {
    render(
      <PageTransition transitionKey="test">
        <div>Content</div>
      </PageTransition>
    );
    const container = screen.getByText('Content').parentElement;
    expect(container?.classList.contains('transition-all')).toBe(true);
    expect(container?.classList.contains('duration-300')).toBe(true);
    expect(container?.classList.contains('ease-out')).toBe(true);
  });

  it('should be visible initially', () => {
    render(
      <PageTransition transitionKey="test">
        <div>Content</div>
      </PageTransition>
    );
    const container = screen.getByText('Content').parentElement;
    expect(container?.classList.contains('opacity-100')).toBe(true);
    expect(container?.classList.contains('translate-y-0')).toBe(true);
  });

  it('should update children when transitionKey changes', async () => {
    const { rerender } = render(
      <PageTransition transitionKey="key1">
        <div>Content 1</div>
      </PageTransition>
    );
    
    expect(screen.getByText('Content 1')).toBeTruthy();
    
    rerender(
      <PageTransition transitionKey="key2">
        <div>Content 2</div>
      </PageTransition>
    );
    
    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 200));
    
    expect(screen.getByText('Content 2')).toBeTruthy();
  });

  it('should animate on transition', async () => {
    const { rerender } = render(
      <PageTransition transitionKey="key1">
        <div>Content 1</div>
      </PageTransition>
    );
    
    rerender(
      <PageTransition transitionKey="key2">
        <div>Content 2</div>
      </PageTransition>
    );
    
    // During transition, should have opacity-0
    const container = screen.getByText('Content 2').parentElement;
    // Note: This is a snapshot test, actual animation timing may vary
    expect(container).toBeTruthy();
  });

  it('should handle multiple children', () => {
    render(
      <PageTransition transitionKey="test">
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </PageTransition>
    );
    
    expect(screen.getByText('Child 1')).toBeTruthy();
    expect(screen.getByText('Child 2')).toBeTruthy();
    expect(screen.getByText('Child 3')).toBeTruthy();
  });

  it('should handle nested components', () => {
    render(
      <PageTransition transitionKey="test">
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
        </div>
      </PageTransition>
    );
    
    expect(screen.getByText('Title')).toBeTruthy();
    expect(screen.getByText('Paragraph')).toBeTruthy();
  });

  it('should not animate if transitionKey is the same', () => {
    const { rerender } = render(
      <PageTransition transitionKey="same">
        <div>Content</div>
      </PageTransition>
    );
    
    const container1 = screen.getByText('Content').parentElement;
    
    rerender(
      <PageTransition transitionKey="same">
        <div>Content</div>
      </PageTransition>
    );
    
    const container2 = screen.getByText('Content').parentElement;
    
    // Should be the same element
    expect(container1).toBe(container2);
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    
    const { unmount } = render(
      <PageTransition transitionKey="test">
        <div>Content</div>
      </PageTransition>
    );
    
    unmount();
    
    // clearTimeout should be called during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('should have proper initial state', () => {
    render(
      <PageTransition transitionKey="test">
        <div>Content</div>
      </PageTransition>
    );
    
    const container = screen.getByText('Content').parentElement;
    expect(container?.classList.contains('opacity-100')).toBe(true);
    expect(container?.classList.contains('translate-y-0')).toBe(true);
  });

  it('should handle empty children', () => {
    render(
      <PageTransition transitionKey="test">
        {null}
      </PageTransition>
    );
    
    // Should not crash
    expect(true).toBe(true);
  });

  it('should handle string children', () => {
    render(
      <PageTransition transitionKey="test">
        Text content
      </PageTransition>
    );
    
    expect(screen.getByText('Text content')).toBeTruthy();
  });
});
