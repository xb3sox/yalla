import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { NotFoundPage } from './NotFound';
import { renderWithProviders } from '../test/utils';
import { useApp } from '../data/store';

// Mirrors App.tsx view switching: renders NotFoundPage only while the store's
// currentView is 'notfound', so SET_VIEW dispatches visibly swap the UI.
function Shell() {
  const { state } = useApp();
  if (state.currentView !== 'notfound') return <div>navigated-away</div>;
  return <NotFoundPage />;
}

describe('NotFoundPage', () => {
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

  it('switches to dashboard view when Go Home is clicked', () => {
    renderWithProviders(<Shell />, { view: 'notfound' });

    fireEvent.click(screen.getByText(/Go Home/i));

    expect(screen.queryByText('404')).toBeNull();
    expect(screen.getByText('navigated-away')).toBeTruthy();
  });

  it('switches to explore view when Explore is clicked', () => {
    renderWithProviders(<Shell />, { view: 'notfound' });

    fireEvent.click(screen.getByRole('button', { name: /Explore/i }));

    expect(screen.queryByText('404')).toBeNull();
    expect(screen.getByText('navigated-away')).toBeTruthy();
  });

  it('switches away from 404 when Go Back is clicked', () => {
    renderWithProviders(<Shell />, { view: 'notfound' });

    fireEvent.click(screen.getByText(/Go Back/i));

    expect(screen.queryByText('404')).toBeNull();
    expect(screen.getByText('navigated-away')).toBeTruthy();
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

  it('switches to support view when contact support is clicked', () => {
    renderWithProviders(<Shell />, { view: 'notfound' });

    fireEvent.click(screen.getByText(/contact support/i));

    expect(screen.queryByText('404')).toBeNull();
    expect(screen.getByText('navigated-away')).toBeTruthy();
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
