import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, ArrivalAction, Dialog } from '../components/DesignSystem';
import { ArrowLeft, MapPin, Clock, User, Shield, Wifi, Navigation, CheckCircle, AlertTriangle, HelpCircle, Phone } from 'lucide-react';

interface ArrivalModePageProps {
  experienceId: string;
  onBack: () => void;
}

export function ArrivalModePage({ experienceId, onBack }: ArrivalModePageProps) {
  const { state } = useApp();
  const lang = state.language;
  const experience = state.experiences.find(e => e.id === experienceId);
  const reservation = state.reservations.find(r => r.planId === experienceId && ['confirmed', 'reconfirmed'].includes(r.state));
  const [actionDialog, setActionDialog] = useState<string | null>(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);

  // Check entitlement
  const isEntitled = reservation && ['confirmed', 'reconfirmed'].includes(reservation.state);

  if (!experience || !isEntitled) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-12 h-12 text-charcoal-300 mb-4" />
        <h2 className="text-lg font-semibold text-charcoal-700 mb-2">{t('arrival.notEntitled', lang)}</h2>
        <p className="text-sm text-charcoal-500 mb-6">{t('arrival.notEntitledText', lang)}</p>
        <Button variant="secondary" onClick={onBack}>{t('common.back', lang)}</Button>
      </div>
    );
  }

  const venue = { name: lang === 'ar' ? 'حي الفن بالخبر' : 'Al Khobar Art District', address: lang === 'ar' ? 'شارع الأمير تركي، الخبر' : 'Prince Turkey St, Al Khobar', meetingPoint: lang === 'ar' ? 'بجوار نافورة الفسيفساء الزرقاء' : 'Near the blue mosaic fountain' };
  const hostName = lang === 'ar' ? 'سارة الراشد' : 'Sarah Al-Rashid';

  const handleAction = (action: string) => {
    setActionDialog(action);
    setActionSubmitted(false);
  };

  const submitAction = () => {
    setActionSubmitted(true);
    setTimeout(() => {
      setActionDialog(null);
      setActionSubmitted(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-teal-700 text-white px-5 pt-6 pb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-teal-100 hover:text-white transition-colors mb-4"
          aria-label={t('common.back', lang)}
        >
          <ArrowLeft className="w-5 h-5 flip-rtl" />
          <span className="text-sm">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-xl font-bold">{t('arrival.title', lang)}</h1>
        <p className="text-teal-200 text-sm mt-1">{lang === 'ar' ? experience.titleAr : experience.title}</p>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Venue Info */}
        <div className="bg-white rounded-xl border border-sand-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-teal-500" />
            <div>
              <p className="text-xs text-charcoal-400">{t('arrival.venue', lang)}</p>
              <p className="font-semibold text-charcoal-900">{venue.name}</p>
            </div>
          </div>
          <div className="ps-8">
            <p className="text-sm text-charcoal-600">{venue.address}</p>
          </div>
          <div className="ps-8">
            <p className="text-xs text-charcoal-400">{t('arrival.meetingPoint', lang)}</p>
            <p className="text-sm font-medium text-teal-700">{venue.meetingPoint}</p>
          </div>
          <a href="#" className="ps-8 flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700">
            <Navigation className="w-4 h-4" />
            {t('arrival.mapLink', lang)}
          </a>
        </div>

        {/* Host Info */}
        <div className="bg-white rounded-xl border border-sand-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-charcoal-400">{t('arrival.host', lang)}</p>
              <p className="font-semibold text-charcoal-900">{hostName}</p>
            </div>
          </div>
        </div>

        {/* Time Info */}
        <div className="bg-white rounded-xl border border-sand-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-teal-500" />
            <div>
              <p className="text-xs text-charcoal-400">{t('arrival.startTime', lang)}</p>
              <p className="font-semibold text-charcoal-900">{experience.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 ps-8">
            <Clock className="w-5 h-5 text-charcoal-300" />
            <div>
              <p className="text-xs text-charcoal-400">{t('arrival.endTime', lang)}</p>
              <p className="text-sm text-charcoal-600">
                {(() => {
                  const [h, m] = experience.time.split(':').map(Number);
                  const endMin = h * 60 + m + experience.durationMinutes;
                  const endH = Math.floor(endMin / 60) % 24;
                  const endM = endMin % 60;
                  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Accessibility Notes */}
        {experience.accessibility && (
          <div className="bg-white rounded-xl border border-sand-200 p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-teal-500 mt-0.5" />
              <div>
                <p className="text-xs text-charcoal-400">{t('arrival.accessibilityNotes', lang)}</p>
                <p className="text-sm text-charcoal-600 mt-1">{lang === 'ar' ? experience.accessibilityAr : experience.accessibility}</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated & Offline */}
        <div className="flex items-center justify-between text-xs text-charcoal-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t('arrival.lastUpdated', lang)}: {new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            {t('arrival.offlineCopy', lang)}
          </span>
        </div>

        {/* Arrival Actions */}
        <div className="space-y-3 pt-4">
          <ArrivalAction
            icon={<CheckCircle className="w-5 h-5 text-green-500" />}
            label={t('arrival.imHere', lang)}
            onClick={() => handleAction('here')}
            variant="primary"
          />
          <ArrivalAction
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            label={t('arrival.illBeLate', lang)}
            onClick={() => handleAction('late')}
          />
          <ArrivalAction
            icon={<AlertTriangle className="w-5 h-5 text-terracotta-500" />}
            label={t('arrival.cantFind', lang)}
            onClick={() => handleAction('cantFind')}
          />
          <ArrivalAction
            icon={<HelpCircle className="w-5 h-5 text-charcoal-500" />}
            label={t('arrival.needHelp', lang)}
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
        actions={!actionSubmitted ? (
          <>
            <Button variant="secondary" onClick={() => setActionDialog(null)}>{t('common.cancel', lang)}</Button>
            <Button variant="primary" onClick={submitAction}>{t('common.submit', lang)}</Button>
          </>
        ) : undefined}
      >
        {actionSubmitted ? (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-charcoal-600">
              {lang === 'ar' ? 'تم الإرسال. سيتواصل معك المضيف أو فريق يلا.' : 'Sent. Your host or Yalla team will reach out.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-charcoal-600">
            {actionDialog === 'here' && (lang === 'ar' ? 'سيتم إشعار مضيفك بأنك وصلت.' : 'Your host will be notified that you\'ve arrived.')}
            {actionDialog === 'late' && (lang === 'ar' ? 'سيتم إشعار مضيفك. لا تقلق، خذ وقتك.' : 'Your host will be notified. No worries, take your time.')}
            {actionDialog === 'cantFind' && (lang === 'ar' ? 'سيتواصل معك فريق يلا للمساعدة في تحديد موقعك.' : 'Yalla support will reach out to help locate the group.')}
            {actionDialog === 'help' && (lang === 'ar' ? 'فريق يلا هنا للمساعدة. كيف يمكننا مساعدتك؟' : 'Yalla support is here to help. How can we assist?')}
          </p>
        )}
      </Dialog>
    </div>
  );
}
