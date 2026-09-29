import { useApp } from '../data/store';
import { t } from '../i18n';
import { getRecommendedExperiences, getRecommendationReasons } from '../application/useCases/recommendationUseCase';
import { ExperienceCard } from './DesignSystem';
import { Sparkles } from 'lucide-react';

interface RecommendationsProps {
  onSelectExperience: (id: string) => void;
  limit?: number;
}

export function Recommendations({ onSelectExperience, limit = 3 }: RecommendationsProps) {
  const { state } = useApp();
  const lang = state.language;

  if (!state.user) return null;

  const recommendations = getRecommendedExperiences(
    state.experiences,
    state.user,
    state.reservations,
    state.feedbacks,
    state.favorites,
    limit
  );

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-text-primary">
          {lang === 'ar' ? 'مقترحات لك' : 'Recommended for you'}
        </h2>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        {lang === 'ar' 
          ? 'تجارب قد تعجبك بناءً على تفضيلاتك'
          : 'Experiences you might like based on your preferences'}
      </p>
      <div className="space-y-4">
        {recommendations.map(rec => {
          const experience = state.experiences.find(e => e.id === rec.experienceId);
          if (!experience) return null;

          const reasons = getRecommendationReasons(rec, lang);

          return (
            <div key={rec.experienceId} className="relative">
              <ExperienceCard
                experience={experience}
                onPress={() => onSelectExperience(rec.experienceId)}
              />
              {reasons.length > 0 && (
                <div className="mt-2 px-4 py-2 bg-brand-50 rounded-lg border border-brand-100">
                  <p className="text-xs text-brand-700">
                    <span className="font-semibold">{lang === 'ar' ? 'لماذا:' : 'Why:'}</span>{' '}
                    {reasons.slice(0, 2).join(' • ')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
