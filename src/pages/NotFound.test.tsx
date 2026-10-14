import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { NotFoundPage } from './NotFound';
import { AppProvider } from '../data/store';
import { renderWithProviders } from '../test/utils';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders 404 error code', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('404')).toBeTruthy();
  });

  it('renders error message in English', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText(/Page Not Found/i)).toBeTruthy();
    expect(screen.getByText(/Sorry, the page you're looking for/i)).toBeTruthy();
  });

  it('renders error message in Arabic', () => {
    renderWithProviders(<NotFoundPage />, { language: 'ar' });

    expect(screen.getByText(/الصفحة غير موجودة/i)).toBeTruthy();
    expect(screen.getByText(/عذراً، الصفحة التي تبحث عنها/i)).toBeTruthy();
  });

  it('renders SVG illustration', () => {
    renderWithProviders(<NotFoundPage />);

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('has Go Home button', () => {
    renderWithProviders(<NotFoundPage />);

    const homeButton = screen.getByText(/Go Home/i);
    expect(homeButton).toBeTruthy();
  });

  it('has Arabic Go Home button', () => {
    renderWithProviders(<NotFoundPage />, { language: 'ar' });

    const homeButton = screen.getByText(/العودة للرئيسية/i);
    expect(homeButton).toBeTruthy();
  });

  it('has Explore button', () => {
    renderWithProviders(<NotFoundPage />);

    const exploreButton = screen.getByText(/Explore/i);
    expect(exploreButton).toBeTruthy();
  });

  it('has Arabic Explore button', () => {
    renderWithProviders(<NotFoundPage />, { language: 'ar' });

    const exploreButton = screen.getByText(/استكشف التجارب/i);
    expect(exploreButton).toBeTruthy();
  });

  it('has Go Back button', () => {
    renderWithProviders(<NotFoundPage />);

    const backButton = screen.getByText(/Go Back/i);
    expect(backButton).toBeTruthy();
  });

  it('has Arabic Go Back button', () => {
    renderWithProviders(<NotFoundPage />, { language: 'ar' });

    const backButton = screen.getByText(/رجوع/i);
    expect(backButton).toBeTruthy();
  });

  it('navigates to home when Go Home is clicked', () => {
    renderWithProviders(<NotFoundPage />);

    const homeButton = screen.getByText(/Go Home/i);
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to explore when Explore is clicked', () => {
    renderWithProviders(<NotFoundPage />);

    const exploreButton = screen.getByText(/Explore/i);
    fireEvent.click(exploreButton);

    expect(mockNavigate).toHaveBeenCalledWith('/explore');
  });

  it('navigates back when Go Back is clicked', () => {
    renderWithProviders(<NotFoundPage />);

    const backButton = screen.getByText(/Go Back/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('has contact support link', () => {
    renderWithProviders(<NotFoundPage />);

    const supportLink = screen.getByText(/contact support/i);
    expect(supportLink).toBeTruthy();
  });

  it('has Arabic contact support link', () => {
    renderWithProviders(<NotFoundPage />, { language: 'ar' });

    const supportLink = screen.getByText(/التواصل مع الدعم/i);
    expect(supportLink).toBeTruthy();
  });

  it('navigates to support when contact support is clicked', () => {
    renderWithProviders(<NotFoundPage />);

    const supportLink = screen.getByText(/contact support/i);
    fireEvent.click(supportLink);

    expect(mockNavigate).toHaveBeenCalledWith('/support');
  });

  it('has proper layout structure', () => {
    renderWithProviders(<NotFoundPage />);

    const container = document.querySelector('.min-h-screen');
    expect(container).toBeTruthy();
    expect(container?.className).toContain('flex');
    expect(container?.className).toContain('items-center');
    expect(container?.className).toContain('justify-center');
  });

  it('has centered content', () => {
    renderWithProviders(<NotFoundPage />);

    const content = document.querySelector('.text-center');
    expect(content).toBeTruthy();
  });

  it('has proper spacing', () => {
    renderWithProviders(<NotFoundPage />);

    const heading = screen.getByText('404');
    expect(heading.className).toContain('text-6xl');
    expect(heading.className).toContain('font-bold');
  });

  it('has help text section', () => {
    renderWithProviders(<NotFoundPage />);

    const helpText = screen.getByText(/If you believe this is a mistake/i);
    expect(helpText).toBeTruthy();
  });

  it('has Arabic help text section', () => {
    renderWithProviders(<NotFoundPage />, { language: 'ar' });

    const helpText = screen.getByText(/إذا كنت تعتقد أن هذا خطأ/i);
    expect(helpText).toBeTruthy();
  });
});
