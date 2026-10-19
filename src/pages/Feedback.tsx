import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { t } from '../i18n';
import { Button, Textarea } from '../components/DesignSystem';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface FeedbackPageProps {
  reservationId: string;
  onBack: () => void;
  onBookAnother: () => void;
}

export function FeedbackPage({ reservationId, onBack, onBookAnother }: FeedbackPageProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const reservation = state.reservations.find(r => r.id === reservationId);
  const experience = reservation ? state.experiences.find(e => e.id === reservation.planId) : null;

  const [worthTime, setWorthTime] = useState(0);
  const [descriptionAccurate, setDescriptionAccurate] = useState<boolean | null>(null);
  const [comfortableOrganized, setComfortableOrganized] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    async function loadFeedbackHistory() {
      if (!experience?.id) return;
      setIsLoadingHistory(true);
      try {
        const res = await api.feedbacks.getByExperience(experience.id);
        if (res.success && res.data) {
          dispatch({
            type: 'SET_FEEDBACKS',
            payload: Array.isArray(res.data) ? res.data : [res.data] as any,
          });

          // Check if user already submitted feedback for this reservation
          const hasExisting = (Array.isArray(res.data) ? res.data : [res.data] as any).some(
            (f: any) => f.reservationId === reservationId
          );
          if (hasExisting) {
            setSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Failed to load feedback history', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadFeedbackHistory();
  }, [experience?.id, reservationId, dispatch]);

  if (!experience) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">{t('common.error', lang)}</p>
      </div>
    );
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = worthTime > 0 && descriptionAccurate !== null && comfortableOrganized !== null && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !state.user) return;
    
    // Check if feedback already exists for this reservation
    const hasExistingFeedback = state.feedbacks.some(
      f => f.reservationId === reservationId
    );
    
    if (hasExistingFeedback) {
      showToast('error', lang === 'ar' ? 'لقد أرسلت ملاحظاتك بالفعل' : 'You have already submitted feedback');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await api.feedbacks.create({
        reservationId,
        planId: experience.id,
        worthTime,
        descriptionAccurate,
        comfortableOrganized,
        comment: comment || undefined,
      });

      if (response.success && response.data) {
        dispatch({
          type: 'ADD_FEEDBACK',
          payload: response.data as any,
        });
        showToast('success', lang === 'ar' ? 'شكراً لملاحظاتك!' : 'Thank you for your feedback!');
        setSubmitted(true);
      } else {
        throw new Error(response.error?.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      showToast('error', error.message || (lang === 'ar' ? 'حدث خطأ أثناء إرسال الملاحظات' : 'Error submitting feedback'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted || isLoadingHistory) {
    if (isLoadingHistory) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-40 h-40 mb-4 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 160 160" className="w-full h-full">
            <defs>
              <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="70" fill="url(#successGrad)" opacity="0.1" />
            <circle cx="80" cy="80" r="50" fill="url(#successGrad)" opacity="0.2" />
            <circle cx="80" cy="80" r="35" fill="url(#successGrad)" />
            <path d="M 60 80 L 75 95 L 100 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">{t('feedback.thankYou', lang)}</h2>
        <p className="text-sm text-text-secondary mb-8 max-w-xs">
          {lang === 'ar' ? 'ملاحظاتك خاصة ولن تُشارك مع الآخرين.' : 'Your feedback is private and will not be shared with other participants.'}
        </p>
        <Button variant="primary" size="lg" onClick={onBookAnother}>
          {t('feedback.bookAnother', lang)}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="px-5 pt-5 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 flip-rtl" />
          <span className="text-sm">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-xl font-bold text-text-primary">{t('feedback.title', lang)}</h1>
        <p className="text-sm text-text-secondary mt-1">{lang === 'ar' ? experience.titleAr : experience.title}</p>
      </div>

      <div className="px-5 pb-28 space-y-5">
        {/* Rating */}
        <div className="bg-surface-raised rounded-xl border border-border p-5">
          <p className="text-sm font-medium text-text-primary mb-4">{t('feedback.worthTime', lang)}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => setWorthTime(val)}
                className={`flex-1 h-12 rounded-xl border-2 flex items-center justify-center text-base font-semibold transition-all ${
                  worthTime >= val
                    ? 'bg-brand-50 border-brand-500 text-brand-700'
                    : 'border-border text-text-tertiary hover:border-border-strong'
                }`}
                aria-label={`${val}/5`}
                aria-pressed={worthTime >= val}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Yes/No questions */}
        <YesNoQuestion
          label={t('feedback.descriptionAccurate', lang)}
          value={descriptionAccurate}
          onChange={setDescriptionAccurate}
          lang={lang}
        />
        <YesNoQuestion
          label={t('feedback.comfortableOrganized', lang)}
          value={comfortableOrganized}
          onChange={setComfortableOrganized}
          lang={lang}
        />

        {/* Comment */}
        <Textarea
          label={t('feedback.optionalComment', lang)}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={lang === 'ar' ? 'اختياري...' : 'Optional...'}
        />

        {/* Submit */}
        <div className="pt-2">
          <Button variant="primary" size="lg" className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</span>
              </div>
            ) : (
              t('feedback.submit', lang)
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function YesNoQuestion({ label, value, onChange, lang }: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  lang: 'en' | 'ar';
}) {
  return (
    <div className="bg-surface-raised rounded-xl border border-border p-5">
      <p className="text-sm font-medium text-text-primary mb-4">{label}</p>
      <div className="flex gap-3">
        <button
          onClick={() => onChange(true)}
          className={`flex-1 h-12 rounded-xl border-2 text-sm font-medium transition-all ${
            value === true ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-border text-text-secondary hover:border-border-strong'
          }`}
          aria-pressed={value === true}
        >
          {t('common.yes', lang)}
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 h-12 rounded-xl border-2 text-sm font-medium transition-all ${
            value === false ? 'bg-accent-50 border-accent-500 text-accent-600' : 'border-border text-text-secondary hover:border-border-strong'
          }`}
          aria-pressed={value === false}
        >
          {t('common.no', lang)}
        </button>
      </div>
    </div>
  );
}
