import { useApp } from '../data/store';
import { t } from '../i18n';
import { ExperienceCard, EmptyState, Button } from '../components/DesignSystem';

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
          icon={
            <img
              src="https://image.qwenlm.ai/generated-images/27a5e16f-a66f-4bb8-89c3-f7823cc38f8e/_result.png"
              alt=""
              className="w-32 h-32 object-contain opacity-80"
              aria-hidden="true"
            />
          }
          title={t('explore.empty', lang)}
          description={lang === 'ar' ? 'جرب تغيير تفضيلاتك للعثور على تجارب.' : 'Try adjusting your preferences to find experiences.'}
          action={
            <Button variant="secondary" size="sm">
              {t('explore.emptyAction', lang)}
            </Button>
          }
        />
      )}
    </div>
  );
}
