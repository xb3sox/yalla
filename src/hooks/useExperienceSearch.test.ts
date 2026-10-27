import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExperienceSearch } from './useExperienceSearch';
import { mockExperiences } from '../infrastructure/mock/mockData';

// Mock store state
const mockState = {
  experiences: mockExperiences,
  language: 'en' as const,
};

vi.mock('../data/store', () => ({
  useApp: () => ({
    state: mockState,
  }),
}));

describe('useExperienceSearch', () => {
  beforeEach(() => {
    mockState.language = 'en';
  });

  it('returns all published experiences by default', () => {
    const { result } = renderHook(() => useExperienceSearch());
    const publishedCount = mockExperiences.filter(e => e.planState === 'published').length;
    expect(result.current.filteredExperiences.length).toBe(publishedCount);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('filters experiences by text query', () => {
    const { result } = renderHook(() => useExperienceSearch());

    act(() => {
      result.current.updateFilter('query', 'coffee');
    });

    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.filteredExperiences.length).toBeGreaterThan(0);
    result.current.filteredExperiences.forEach(exp => {
      const match = exp.title.toLowerCase().includes('coffee') ||
                    exp.description.toLowerCase().includes('coffee') ||
                    exp.area.toLowerCase().includes('coffee');
      expect(match).toBe(true);
    });
  });

  it('filters experiences by area', () => {
    const { result } = renderHook(() => useExperienceSearch());

    act(() => {
      result.current.updateFilter('area', 'Diriyah');
    });

    expect(result.current.hasActiveFilters).toBe(true);
    result.current.filteredExperiences.forEach(exp => {
      expect(exp.area.toLowerCase()).toContain('diriyah');
    });
  });

  it('filters experiences by price range', () => {
    const { result } = renderHook(() => useExperienceSearch());

    act(() => {
      result.current.updateFilter('minPrice', 100);
      result.current.updateFilter('maxPrice', 200);
    });

    expect(result.current.hasActiveFilters).toBe(true);
    result.current.filteredExperiences.forEach(exp => {
      expect(exp.price).toBeGreaterThanOrEqual(100);
      expect(exp.price).toBeLessThanOrEqual(200);
    });
  });

  it('filters experiences by accessibility', () => {
    const { result } = renderHook(() => useExperienceSearch());

    act(() => {
      result.current.updateFilter('accessibility', true);
    });

    expect(result.current.hasActiveFilters).toBe(true);
    result.current.filteredExperiences.forEach(exp => {
      expect(exp.accessibility).toBeDefined();
    });
  });

  it('clears all filters when clearFilters is called', () => {
    const { result } = renderHook(() => useExperienceSearch());

    act(() => {
      result.current.updateFilter('query', 'Desert');
      result.current.updateFilter('accessibility', true);
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filters.query).toBe('');
    expect(result.current.filters.accessibility).toBeUndefined();
  });
});
