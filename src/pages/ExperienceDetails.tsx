import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, PriceSummary, Timeline, Dialog, SyntheticPaymentLabel } from '../components/DesignSystem';
import { ArrowLeft, Clock, MapPin, Users, Globe, Shield, CheckCircle, ChevronDown } from 'lucide-react';

interface ExperienceDetailsPageProps {
  experienceId: string;
  onBack: () => void;
  onBookSuccess: () => void;
}

export function ExperienceDetailsPage({ experienceId, onBack, onBookSuccess }: ExperienceDetailsPageProps) {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const experience = state.experiences.find(e => e.id === experienceId);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingState, setBookingState] = useState<'idle' | 'processing' | 'success' | 'waitlisted'>('idle');
  const [showAllDetails, setShowAllDetails] = useState(false);

  if (!experience) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-text-secondary">{t('common.error', lang)}</p>
      </div>
    );
  }

  const spotsLeft = experience.capacity - experience.booked;
  const isFull = spotsLeft <= 0;

  const handleBook = () => {
    setBookingState('processing');
    setTimeout(() => {
      const newReservation = {
        id: `res-${Date.now()}`,
        participantId: 'user-1',
        planId: experience.id,
        state: isFull ? 'waitlisted' as const : 'confirmed' as const,
        createdAt: new Date().toISOString(),
        confirmedAt: isFull ? undefined : new Date().toISOString(),
        paymentState: 'captured' as const,
        paymentId: `pay-synth-${Date.now()}`,
        idempotencyKey: `idem-${Date.now()}`,
      };
      dispatch({ type: 'ADD_RESERVATION', payload: newReservation });
      setBookingState(isFull ? 'waitlisted' : 'success');
    }, 1200);
  };

  // Refined gradient
  const palettes = [
    { from: '#14736A', to: '#0B3A35' },
    { from: '#8B6914', to: '#4A3808' },
    { from: '#4A5568', to: '#1A202C' },
  ];
  const idx = parseInt(experience.id.replace('exp-', '')) % 3;
  const palette = palettes[idx];

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero — immersive but clean */}
      <div
        className="relative h-64 flex flex-col justify-end p-5"
        style={{ background: `linear-gradient(160deg, ${palette.from}, ${palette.to})` }}
      >
        <button
          onClick={onBack}
          className="absolute top-4 start-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors"
          aria-label={t('common.back', lang)}
        >
          <ArrowLeft className="w-5 h-5 flip-rtl" />
        </button>
        <h1 className="text-2xl font-bold text-white leading-tight drop-shadow-sm">
          {lang === 'ar' ? experience.titleAr : experience.title}
        </h1>
        <p className="text-white/80 text-sm mt-1.5">
          {experience.date} · {experience.time} · {experience.duration}
        </p>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Key info grid — compact */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow icon={<MapPin className="w-4 h-4" />} label={t('details.area', lang)} value={lang === 'ar' ? experience.areaAr : experience.area} />
          <InfoRow icon={<Users className="w-4 h-4" />} label={t('details.groupSizeRange', lang)} value={`${experience.groupSizeMin}–${experience.groupSizeMax}`} />
          <InfoRow icon={<Globe className="w-4 h-4" />} label={t('details.language', lang)} value={experience.language === 'ar' ? (lang === 'ar' ? 'العربية' : 'Arabic') : (lang === 'ar' ? 'الإنجليزية' : 'English')} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label={t('details.physicalDemand', lang)} value={
            experience.physicalDemand === 'low' ? t('details.physicalLow', lang).split('—')[0].trim() :
            experience.physicalDemand === 'moderate' ? t('details.physicalModerate', lang).split('—')[0].trim() :
            t('details.physicalHigh', lang).split('—')[0].trim()
          } />
        </div>

        {/* Description */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-2">{t('details.whatYoullDo', lang)}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {lang === 'ar' ? experience.descriptionAr : experience.description}
          </p>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">{t('details.timeline', lang)}</h2>
          <Timeline items={experience.timeline} />
        </section>

        {/* Progressive disclosure — show more */}
        <button
          onClick={() => setShowAllDetails(!showAllDetails)}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          aria-expanded={showAllDetails}
        >
          {showAllDetails ? (lang === 'ar' ? 'عرض أقل' : 'Show less') : (lang === 'ar' ? 'عرض المزيد من التفاصيل' : 'Show more details')}
          <ChevronDown className={`w-4 h-4 transition-transform ${showAllDetails ? 'rotate-180' : ''}`} />
        </button>

        {showAllDetails && (
          <div className="space-y-5 slide-up">
            {/* Accessibility */}
            <DetailSection title={t('details.accessibility', lang)}>
              <p className="text-sm text-text-secondary">{lang === 'ar' ? experience.accessibilityAr : experience.accessibility}</p>
            </DetailSection>

            {/* Environment */}
            <DetailSection title={t('details.environment', lang)}>
              <p className="text-sm text-text-secondary">{lang === 'ar' ? experience.environmentAr : experience.environment}</p>
              <p className="text-sm text-text-secondary mt-1.5">
                {t('details.noiseLevel', lang)}: {
                  experience.noiseLevel === 'quiet' ? t('details.noiseQuiet', lang) :
                  experience.noiseLevel === 'moderate' ? t('details.noiseModerate', lang) :
                  t('details.noiseLoud', lang)
                }
              </p>
            </DetailSection>

            {/* Host */}
            <DetailSection title={t('details.hostRole', lang)}>
              <p className="text-sm text-text-secondary">{lang === 'ar' ? experience.hostRoleAr : experience.hostRole}</p>
            </DetailSection>

            {/* Requirements */}
            <DetailSection title={t('details.requirements', lang)}>
              <ul className="text-sm text-text-secondary space-y-1">
                {(lang === 'ar' ? experience.requirementsAr : experience.requirements).map((req, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-text-tertiary mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
            </DetailSection>

            {/* Cancellation */}
            <DetailSection title={t('details.cancellation', lang)}>
              <p className="text-sm text-text-secondary">{lang === 'ar' ? experience.cancellationSummaryAr : experience.cancellationSummary}</p>
            </DetailSection>
          </div>
        )}

        {/* Venue release — important notice */}
        <div className="rounded-xl bg-surface-sunken p-4 flex items-start gap-3">
          <MapPin className="w-4.5 h-4.5 text-text-tertiary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-text-primary">{t('details.venueRelease', lang)}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{t('details.venueReleaseText', lang)}</p>
          </div>
        </div>

        {/* Price */}
        <PriceSummary
          price={experience.price}
          currency={experience.currency}
          included={lang === 'ar' ? experience.includedAr : experience.included}
          excluded={lang === 'ar' ? experience.excludedAr : experience.excluded}
        />

        <SyntheticPaymentLabel />

        {/* Primary CTA — sticky at bottom */}
        <div className="sticky bottom-20 pt-2 pb-4 bg-gradient-to-t from-surface via-surface to-transparent -mx-5 px-5">
          <Button
            variant={isFull ? 'secondary' : 'primary'}
            size="lg"
            className="w-full"
            onClick={() => setShowBookingDialog(true)}
          >
            {isFull ? t('details.joinWaitlist', lang) : t('details.bookNow', lang)}
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog
        open={showBookingDialog}
        onClose={() => { setShowBookingDialog(false); setBookingState('idle'); }}
        title={t('booking.title', lang)}
      >
        {bookingState === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {lang === 'ar' ? experience.titleAr : experience.title} — {experience.date}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-text-primary tabular-nums">{experience.price}</span>
              <span className="text-sm text-text-secondary">{t('common.sar', lang)}</span>
            </div>
            <SyntheticPaymentLabel />
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBookingDialog(false)}>
                {t('common.cancel', lang)}
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleBook}>
                {t('common.confirm', lang)}
              </Button>
            </div>
          </div>
        )}
        {bookingState === 'processing' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-text-secondary">{t('booking.processing', lang)}</p>
          </div>
        )}
        {bookingState === 'success' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <p className="text-sm text-text-secondary mb-5">{t('booking.success', lang)}</p>
            <Button variant="primary" className="w-full" onClick={() => { setShowBookingDialog(false); onBookSuccess(); }}>
              {t('nav.myPlans', lang)}
            </Button>
          </div>
        )}
        {bookingState === 'waitlisted' && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-info-bg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-info" />
            </div>
            <p className="text-sm text-text-secondary mb-5">{t('booking.waitlisted', lang)}</p>
            <Button variant="primary" className="w-full" onClick={() => { setShowBookingDialog(false); onBookSuccess(); }}>
              {t('nav.myPlans', lang)}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}

/* Info row — compact metadata */
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-text-tertiary mt-0.5" aria-hidden="true">{icon}</span>
      <div>
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

/* Detail section — for progressive disclosure */
function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      {children}
    </div>
  );
}
