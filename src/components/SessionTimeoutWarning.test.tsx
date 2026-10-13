import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionTimeoutWarning } from './SessionTimeoutWarning';
import { renderWithProviders } from '../test/utils';

const renderWithProvider = renderWithProviders;

describe('SessionTimeoutWarning Component', async () => {
  beforeEach(async () => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
  });

  it('should not render initially', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    expect(screen.queryByText(/Session Timeout/i)).toBeNull();
  });

  it('should render after 25 minutes of inactivity', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    // Fast-forward 25 minutes
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/Session Timeout Warning/i)).toBeTruthy();
  });

  it('should render Arabic title when language is Arabic', async () => {
    renderWithProvider(<SessionTimeoutWarning />, { language: 'ar' });
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/تحذير انتهاء الجلسة/i)).toBeTruthy();
  });

  it('should display countdown timer', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    // Should display time in format MM:SS
    const timeElement = screen.getByText(/\d+:\d+/);
    expect(timeElement).toBeTruthy();
  });

  it('should display "Time remaining" label', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/Time remaining/i)).toBeTruthy();
  });

  it('should display Arabic "Time remaining" label', async () => {
    renderWithProvider(<SessionTimeoutWarning />, { language: 'ar' });
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/الوقت المتبقي/i)).toBeTruthy();
  });

  it('should display session expiration message', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/Your session will expire due to inactivity/i)).toBeTruthy();
  });

  it('should display Arabic session expiration message', async () => {
    renderWithProvider(<SessionTimeoutWarning />, { language: 'ar' });
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/ستنتهي جلستك بسبب عدم النشاط/i)).toBeTruthy();
  });

  it('should display extend session instructions', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/Click "Extend Session" to stay logged in/i)).toBeTruthy();
  });

  it('should display Arabic extend session instructions', async () => {
    renderWithProvider(<SessionTimeoutWarning />, { language: 'ar' });
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/اضغط على "تمديد الجلسة" للبقاء مسجلاً للدخول/i)).toBeTruthy();
  });

  it('should have Extend Session button', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/Extend Session/i)).toBeTruthy();
  });

  it('should have Arabic Extend Session button', async () => {
    renderWithProvider(<SessionTimeoutWarning />, { language: 'ar' });
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    expect(screen.getByText(/تمديد الجلسة/i)).toBeTruthy();
  });

  it('should close dialog when Extend Session is clicked', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    fireEvent.click(screen.getByText(/Extend Session/i));
    
    expect(screen.queryByText(/Session Timeout Warning/i)).toBeNull();
  });

  it('should have Clock icon', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should have warning background color', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    const iconContainer = document.querySelector('.bg-warning-bg');
    expect(iconContainer).toBeTruthy();
  });

  it('should countdown from 5 minutes', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    // Initial countdown should be 5:00
    const timeElement = screen.getByText('5:00');
    expect(timeElement).toBeTruthy();
  });

  it('should countdown decrease over time', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    // Initial time
    expect(screen.getByText('5:00')).toBeTruthy();
    
    // After 1 minute
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(screen.getByText('4:00')).toBeTruthy();
    
    // After 2 minutes
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(screen.getByText('3:00')).toBeTruthy();
  });

  it('should have tabular-nums for countdown', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    const timeElement = screen.getByText('5:00');
    expect(timeElement.classList.contains('tabular-nums')).toBe(true);
  });

  it('should have proper styling for time display', async () => {
    renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    const timeElement = screen.getByText('5:00');
    expect(timeElement.classList.contains('text-2xl')).toBe(true);
    expect(timeElement.classList.contains('font-bold')).toBe(true);
    expect(timeElement.classList.contains('text-text-primary')).toBe(true);
  });

  it('should cleanup timers on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    const { unmount } = renderWithProvider(<SessionTimeoutWarning />);
    
    await vi.advanceTimersByTimeAsync(25 * 60 * 1000);
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('should cleanup warning timer on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    
    const { unmount } = renderWithProvider(<SessionTimeoutWarning />);
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
});
