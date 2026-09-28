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
    return publishedExperiences.filter(exp => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const title = lang === 'ar' ? exp.titleAr : exp.title;
        const description = lang === 'ar' ? exp.descriptionAr : exp.description;
        const area = lang === 'ar' ? exp.areaAr : exp.area;
        
        const matchesQuery = 
          title.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          area.toLowerCase().includes(query);
        
        if (!matchesQuery) return false;
      }

      // Area filter
      if (filters.area) {
        const expArea = lang === 'ar' ? exp.areaAr : exp.area;
        if (!expArea.toLowerCase().includes(filters.area.toLowerCase())) {
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
      if (filters.accessibility) {
        const accessibilityText = lang === 'ar' ? exp.accessibilityAr : exp.accessibility;
        if (!accessibilityText || accessibilityText.length < 10) {
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
