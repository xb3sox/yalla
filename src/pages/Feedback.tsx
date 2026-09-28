import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Textarea } from '../components/DesignSystem';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface FeedbackPageProps {
  reservationId: string;
  onBack: () => void;
  onBookAnother: () => void;
}

export function FeedbackPage({ reservationId, onBack, onBookAnother }: FeedbackPageProps) {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const reservation = state.reservations.find(r => r.id === reservationId);
  const experience = reservation ? state.experiences.find(e => e.id === reservation.planId) : null;

  const [worthTime, setWorthTime] = useState(0);
  const [descriptionAccurate, setDescriptionAccurate] = useState<boolean | null>(null);
  const [comfortableOrganized, setComfortableOrganized] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!experience) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">{t('common.error', lang)}</p>
      </div>
    );
  }

  const canSubmit = worthTime > 0 && descriptionAccurate !== null && comfortableOrganized !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    dispatch({
      type: 'ADD_FEEDBACK',
      payload: {
        id: `fb-${Date.now()}`,
        reservationId,
        participantId: 'user-1',
        planId: experience.id,
        worthTime,
        descriptionAccurate,
        comfortableOrganized,
        comment: comment || undefined,
        createdAt: new Date().toISOString(),
      },
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mb-5">
          <CheckCircle className="w-8 h-8 text-success" />
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
            {t('feedback.submit', lang)}
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
  lang: string;
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
          {t('common.yes', lang as 'en' | 'ar')}
        </button>
        <button
          onClick={() => onChange(false)}
          className={`flex-1 h-12 rounded-xl border-2 text-sm font-medium transition-all ${
            value === false ? 'bg-accent-50 border-accent-500 text-accent-600' : 'border-border text-text-secondary hover:border-border-strong'
          }`}
          aria-pressed={value === false}
        >
          {t('common.no', lang as 'en' | 'ar')}
        </button>
      </div>
    </div>
  );
}
