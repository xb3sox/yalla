import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, PriceSummary, Timeline, StatusBadge, Dialog, SyntheticPaymentLabel } from '../components/DesignSystem';
import { ArrowLeft, Clock, MapPin, Users, Globe, Shield, Volume2, Dumbbell, Info, CheckCircle } from 'lucide-react';

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
  const [bookingState, setBookingState] = useState<'idle' | 'processing' | 'success' | 'waitlisted' | 'conflict'>('idle');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!experience) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <p className="text-charcoal-500">{t('common.error', lang)}</p>
      </div>
    );
  }

  const spotsLeft = experience.capacity - experience.booked;
  const isFull = spotsLeft <= 0;

  const handleBook = () => {
    setBookingState('processing');
    // Simulate booking
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
    }, 1500);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const host = state.experiences.length > 0 ? { name: lang === 'ar' ? 'سارة الراشد' : 'Sarah Al-Rashid', role: lang === 'ar' ? 'مرشدة فنية' : 'Art guide' } : null;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero */}
      <div className="relative h-56 bg-gradient-to-br from-teal-600/80 to-teal-800/90 flex items-center justify-center">
        <button
          onClick={onBack}
          className="absolute top-4 start-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          aria-label={t('common.back', lang)}
        >
          <ArrowLeft className="w-5 h-5 flip-rtl" />
        </button>
        <div className="text-center text-white px-6">
          <p className="text-4xl mb-3">{experience.id === 'exp-1' ? '🎨' : experience.id === 'exp-2' ? '☕' : '✨'}</p>
          <h1 className="text-2xl font-bold">{lang === 'ar' ? experience.titleAr : experience.title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-charcoal-600">
            <Clock className="w-4 h-4 text-teal-500" />
            <span>{experience.date} • {experience.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-charcoal-600">
            <MapPin className="w-4 h-4 text-teal-500" />
            <span>{lang === 'ar' ? experience.areaAr : experience.area}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-charcoal-600">
            <Users className="w-4 h-4 text-teal-500" />
            <span>{experience.groupSizeMin}–{experience.groupSizeMax} {t('common.people', lang)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-charcoal-600">
            <Globe className="w-4 h-4 text-teal-500" />
            <span>{experience.language === 'ar' ? (lang === 'ar' ? 'العربية' : 'Arabic') : (lang === 'ar' ? 'الإنجليزية' : 'English')}</span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <StatusBadge state={experience.planState} />
          {!isFull && (
            <span className="text-xs text-charcoal-400">{t('explore.spotsLeft', lang, { count: spotsLeft })}</span>
          )}
          {isFull && (
            <span className="text-xs text-charcoal-400">{t('explore.full', lang)}</span>
          )}
        </div>

        {/* What you'll do */}
        <section>
          <h2 className="text-lg font-semibold text-charcoal-900 mb-2">{t('details.whatYoullDo', lang)}</h2>
          <p className="text-sm text-charcoal-600 leading-relaxed">
            {lang === 'ar' ? experience.descriptionAr : experience.description}
          </p>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-lg font-semibold text-charcoal-900 mb-3">{t('details.timeline', lang)}</h2>
          <Timeline items={experience.timeline} />
        </section>

        {/* Details sections with progressive disclosure */}
        <div className="space-y-2">
          {/* Accessibility */}
          <DisclosureSection
            title={t('details.accessibility', lang)}
            icon={<Shield className="w-4 h-4 text-teal-500" />}
            expanded={expandedSection === 'accessibility'}
            onToggle={() => toggleSection('accessibility')}
          >
            <p className="text-sm text-charcoal-600">{lang === 'ar' ? experience.accessibilityAr : experience.accessibility}</p>
          </DisclosureSection>

          {/* Physical Demand */}
          <DisclosureSection
            title={t('details.physicalDemand', lang)}
            icon={<Dumbbell className="w-4 h-4 text-teal-500" />}
            expanded={expandedSection === 'physical'}
            onToggle={() => toggleSection('physical')}
          >
            <p className="text-sm text-charcoal-600">
              {experience.physicalDemand === 'low' ? t('details.physicalLow', lang) :
               experience.physicalDemand === 'moderate' ? t('details.physicalModerate', lang) :
               t('details.physicalHigh', lang)}
            </p>
          </DisclosureSection>

          {/* Environment */}
          <DisclosureSection
            title={t('details.environment', lang)}
            icon={<Info className="w-4 h-4 text-teal-500" />}
            expanded={expandedSection === 'environment'}
            onToggle={() => toggleSection('environment')}
          >
            <p className="text-sm text-charcoal-600">{lang === 'ar' ? experience.environmentAr : experience.environment}</p>
            <p className="text-sm text-charcoal-600 mt-2">
              {t('details.noiseLevel', lang)}: {
                experience.noiseLevel === 'quiet' ? t('details.noiseQuiet', lang) :
                experience.noiseLevel === 'moderate' ? t('details.noiseModerate', lang) :
                t('details.noiseLoud', lang)
              }
            </p>
          </DisclosureSection>

          {/* Host */}
          <DisclosureSection
            title={t('details.hostRole', lang)}
            icon={<Users className="w-4 h-4 text-teal-500" />}
            expanded={expandedSection === 'host'}
            onToggle={() => toggleSection('host')}
          >
            <p className="text-sm text-charcoal-600">{lang === 'ar' ? experience.hostRoleAr : experience.hostRole}</p>
          </DisclosureSection>

          {/* Requirements */}
          <DisclosureSection
            title={t('details.requirements', lang)}
            icon={<CheckCircle className="w-4 h-4 text-teal-500" />}
            expanded={expandedSection === 'requirements'}
            onToggle={() => toggleSection('requirements')}
          >
            <ul className="text-sm text-charcoal-600 space-y-1">
              {(lang === 'ar' ? experience.requirementsAr : experience.requirements).map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-teal-500 mt-0.5">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </DisclosureSection>

          {/* Cancellation */}
          <DisclosureSection
            title={t('details.cancellation', lang)}
            icon={<Info className="w-4 h-4 text-teal-500" />}
            expanded={expandedSection === 'cancellation'}
            onToggle={() => toggleSection('cancellation')}
          >
            <p className="text-sm text-charcoal-600">{lang === 'ar' ? experience.cancellationSummaryAr : experience.cancellationSummary}</p>
          </DisclosureSection>
        </div>

        {/* Venue Release Rule */}
        <div className="rounded-xl bg-sand-50 border border-sand-200 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-charcoal-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-charcoal-700">{t('details.venueRelease', lang)}</h3>
              <p className="text-xs text-charcoal-500 mt-1">{t('details.venueReleaseText', lang)}</p>
            </div>
          </div>
        </div>

        {/* Support Boundaries */}
        <div className="rounded-xl bg-terracotta-50 border border-terracotta-100 p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-terracotta-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-charcoal-700">{t('details.supportBoundaries', lang)}</h3>
              <p className="text-xs text-charcoal-500 mt-1">{t('details.supportBoundariesText', lang)}</p>
            </div>
          </div>
        </div>

        {/* Price Summary */}
        <PriceSummary
          price={experience.price}
          currency={experience.currency}
          included={lang === 'ar' ? experience.includedAr : experience.included}
          excluded={lang === 'ar' ? experience.excludedAr : experience.excluded}
        />

        <SyntheticPaymentLabel />

        {/* Primary Action */}
        <div className="pt-4 pb-8">
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
            <p className="text-sm text-charcoal-600">
              {lang === 'ar' ? experience.titleAr : experience.title} — {experience.date}
            </p>
            <p className="text-lg font-bold">{experience.price} {t('common.sar', lang)}</p>
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
          <div className="text-center py-6">
            <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-charcoal-600">{t('booking.processing', lang)}</p>
          </div>
        )}
        {bookingState === 'success' && (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-charcoal-700 mb-4">{t('booking.success', lang)}</p>
            <Button variant="primary" className="w-full" onClick={() => { setShowBookingDialog(false); onBookSuccess(); }}>
              {t('nav.myPlans', lang)}
            </Button>
          </div>
        )}
        {bookingState === 'waitlisted' && (
          <div className="text-center py-4">
            <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-charcoal-700 mb-4">{t('booking.waitlisted', lang)}</p>
            <Button variant="primary" className="w-full" onClick={() => { setShowBookingDialog(false); onBookSuccess(); }}>
              {t('nav.myPlans', lang)}
            </Button>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// Disclosure Section
function DisclosureSection({ title, icon, expanded, onToggle, children }: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-sand-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-start hover:bg-sand-50 transition-colors"
        aria-expanded={expanded}
      >
        {icon}
        <span className="text-sm font-medium text-charcoal-700 flex-1">{title}</span>
        <span className={`text-charcoal-400 transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );
}
