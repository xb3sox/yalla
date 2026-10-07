import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorPage } from './ErrorPage';
import { AppProvider } from '../data/store';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

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
});
