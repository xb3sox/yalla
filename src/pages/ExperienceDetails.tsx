import { useState } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { ProgressBar } from '../components/ProgressBar';
import { ShareExperience } from '../components/ShareExperience';
import { FavoriteButton } from '../components/FavoriteButton';
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
  const { showToast } = useToast();
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
    // Check if experience is available
    if (experience.planState !== 'published') {
      showToast('error', lang === 'ar' ? 'هذه التجربة غير متاحة' : 'This experience is not available');
      return;
    }
    
    // Check if user already has active reservation for this experience
    const hasActiveReservation = state.reservations.some(
      r => r.participantId === 'user-1' &&
           r.planId === experience.id &&
           ['initiated', 'payment_pending', 'confirmed', 'reconfirmation_required', 'reconfirmed'].includes(r.state)
    );
    
    if (hasActiveReservation) {
      showToast('error', lang === 'ar' ? 'لديك حجز نشط بالفعل لهذه التجربة' : 'You already have an active reservation for this experience');
      return;
    }
    
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
      
      if (isFull) {
        showToast('info', lang === 'ar' ? 'تم إضافتك إلى قائمة الانتظار' : "You've been added to the waitlist");
      } else {
        showToast('success', lang === 'ar' ? 'تم حجزك بنجاح!' : 'Booking confirmed!');
      }
      
      setBookingState(isFull ? 'waitlisted' : 'success');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero — immersive with real image */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={experience.imageUrl}
          alt={lang === 'ar' ? experience.titleAr : experience.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.hero-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'hero-fallback absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900';
              parent.insertBefore(fallback, target);
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <button
          onClick={onBack}
          className="absolute top-4 start-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors"
          aria-label={t('common.back', lang)}
        >
          <ArrowLeft className="w-5 h-5 flip-rtl" />
        </button>
        <div className="absolute top-4 end-4 flex gap-2">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors">
            <ShareExperience experienceId={experience.id} title={lang === 'ar' ? experience.titleAr : experience.title} />
          </div>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 transition-colors">
            <FavoriteButton experienceId={experience.id} size="md" />
          </div>
        </div>
        <div className="absolute bottom-0 start-0 end-0 p-5">
          <h1 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
            {lang === 'ar' ? experience.titleAr : experience.title}
          </h1>
          <p className="text-white/80 text-sm mt-1.5">
            {experience.date} · {experience.time} · {experience.duration}
          </p>
        </div>
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

        {/* Capacity indicator */}
        <div className="bg-surface-raised rounded-xl border border-border p-4">
          <ProgressBar 
            progress={(experience.booked / experience.capacity) * 100} 
            color={experience.booked >= experience.capacity ? 'error' : experience.booked >= experience.capacity * 0.8 ? 'warning' : 'brand'}
            showLabel
            label={lang === 'ar' ? 'السعة' : 'Capacity'}
          />
          <p className="text-xs text-text-tertiary mt-2">
            {experience.booked} {lang === 'ar' ? 'محجوز من' : 'booked of'} {experience.capacity} {lang === 'ar' ? 'أماكن' : 'spots'}
            {spotsLeft > 0 && spotsLeft <= 3 && (
              <span className="text-warning font-medium ms-1">
                ({lang === 'ar' ? `${spotsLeft} متبقي!` : `${spotsLeft} left!`})
              </span>
            )}
          </p>
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 my-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all border border-brand-200"
          aria-expanded={showAllDetails}
        >
          {showAllDetails ? (lang === 'ar' ? 'عرض أقل' : 'Show less') : (lang === 'ar' ? 'عرض المزيد من التفاصيل' : 'View all details')}
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllDetails ? 'rotate-180' : ''}`} />
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
          <MapPin className="w-5 h-5 text-text-tertiary mt-0.5 flex-shrink-0" />
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
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-success-bg flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {t('booking.successTitle', lang)}
            </h3>
            <p className="text-sm text-text-secondary mb-5">{t('booking.success', lang)}</p>
            <Button variant="primary" className="w-full" onClick={() => { setShowBookingDialog(false); onBookSuccess(); }}>
              {t('nav.myPlans', lang)}
            </Button>
          </div>
        )}
        {bookingState === 'waitlisted' && (
          <div className="text-center py-6">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-info/20 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-info-bg flex items-center justify-center">
                <Clock className="w-10 h-10 text-info" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {t('booking.waitlistTitle', lang)}
            </h3>
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
