import { useMemo } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { ExperienceCard, EmptyState, Button } from '../components/DesignSystem';
import { Heart } from 'lucide-react';

interface FavoritesPageProps {
  onSelectExperience: (id: string) => void;
  onExplore: () => void;
}

export function FavoritesPage({ onSelectExperience, onExplore }: FavoritesPageProps) {
  const { state } = useApp();
  const lang = state.language;
  
  // Performance optimization: Precompute favorite IDs into a Set for O(1) membership lookups
  // and memoize the filtered list, reducing filtering time complexity from O(N * M) to O(N + M)
  // and skipping redundant array iterations across re-renders.
  const favoriteExperiences = useMemo(() => {
    const favoriteSet = new Set(state.favorites);
    return state.experiences.filter(exp => favoriteSet.has(exp.id));
  }, [state.experiences, state.favorites]);

  return (
    <div className="px-5 pt-4 pb-28">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-6 h-6 text-accent-500 fill-accent-500" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {lang === 'ar' ? 'المفضلة' : 'Favorites'}
          </h1>
        </div>
        <p className="text-sm text-text-secondary">
          {favoriteExperiences.length > 0
            ? (lang === 'ar' 
                ? `${favoriteExperiences.length} ${favoriteExperiences.length === 1 ? 'تجربة محفوظة' : 'تجارب محفوظة'}`
                : `${favoriteExperiences.length} saved ${favoriteExperiences.length === 1 ? 'experience' : 'experiences'}`)
            : (lang === 'ar' 
                ? 'احفظ التجارب التي تعجبك للوصول إليها لاحقاً'
                : 'Save experiences you like to access them later')}
        </p>
      </div>

      {/* Favorites list */}
      {favoriteExperiences.length > 0 ? (
        <div className="space-y-4">
          {favoriteExperiences.map(exp => (
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
            <div className="w-24 h-24 rounded-full bg-accent-50 flex items-center justify-center">
              <Heart className="w-12 h-12 text-accent-300" />
            </div>
          }
          title={lang === 'ar' ? 'لا توجد تجارب محفوظة بعد' : 'No favorites yet'}
          description={lang === 'ar' 
            ? 'ابدأ بحفظ التجارب التي تعجبك بالضغط على أيقونة القلب في أي تجربة'
            : 'Start saving experiences you like by tapping the heart icon on any experience'}
          action={
            <Button variant="primary" size="md" onClick={onExplore}>
              {lang === 'ar' ? 'استكشف التجارب' : 'Explore experiences'}
            </Button>
          }
        />
      )}
    </div>
  );
}
