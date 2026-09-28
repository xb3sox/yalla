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
  
  const favoriteExperiences = state.experiences.filter(exp => 
    state.favorites.includes(exp.id)
  );

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
          icon={<Heart className="w-16 h-16" />}
          title={lang === 'ar' ? 'لا توجد تجارب محفوظة' : 'No favorites yet'}
          description={lang === 'ar' 
            ? 'ابدأ بحفظ التجارب التي تعجبك بالضغط على أيقونة القلب'
            : 'Start saving experiences you like by tapping the heart icon'}
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
