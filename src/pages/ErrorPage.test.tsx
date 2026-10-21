import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorPage } from './ErrorPage';
import { AppProvider } from '../data/store';

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error message in English', () => {
    render(
      <AppProvider>
        <ErrorPage />
      </AppProvider>
    );

    expect(screen.getByText(/Something Went Wrong/i)).toBeTruthy();
    expect(screen.getByText(/We're sorry, an unexpected error occurred/i)).toBeTruthy();
  });

  it('renders try again button and handles click', () => {
    render(
      <AppProvider>
        <ErrorPage />
      </AppProvider>
    );

    const refreshButton = screen.getByRole('button', { name: /Try Again/i });
    expect(refreshButton).toBeTruthy();
    fireEvent.click(refreshButton);
  });
});
