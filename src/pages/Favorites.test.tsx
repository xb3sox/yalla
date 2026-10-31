import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoritesPage } from './Favorites.tsx';
import { AppProvider, useApp } from '../data/store';
import { ToastProvider } from '../components/Toast';
import React, { useEffect } from 'react';

function FavoritesTestWrapper({
  favorites,
  onSelectExperience = vi.fn(),
  onExplore = vi.fn(),
}: {
  favorites?: string[];
  onSelectExperience?: (id: string) => void;
  onExplore?: () => void;
}) {
  return (
    <ToastProvider>
      <AppProvider>
        <FavoritesInnerStateLoader
          favorites={favorites}
          onSelectExperience={onSelectExperience}
          onExplore={onExplore}
        />
      </AppProvider>
    </ToastProvider>
  );
}

function FavoritesInnerStateLoader({
  favorites,
  onSelectExperience,
  onExplore,
}: {
  favorites?: string[];
  onSelectExperience: (id: string) => void;
  onExplore: () => void;
}) {
  const { dispatch } = useApp();

  useEffect(() => {
    if (favorites && favorites.length > 0) {
      favorites.forEach(id => {
        dispatch({ type: 'ADD_FAVORITE', payload: id });
      });
    }
  }, [dispatch, favorites]);

  return (
    <FavoritesPage
      onSelectExperience={onSelectExperience}
      onExplore={onExplore}
    />
  );
}

describe('FavoritesPage', () => {
  it('renders empty state when there are no favorites', () => {
    const onExplore = vi.fn();
    render(<FavoritesTestWrapper favorites={[]} onExplore={onExplore} />);

    expect(screen.getByText(/No favorites yet|لا توجد تجارب محفوظة بعد/i)).toBeInTheDocument();
    const exploreBtn = screen.getByRole('button', { name: /Explore experiences|استكشف التجارب/i });
    fireEvent.click(exploreBtn);
    expect(onExplore).toHaveBeenCalled();
  });

  it('renders favorited experiences efficiently and handles selection', async () => {
    const onSelect = vi.fn();
    render(<FavoritesTestWrapper favorites={['exp-1']} onSelectExperience={onSelect} />);

    const card = await screen.findByText(/Sunset Art Walk/i);
    expect(card).toBeInTheDocument();

    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith('exp-1');
  });
});
