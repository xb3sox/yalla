import { useApp } from '../data/store';
import { t } from '../i18n';
import { getPointsTier, getNextTierProgress } from '../application/useCases/rewardsUseCase';
import { ProgressBar } from './ProgressBar';
import { Award } from 'lucide-react';

export function RewardsWidget() {
  const { state } = useApp();
  const lang = state.language;

  if (!state.user) return null;

  // Mock lifetime points for demo (in real app, this would come from backend)
  const lifetimePoints = state.reservations.filter(r => 
    r.state === 'attended' || r.state === 'completed'
  ).length * 30 + state.feedbacks.length * 5;

  const tier = getPointsTier(lifetimePoints);
  const progress = getNextTierProgress(lifetimePoints);

  return (
    <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-xl p-5 border border-brand-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-text-primary">
              {lang === 'ar' ? 'نقاط المكافآت' : 'Reward Points'}
            </h3>
          </div>
          <p className="text-3xl font-bold text-brand-600 tabular-nums">
            {lifetimePoints}
          </p>
          <p className="text-xs text-text-secondary mt-1">
            {lang === 'ar' ? 'نقطة' : 'points'}
          </p>
        </div>
        <div className="text-end">
          <div className="text-2xl mb-1">{tier.icon}</div>
          <p className={`text-sm font-semibold ${tier.color}`}>
            {lang === 'ar' ? tier.tierAr : tier.tier}
          </p>
        </div>
      </div>

      {progress.nextTier !== 'Max' && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary">
              {lang === 'ar' ? `التقدم إلى ${progress.nextTier}` : `Progress to ${progress.nextTier}`}
            </span>
            <span className="text-xs font-medium text-text-primary tabular-nums">
              {progress.pointsToNextTier} {lang === 'ar' ? 'نقطة متبقية' : 'points to go'}
            </span>
          </div>
          <ProgressBar
            progress={progress.progress}
            color="brand"
            size="sm"
          />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-brand-200">
        <p className="text-xs text-text-secondary mb-2">
          {lang === 'ar'
            ? 'كيف تكسب النقاط:'
            : 'How to earn points:'}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-brand-600">10</p>
            <p className="text-[10px] text-text-tertiary">{lang === 'ar' ? 'حجز' : 'Booking'}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-brand-600">20</p>
            <p className="text-[10px] text-text-tertiary">{lang === 'ar' ? 'حضور' : 'Attend'}</p>
          </div>
          <div>
            <p className="text-lg font-bold text-brand-600">5</p>
            <p className="text-[10px] text-text-tertiary">{lang === 'ar' ? 'تقييم' : 'Review'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
