import { useState, useMemo } from 'react';
import { useApp } from '../data/store';
import type { Experience } from '../types';

interface SearchFilters {
  query: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  language?: 'en' | 'ar';
  physicalDemand?: 'low' | 'moderate' | 'high';
  accessibility?: boolean;
}

export function useExperienceSearch(initialFilters: Partial<SearchFilters> = {}) {
  const { state } = useApp();
  const lang = state.language;

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    area: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    language: undefined,
    physicalDemand: undefined,
    accessibility: undefined,
    ...initialFilters,
  });

  const publishedExperiences = useMemo(() => 
    state.experiences.filter(e => e.planState === 'published'),
    [state.experiences]
  );

  const filteredExperiences = useMemo(() => {
    // Optimization: Precompute invariant search query, area filter, and keyword arrays once
    // outside the iteration loop instead of recomputing & re-allocating O(N) times inside .filter().
    const searchQuery = filters.query ? filters.query.trim().toLowerCase() : '';
    const areaQuery = filters.area ? filters.area.trim().toLowerCase() : '';
    const accessibilityKeywords = filters.accessibility
      ? (lang === 'ar'
          ? ['متاح', 'كراسي متحركة', 'وصول', 'بدون درجات', 'مناسب']
          : ['accessible', 'wheelchair', 'access', 'step-free', 'suitable'])
      : null;

    return publishedExperiences.filter(exp => {
      // Text search
      if (searchQuery) {
        const title = (lang === 'ar' ? exp.titleAr : exp.title).toLowerCase();
        const description = (lang === 'ar' ? exp.descriptionAr : exp.description).toLowerCase();
        const area = (lang === 'ar' ? exp.areaAr : exp.area).toLowerCase();
        
        const matchesQuery = 
          title.includes(searchQuery) ||
          description.includes(searchQuery) ||
          area.includes(searchQuery);
        
        if (!matchesQuery) return false;
      }

      // Area filter
      if (areaQuery) {
        const expArea = (lang === 'ar' ? exp.areaAr : exp.area).toLowerCase();
        if (!expArea.includes(areaQuery)) {
          return false;
        }
      }

      // Price range
      if (filters.minPrice !== undefined && exp.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && exp.price > filters.maxPrice) {
        return false;
      }

      // Language
      if (filters.language && exp.language !== filters.language) {
        return false;
      }

      // Physical demand
      if (filters.physicalDemand && exp.physicalDemand !== filters.physicalDemand) {
        return false;
      }

      // Accessibility
      if (accessibilityKeywords) {
        const accessibilityText = lang === 'ar' ? exp.accessibilityAr : exp.accessibility;
        
        if (!accessibilityText) {
          return false;
        }
        
        const lowerAccessibility = accessibilityText.toLowerCase();
        const hasAccessibility = accessibilityKeywords.some(keyword =>
          lowerAccessibility.includes(keyword)
        );
        
        if (!hasAccessibility) {
          return false;
        }
      }

      return true;
    });
  }, [publishedExperiences, filters, lang]);

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      area: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      language: undefined,
      physicalDemand: undefined,
      accessibility: undefined,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'query') return value !== '';
      return value !== undefined;
    });
  }, [filters]);

  return {
    filters,
    filteredExperiences,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    totalResults: filteredExperiences.length,
  };
}
