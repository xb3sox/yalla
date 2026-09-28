import { useApp } from '../data/store';
import { t } from '../i18n';
import { ExperienceCard, EmptyState, Button } from '../components/DesignSystem';
import { Compass, RefreshCw } from 'lucide-react';

interface ExplorePageProps {
  onSelectExperience: (id: string) => void;
}

export function ExplorePage({ onSelectExperience }: ExplorePageProps) {
  const { state } = useApp();
  const lang = state.language;
  const publishedExperiences = state.experiences.filter(e => e.planState === 'published');

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-charcoal-900 mb-1">{t('explore.title', lang)}</h1>
        <p className="text-charcoal-500">{t('explore.subtitle', lang)}</p>
      </div>

      {/* Experience List */}
      <div className="px-5 pb-8">
        {publishedExperiences.length > 0 ? (
          <div className="space-y-5">
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
            icon={<Compass className="w-12 h-12" />}
            title={t('explore.empty', lang)}
            action={
              <Button variant="secondary" size="sm">
                {t('explore.emptyAction', lang)}
              </Button>
            }
          />
        )}
      </div>

      {/* Stale data notice */}
      <div className="px-5 pb-8">
        <button className="flex items-center gap-2 text-xs text-charcoal-400 hover:text-charcoal-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          {t('explore.refreshStale', lang)}
        </button>
      </div>
    </div>
  );
}
