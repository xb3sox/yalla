import { useState } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { t } from '../i18n';
import { Button, ArrivalAction, Dialog } from '../components/DesignSystem';
import { WalletButtons } from '../components/WalletButtons';
import { api } from '../services/api';
import { ArrowLeft, MapPin, Clock, User, Shield, Wifi, Navigation, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface ArrivalModePageProps {
  experienceId: string;
  onBack: () => void;
}

export function ArrivalModePage({ experienceId, onBack }: ArrivalModePageProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const experience = state.experiences.find(e => e.id === experienceId);
  const reservation = state.reservations.find(r => r.planId === experienceId && ['confirmed', 'reconfirmed', 'attended', 'checked_in'].includes(r.state));
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEntitled = reservation && ['confirmed', 'reconfirmed', 'attended', 'checked_in'].includes(reservation.state);

  if (!experience || !isEntitled) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-10 h-10 text-text-tertiary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">{t('arrival.notEntitled', lang)}</h2>
        <p className="text-sm text-text-secondary mb-6 max-w-xs">{t('arrival.notEntitledText', lang)}</p>
        <Button variant="secondary" onClick={onBack}>{t('common.back', lang)}</Button>
      </div>
    );
  }

  const venue = {
    name: lang === 'ar' ? 'حي الفن بالخبر' : 'Al Khobar Art District',
    address: lang === 'ar' ? 'شارع الأمير تركي، الخبر' : 'Prince Turkey St, Al Khobar',
    meetingPoint: lang === 'ar' ? 'بجوار نافورة الفسيفساء الزرقاء' : 'Near the blue mosaic fountain',
  };
  const hostName = lang === 'ar' ? 'سارة الراشد' : 'Sarah Al-Rashid';

  const handleAction = (action: string) => {
    setActionDialog(action);
    setActionSubmitted(false);
  };

  const submitAction = async () => {
    setIsSubmitting(true);
    
    try {
      if (actionDialog === 'here' && reservation) {
        // Try real API first
        try {
          await api.reservations.checkIn(reservation.id);
        } catch (error) {
          console.warn('API check-in failed, falling back to local state update', error);
        }
        
        // Always update local store
        dispatch({ type: 'CHECK_IN_RESERVATION', payload: reservation.id });
      }

      setActionSubmitted(true);
      
      const messages = {
        here: lang === 'ar' ? 'تم إشعار المضيف بوصولك' : 'Host notified of your arrival',
        late: lang === 'ar' ? 'تم إشعار المضيف بتأخرك' : 'Host notified you\'ll be late',
        cantFind: lang === 'ar' ? 'تواصل فريق يلا معك للمساعدة' : 'Yalla team is reaching out to help',
        help: lang === 'ar' ? 'فريق يلا سيتواصل معك قريباً' : 'Yalla team will contact you soon',
      };
      
      showToast('success', messages[actionDialog as keyof typeof messages] || messages.help);
      
      setTimeout(() => { setActionDialog(null); setActionSubmitted(false); }, 2000);
    } catch (error) {
      showToast('error', lang === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const endTime = (() => {
    try {
      if (!experience.time || !experience.durationMinutes) {
        return '';
      }
      
      const parts = experience.time.split(':');
      if (parts.length !== 2) {
        return '';
      }
      
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      
      if (isNaN(h) || isNaN(m)) {
        return '';
      }
      
      const endMin = h * 60 + m + experience.durationMinutes;
      return `${Math.floor(endMin / 60) % 24}:${(endMin % 60).toString().padStart(2, '0')}`;
    } catch (error) {
      return '';
    }
  })();

  return (
    <div className="min-h-screen bg-surface">
      {/* Header — calm, informative */}
      <div className="bg-brand-700 text-white px-5 pt-5 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-3"
          aria-label={t('common.back', lang)}
        >
          <ArrowLeft className="w-4 h-4 flip-rtl" />
          <span className="text-sm">{t('common.back', lang)}</span>
        </button>
        <p className="text-xs text-white/60 uppercase tracking-wider mb-1">{t('arrival.title', lang)}</p>
        <h1 className="text-xl font-bold">{lang === 'ar' ? experience.titleAr : experience.title}</h1>
      </div>

      <div className="px-5 py-6 space-y-4">
        {/* Venue */}
        <section className="bg-surface-raised rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{venue.name}</p>
              <p className="text-sm text-text-secondary mt-0.5">{venue.address}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-text-tertiary">{t('arrival.meetingPoint', lang)}</p>
                <p className="text-sm font-medium text-brand-600 mt-0.5">{venue.meetingPoint}</p>
              </div>
              <a href="#" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 mt-3">
                <Navigation className="w-3.5 h-3.5" />
                {t('arrival.mapLink', lang)}
              </a>
            </div>
          </div>
        </section>

        {/* Host + Time — combined */}
        <section className="bg-surface-raised rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-xs text-text-tertiary">{t('arrival.host', lang)}</p>
              <p className="font-medium text-text-primary">{hostName}</p>
            </div>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-xs text-text-tertiary">{t('arrival.startTime', lang)}</p>
              <p className="text-lg font-semibold text-text-primary tabular-nums">{experience.time}</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-text-tertiary">{t('arrival.endTime', lang)}</p>
              <p className="text-lg font-semibold text-text-secondary tabular-nums">{endTime}</p>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        {experience.accessibility && (
          <section className="bg-surface-raised rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-text-tertiary mt-0.5" />
              <div>
                <p className="text-xs text-text-tertiary mb-0.5">{t('arrival.accessibilityNotes', lang)}</p>
                <p className="text-sm text-text-secondary">{lang === 'ar' ? experience.accessibilityAr : experience.accessibility}</p>
              </div>
            </div>
          </section>
        )}

        {/* Wallet Passes */}
        {reservation && (
          <section className="bg-surface-raised rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
              {lang === 'ar' ? 'بطاقة المحفظة الرقمية' : 'Digital Wallet Pass'}
            </p>
            <WalletButtons reservationId={reservation.id} />
          </section>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t('arrival.lastUpdated', lang)}: {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            {t('arrival.offlineCopy', lang)}
          </span>
        </div>

        {/* Actions - Simplified to 3 main actions */}
        <div className="space-y-2.5 pt-2">
          <ArrivalAction
            icon={<CheckCircle className="w-5 h-5 text-success" />}
            label={t('arrival.imHere', lang)}
            onClick={() => handleAction('here')}
            variant="primary"
          />
          <ArrivalAction
            icon={<Clock className="w-5 h-5 text-warning" />}
            label={t('arrival.illBeLate', lang)}
            onClick={() => handleAction('late')}
          />
          <ArrivalAction
            icon={<HelpCircle className="w-5 h-5 text-text-tertiary" />}
            label={lang === 'ar' ? 'أحتاج مساعدة' : 'Need help'}
            onClick={() => handleAction('help')}
          />
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog
        open={!!actionDialog}
        onClose={() => setActionDialog(null)}
        title={
          actionDialog === 'here' ? t('arrival.imHere', lang) :
          actionDialog === 'late' ? t('arrival.illBeLate', lang) :
          actionDialog === 'cantFind' ? t('arrival.cantFind', lang) :
          t('arrival.needHelp', lang)
        }
        actions={!actionSubmitted ? <>
          <Button variant="secondary" onClick={() => setActionDialog(null)} disabled={isSubmitting}>{t('common.cancel', lang)}</Button>
          <Button variant="primary" onClick={submitAction} disabled={isSubmitting}>
            {isSubmitting ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : t('common.submit', lang)}
          </Button>
        </> : undefined}
      >
        {actionSubmitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm text-text-secondary">
              {lang === 'ar' ? 'تم الإرسال. سيتواصل معك المضيف أو فريق يلا.' : 'Sent. Your host or the Yalla team will reach out.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            {actionDialog === 'here' && (lang === 'ar' ? 'سيتم إشعار مضيفك بأنك وصلت.' : 'Your host will be notified that you\'ve arrived.')}
            {actionDialog === 'late' && (lang === 'ar' ? 'سيتم إشعار مضيفك. لا تقلق، خذ وقتك.' : 'Your host will be notified. No worries, take your time.')}
            {actionDialog === 'cantFind' && (lang === 'ar' ? 'سيتواصل معك فريق يلا للمساعدة.' : 'Yalla support will reach out to help you find the group.')}
            {actionDialog === 'help' && (lang === 'ar' ? 'فريق يلا هنا للمساعدة.' : 'Yalla support is here to help. How can we assist?')}
          </p>
        )}
      </Dialog>
    </div>
  );
}
