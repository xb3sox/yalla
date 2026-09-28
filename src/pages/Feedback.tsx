import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, Input, Textarea } from '../components/DesignSystem';
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

  const [worthTime, setWorthTime] = useState<number>(0);
  const [descriptionAccurate, setDescriptionAccurate] = useState<boolean | null>(null);
  const [comfortableOrganized, setComfortableOrganized] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!experience) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="text-charcoal-500">{t('common.error', lang)}</p>
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
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-charcoal-900 mb-2">{t('feedback.thankYou', lang)}</h2>
        <p className="text-sm text-charcoal-500 mb-8">
          {lang === 'ar' ? 'ملاحظاتك خاصة ولن تُشارك مع المشاركين الآخرين.' : 'Your feedback is private and will not be shared with other participants.'}
        </p>
        <Button variant="primary" size="lg" onClick={onBookAnother}>
          {t('feedback.bookAnother', lang)}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory">
      <div className="px-5 pt-6 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-700 mb-4">
          <ArrowLeft className="w-5 h-5 flip-rtl" />
          <span className="text-sm">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-xl font-bold text-charcoal-900">{t('feedback.title', lang)}</h1>
        <p className="text-sm text-charcoal-500 mt-1">{lang === 'ar' ? experience.titleAr : experience.title}</p>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {/* Worth Time */}
        <div className="bg-white rounded-xl border border-sand-200 p-4">
          <p className="text-sm font-medium text-charcoal-700 mb-3">{t('feedback.worthTime', lang)}</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => setWorthTime(val)}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-semibold transition-all ${
                  worthTime >= val ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-sand-200 text-charcoal-300 hover:border-sand-300'
                }`}
                aria-label={`${val}/5`}
                aria-pressed={worthTime >= val}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Description Accurate */}
        <div className="bg-white rounded-xl border border-sand-200 p-4">
          <p className="text-sm font-medium text-charcoal-700 mb-3">{t('feedback.descriptionAccurate', lang)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDescriptionAccurate(true)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                descriptionAccurate === true ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-sand-200 text-charcoal-500 hover:border-sand-300'
              }`}
              aria-pressed={descriptionAccurate === true}
            >
              {t('common.yes', lang)}
            </button>
            <button
              onClick={() => setDescriptionAccurate(false)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                descriptionAccurate === false ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700' : 'border-sand-200 text-charcoal-500 hover:border-sand-300'
              }`}
              aria-pressed={descriptionAccurate === false}
            >
              {t('common.no', lang)}
            </button>
          </div>
        </div>

        {/* Comfortable & Organized */}
        <div className="bg-white rounded-xl border border-sand-200 p-4">
          <p className="text-sm font-medium text-charcoal-700 mb-3">{t('feedback.comfortableOrganized', lang)}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setComfortableOrganized(true)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                comfortableOrganized === true ? 'bg-teal-50 border-teal-500 text-teal-700' : 'border-sand-200 text-charcoal-500 hover:border-sand-300'
              }`}
              aria-pressed={comfortableOrganized === true}
            >
              {t('common.yes', lang)}
            </button>
            <button
              onClick={() => setComfortableOrganized(false)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                comfortableOrganized === false ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700' : 'border-sand-200 text-charcoal-500 hover:border-sand-300'
              }`}
              aria-pressed={comfortableOrganized === false}
            >
              {t('common.no', lang)}
            </button>
          </div>
        </div>

        {/* Optional Comment */}
        <Textarea
          label={t('feedback.optionalComment', lang)}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب تعليقك هنا...' : 'Write your comment here...'}
        />

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {t('feedback.submit', lang)}
        </Button>
      </div>
    </div>
  );
}
