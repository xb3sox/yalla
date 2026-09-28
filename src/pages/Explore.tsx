import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { useExperienceSearch } from '../hooks/useExperienceSearch';
import { t } from '../i18n';
import { ExperienceCard, EmptyState, Button, Input } from '../components/DesignSystem';
import { FilterChips } from '../components/FilterChip';
import { ExplorePageSkeleton } from '../components/LoadingSkeleton';
import { Search, X } from 'lucide-react';

interface ExplorePageProps {
  onSelectExperience: (id: string) => void;
}

export function ExplorePage({ onSelectExperience }: ExplorePageProps) {
  const { state } = useApp();
  const lang = state.language;
  const [isLoading, setIsLoading] = useState(true);
  const { filters, filteredExperiences, updateFilter, clearFilters, hasActiveFilters, totalResults } = useExperienceSearch();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ExplorePageSkeleton />;
  }

  return (
    <div className="px-5 pt-4 pb-28">
      {/* Page header — minimal */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('explore.title', lang)}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('explore.subtitle', lang)}</p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن التجارب...' : 'Search experiences...'}
            className="w-full ps-12 pe-10 py-3 rounded-xl bg-surface-raised border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 min-h-[48px]"
            aria-label={lang === 'ar' ? 'البحث' : 'Search'}
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="absolute end-4 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-sunken rounded-lg transition-colors"
              aria-label={lang === 'ar' ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-text-secondary">
              {lang === 'ar' 
                ? `${totalResults} ${totalResults === 1 ? 'نتيجة' : 'نتائج'}`
                : `${totalResults} ${totalResults === 1 ? 'result' : 'results'}`}
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              {lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="mb-6">
        <FilterChips
          filters={[
            { id: 'weekend', label: lang === 'ar' ? 'عطلة نهاية الأسبوع' : 'Weekend', active: false },
            { id: 'evening', label: lang === 'ar' ? 'مسائي' : 'Evening', active: false },
            { id: 'outdoor', label: lang === 'ar' ? 'خارجي' : 'Outdoor', active: false },
            { id: 'indoor', label: lang === 'ar' ? 'داخلي' : 'Indoor', active: false },
            { id: 'accessible', label: lang === 'ar' ? 'متاح' : 'Accessible', active: filters.accessibility || false },
          ]}
          onToggle={(id) => {
            if (id === 'accessible') {
              updateFilter('accessibility', !filters.accessibility);
            }
            // Other filters would be implemented with backend support
          }}
          onClearAll={clearFilters}
        />
      </div>

      {/* Experience list */}
      {filteredExperiences.length > 0 ? (
        <div className="space-y-4">
          {filteredExperiences.map((exp: any) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              onPress={() => onSelectExperience(exp.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={
            <img
              src="https://image.qwenlm.ai/generated-images/27a5e16f-a66f-4bb8-89c3-f7823cc38f8e/_result.png"
              alt=""
              className="w-32 h-32 object-contain opacity-80"
              aria-hidden="true"
            />
          }
          title={hasActiveFilters 
            ? (lang === 'ar' ? 'لا توجد نتائج' : 'No results found')
            : t('explore.empty', lang)
          }
          description={hasActiveFilters
            ? (lang === 'ar' ? 'جرب تغيير معايير البحث' : 'Try adjusting your search criteria')
            : (lang === 'ar' ? 'جرب تغيير تفضيلاتك للعثور على تجارب.' : 'Try adjusting your preferences to find experiences.')
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                {lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
              </Button>
            ) : (
              <Button variant="secondary" size="sm">
                {t('explore.emptyAction', lang)}
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
