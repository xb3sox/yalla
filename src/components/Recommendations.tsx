import { useMemo, useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { getRecommendedExperiences, getRecommendationReasons, RecommendationScore } from '../application/useCases/recommendationUseCase';
import { ExperienceCard } from './DesignSystem';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface RecommendationsProps {
  onSelectExperience: (id: string) => void;
  limit?: number;
}

export function Recommendations({ onSelectExperience, limit = 3 }: RecommendationsProps) {
  const { state } = useApp();
  const lang = state.language;

  const [serverRecommendations, setServerRecommendations] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!state.user) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchRecommendations = async () => {
      try {
        const response = await api.experiences.getRecommendations<any>({ limit });
        if (response.success && response.data && Array.isArray(response.data.experiences)) {
          if (isMounted) {
            setServerRecommendations(response.data.experiences);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setServerRecommendations(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        if (isMounted) {
          setServerRecommendations(null);
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [state.user, limit]);

  // Fallback to local computation if server fetch fails or returns empty/null
  const localRecommendations = useMemo(() => {
    if (!state.user) return [];
    return getRecommendedExperiences(
      state.experiences,
      state.user,
      state.reservations,
      state.feedbacks,
      state.favorites,
      limit
    );
  }, [state.experiences, state.user, state.reservations, state.feedbacks, state.favorites, limit]);

  if (!state.user) return null;

  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="h-6 bg-surface-raised rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-surface-raised rounded w-2/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-32 bg-surface-raised rounded-xl"></div>
          <div className="h-32 bg-surface-raised rounded-xl"></div>
        </div>
      </div>
    );
  }

  const hasServerRecs = serverRecommendations && serverRecommendations.length > 0;
  const hasLocalRecs = localRecommendations && localRecommendations.length > 0;

  if (!hasServerRecs && !hasLocalRecs) return null;

  const displayRecommendations = hasServerRecs
    ? serverRecommendations
    : localRecommendations;


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
        {displayRecommendations.map((rec: any) => {
          let experience;
          let reasons: string[] = [];

          if (hasServerRecs) {
            experience = rec; // Server returns full experience objects
            const rawReasons: string[] = Array.isArray(rec.reasons) ? rec.reasons : [];
            if (lang === 'ar') {
              const translations: Record<string, string> = {
                'Matches your preferred area': 'يتطابق مع منطقتك المفضلة',
                'In your preferred language': 'بلغتك المفضلة',
                'Within your budget range': 'ضمن نطاق ميزانيتك',
                'Based on your positive experiences': 'بناءً على تجاربك الإيجابية',
                'Limited spots available': 'أماكن محدودة متاحة',
                'Good availability': 'توفر جيد',
                'New experience to discover': 'تجربة جديدة للاكتشاف',
                'Matches accessibility needs': 'يناسب احتياجات إمكانية الوصول',
              };
              reasons = rawReasons.map((r: string) => translations[r] || r);
            } else {
              reasons = rawReasons;
            }
          } else {
            experience = state.experiences.find(e => e.id === rec.experienceId);
            reasons = getRecommendationReasons(rec as RecommendationScore, lang);
          }

          if (!experience) return null;

          return (
            <div key={experience.id} className="relative">
              <ExperienceCard
                experience={experience}
                onPress={() => onSelectExperience(experience.id)}
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
