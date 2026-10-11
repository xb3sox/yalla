import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotFoundPage } from './NotFound';
import { AppProvider } from '../data/store';

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
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    expect(screen.getByText('404')).toBeTruthy();
  });

  it('renders error message in English', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    expect(screen.getByText(/Page Not Found/i)).toBeTruthy();
    expect(screen.getByText(/Sorry, the page you're looking for/i)).toBeTruthy();
  });

  it('renders error message in Arabic', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    expect(screen.getByText(/الصفحة غير موجودة/i)).toBeTruthy();
    expect(screen.getByText(/عذراً، الصفحة التي تبحث عنها/i)).toBeTruthy();
  });

  it('renders SVG illustration', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const svg = document.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('has Go Home button', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const homeButton = screen.getByText(/Go Home/i);
    expect(homeButton).toBeTruthy();
  });

  it('has Arabic Go Home button', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const homeButton = screen.getByText(/العودة للرئيسية/i);
    expect(homeButton).toBeTruthy();
  });

  it('has Explore button', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const exploreButton = screen.getByText(/Explore/i);
    expect(exploreButton).toBeTruthy();
  });

  it('has Arabic Explore button', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const exploreButton = screen.getByText(/استكشف التجارب/i);
    expect(exploreButton).toBeTruthy();
  });

  it('has Go Back button', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const backButton = screen.getByText(/Go Back/i);
    expect(backButton).toBeTruthy();
  });

  it('has Arabic Go Back button', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const backButton = screen.getByText(/رجوع/i);
    expect(backButton).toBeTruthy();
  });

  it('navigates to home when Go Home is clicked', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const homeButton = screen.getByText(/Go Home/i);
    fireEvent.click(homeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to explore when Explore is clicked', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const exploreButton = screen.getByText(/Explore/i);
    fireEvent.click(exploreButton);

    expect(mockNavigate).toHaveBeenCalledWith('/explore');
  });

  it('navigates back when Go Back is clicked', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const backButton = screen.getByText(/Go Back/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('has contact support link', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const supportLink = screen.getByText(/contact support/i);
    expect(supportLink).toBeTruthy();
  });

  it('has Arabic contact support link', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const supportLink = screen.getByText(/التواصل مع الدعم/i);
    expect(supportLink).toBeTruthy();
  });

  it('navigates to support when contact support is clicked', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const supportLink = screen.getByText(/contact support/i);
    fireEvent.click(supportLink);

    expect(mockNavigate).toHaveBeenCalledWith('/support');
  });

  it('has proper layout structure', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const container = document.querySelector('.min-h-screen');
    expect(container).toBeTruthy();
    expect(container?.className).toContain('flex');
    expect(container?.className).toContain('items-center');
    expect(container?.className).toContain('justify-center');
  });

  it('has centered content', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const content = document.querySelector('.text-center');
    expect(content).toBeTruthy();
  });

  it('has proper spacing', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const heading = screen.getByText('404');
    expect(heading.className).toContain('text-6xl');
    expect(heading.className).toContain('font-bold');
  });

  it('has help text section', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const helpText = screen.getByText(/If you believe this is a mistake/i);
    expect(helpText).toBeTruthy();
  });

  it('has Arabic help text section', () => {
    render(
      <AppProvider>
        <NotFoundPage />
      </AppProvider>
    );

    const helpText = screen.getByText(/إذا كنت تعتقد أن هذا خطأ/i);
    expect(helpText).toBeTruthy();
  });
});
