import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';
import { AppProvider } from '../data/store';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('OfflineIndicator Component', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should not render when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    renderWithProvider(<OfflineIndicator />);
    expect(screen.queryByText(/offline/i)).toBeNull();
  });

  it('should render when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    expect(screen.getByText(/offline/i)).toBeTruthy();
  });

  it('should display Arabic message when language is Arabic', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    expect(screen.getByText(/غير متصل/i)).toBeTruthy();
  });

  it('should display English message when language is English', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    expect(screen.getByText(/offline/i)).toBeTruthy();
  });

  it('should have fixed position', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('fixed')).toBe(true);
  });

  it('should have proper z-index', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('z-50')).toBe(true);
  });

  it('should have warning background color', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('bg-warning-bg')).toBe(true);
  });

  it('should have warning border', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('border-warning')).toBe(true);
  });

  it('should have role="alert" for accessibility', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator).toBeTruthy();
  });

  it('should have aria-live="assertive" for screen readers', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.getAttribute('aria-live')).toBe('assertive');
  });

  it('should render WiFi off icon', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should add event listeners on mount', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    renderWithProvider(<OfflineIndicator />);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should remove event listeners on unmount', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const { unmount } = renderWithProvider(<OfflineIndicator />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should update when going offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    renderWithProvider(<OfflineIndicator />);
    
    expect(screen.queryByText(/offline/i)).toBeNull();
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const offlineHandler = addEventListenerSpy.mock.calls.find(
      (call: any) => call[0] === 'offline'
    )[1];
    offlineHandler();
    
    expect(screen.getByText(/offline/i)).toBeTruthy();
  });

  it('should update when going online', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    
    expect(screen.getByText(/offline/i)).toBeTruthy();
    
    // Simulate going online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const onlineHandler = addEventListenerSpy.mock.calls.find(
      (call: any) => call[0] === 'online'
    )[1];
    onlineHandler();
    
    expect(screen.queryByText(/offline/i)).toBeNull();
  });

  it('should have proper padding', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('px-4')).toBe(true);
    expect(indicator.classList.contains('py-2')).toBe(true);
  });

  it('should have flex layout', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('flex')).toBe(true);
    expect(indicator.classList.contains('items-center')).toBe(true);
    expect(indicator.classList.contains('justify-center')).toBe(true);
  });

  it('should have gap between icon and text', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('gap-2')).toBe(true);
  });

  it('should have slide-up animation', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    renderWithProvider(<OfflineIndicator />);
    const indicator = screen.getByRole('alert');
    expect(indicator.classList.contains('slide-up')).toBe(true);
  });
});
