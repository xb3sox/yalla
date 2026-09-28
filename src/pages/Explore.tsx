import { useApp } from '../data/store';
import { t } from '../i18n';
import { ExperienceCard, EmptyState } from '../components/DesignSystem';
import { Compass } from 'lucide-react';

interface ExplorePageProps {
  onSelectExperience: (id: string) => void;
}

export function ExplorePage({ onSelectExperience }: ExplorePageProps) {
  const { state } = useApp();
  const lang = state.language;
  const publishedExperiences = state.experiences.filter(e => e.planState === 'published');

  return (
    <div className="px-5 pt-4 pb-28">
      {/* Page header — minimal */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('explore.title', lang)}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('explore.subtitle', lang)}</p>
      </div>

      {/* Experience list */}
      {publishedExperiences.length > 0 ? (
        <div className="space-y-4">
          {publishedExperiences.map(exp => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              onPress={() => onSelectExperience(exp.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Compass className="w-10 h-10" />}
          title={t('explore.empty', lang)}
          description={lang === 'ar' ? 'جرب تغيير تفضيلاتك للعثور على تجارب.' : 'Try adjusting your preferences to find experiences.'}
        />
      )}
    </div>
  );
}
