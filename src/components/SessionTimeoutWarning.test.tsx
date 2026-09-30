import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { AppProvider } from '../data/store';

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AppProvider>
      {ui}
    </AppProvider>
  );
};

describe('SessionTimeoutWarning Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render initially', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    expect(screen.queryByText(/Session Timeout/i)).toBeNull();
  });

  it('should render after 25 minutes of inactivity', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    // Fast-forward 25 minutes
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/Session Timeout Warning/i)).toBeTruthy();
  });

  it('should render Arabic title when language is Arabic', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/تحذير انتهاء الجلسة/i)).toBeTruthy();
  });

  it('should display countdown timer', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    // Should display time in format MM:SS
    const timeElement = screen.getByText(/\d+:\d+/);
    expect(timeElement).toBeTruthy();
  });

  it('should display "Time remaining" label', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/Time remaining/i)).toBeTruthy();
  });

  it('should display Arabic "Time remaining" label', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/الوقت المتبقي/i)).toBeTruthy();
  });

  it('should display session expiration message', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/Your session will expire due to inactivity/i)).toBeTruthy();
  });

  it('should display Arabic session expiration message', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/ستنتهي جلستك بسبب عدم النشاط/i)).toBeTruthy();
  });

  it('should display extend session instructions', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/Click "Extend Session" to stay logged in/i)).toBeTruthy();
  });

  it('should display Arabic extend session instructions', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/اضغط على "تمديد الجلسة" للبقاء مسجلاً للدخول/i)).toBeTruthy();
  });

  it('should have Extend Session button', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/Extend Session/i)).toBeTruthy();
  });

  it('should have Arabic Extend Session button', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    expect(screen.getByText(/تمديد الجلسة/i)).toBeTruthy();
  });

  it('should close dialog when Extend Session is clicked', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    fireEvent.click(screen.getByText(/Extend Session/i));
    
    expect(screen.queryByText(/Session Timeout Warning/i)).toBeNull();
  });

  it('should have Clock icon', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should have warning background color', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    const iconContainer = document.querySelector('.bg-warning-bg');
    expect(iconContainer).toBeTruthy();
  });

  it('should countdown from 5 minutes', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    // Initial countdown should be 5:00
    const timeElement = screen.getByText('5:00');
    expect(timeElement).toBeTruthy();
  });

  it('should countdown decrease over time', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    // Initial time
    expect(screen.getByText('5:00')).toBeTruthy();
    
    // After 1 minute
    vi.advanceTimersByTime(60 * 1000);
    expect(screen.getByText('4:00')).toBeTruthy();
    
    // After 2 minutes
    vi.advanceTimersByTime(60 * 1000);
    expect(screen.getByText('3:00')).toBeTruthy();
  });

  it('should have tabular-nums for countdown', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    const timeElement = screen.getByText('5:00');
    expect(timeElement.classList.contains('tabular-nums')).toBe(true);
  });

  it('should have proper styling for time display', () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    const timeElement = screen.getByText('5:00');
    expect(timeElement.classList.contains('text-2xl')).toBe(true);
    expect(timeElement.classList.contains('font-bold')).toBe(true);
    expect(timeElement.classList.contains('text-text-primary')).toBe(true);
  });

  it('should cleanup timers on unmount', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    const { unmount } = renderWithProvider(<SessionTimeoutWarning />);
    
    vi.advanceTimersByTime(25 * 60 * 1000);
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('should cleanup warning timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    
    const { unmount } = renderWithProvider(<SessionTimeoutWarning />);
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
});
