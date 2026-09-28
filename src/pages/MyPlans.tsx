import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { StatusPanel, StatusBadge, Button, Dialog, MaterialChangeBanner } from '../components/DesignSystem';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface MyPlansPageProps {
  onViewExperience: (id: string) => void;
  onGoToArrival: (id: string) => void;
  onGoToFeedback: (id: string) => void;
}

export function MyPlansPage({ onViewExperience, onGoToArrival, onGoToFeedback }: MyPlansPageProps) {
  const { state, dispatch } = useApp();
  const lang = state.language;
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);

  const userReservations = state.reservations.filter(r => r.participantId === 'user-1');

  const actionRequired = userReservations.filter(r => r.state === 'reconfirmation_required' || r.state === 'offered');
  const upcoming = userReservations.filter(r => ['confirmed', 'reconfirmed'].includes(r.state));
  const pendingWaitlisted = userReservations.filter(r => ['waitlisted', 'payment_pending', 'initiated'].includes(r.state));
  const cancelled = userReservations.filter(r => ['cancelled_by_participant', 'cancelled_by_yalla'].includes(r.state));
  const past = userReservations.filter(r => ['completed', 'attended'].includes(r.state));

  const getExperience = (planId: string) => state.experiences.find(e => e.id === planId);

  const getNextAction = (reservation: typeof userReservations[0]) => {
    switch (reservation.state) {
      case 'reconfirmation_required':
        return { label: t('plans.reconfirm', lang), action: () => dispatch({ type: 'RECONFIRM_RESERVATION', payload: reservation.id }) };
      case 'confirmed':
      case 'reconfirmed':
        return { label: t('arrival.title', lang), action: () => onGoToArrival(reservation.planId) };
      case 'waitlisted':
        return null;
      default:
        return null;
    }
  };

  const renderPlanCard = (reservation: typeof userReservations[0]) => {
    const exp = getExperience(reservation.planId);
    if (!exp) return null;
    const nextAction = getNextAction(reservation);
    const hasMaterialChanges = exp.materialChanges && exp.materialChanges.length > 0;

    return (
      <div key={reservation.id} className="bg-white rounded-xl border border-sand-200 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-charcoal-900 text-sm">
              {lang === 'ar' ? exp.titleAr : exp.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-charcoal-500">
              <Calendar className="w-3 h-3" />
              <span>{exp.date}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{exp.time}</span>
            </div>
          </div>
          <StatusBadge state={reservation.state} size="sm" />
        </div>

        {/* Status Panel */}
        <StatusPanel
          reservationState={reservation.state}
          expiryAt={reservation.expiryAt}
          onAction={nextAction?.action}
          actionLabel={nextAction?.label}
        />

        {/* Material Changes */}
        {hasMaterialChanges && (
          <MaterialChangeBanner
            changes={exp.materialChanges!.map((mc: { field: string; fieldAr: string; oldValue: string; newValue: string }) => ({
              field: mc.field,
              fieldAr: mc.fieldAr,
              oldValue: mc.oldValue,
              newValue: mc.newValue,
            }))}
            onAccept={() => {}}
          />
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {['confirmed', 'reconfirmed'].includes(reservation.state) && (
            <Button variant="ghost" size="sm" onClick={() => onViewExperience(exp.id)}>
              {lang === 'ar' ? 'عرض التفاصيل' : 'View details'}
            </Button>
          )}
          {['confirmed', 'reconfirmed', 'reconfirmation_required'].includes(reservation.state) && (
            <Button variant="ghost" size="sm" className="text-terracotta-600" onClick={() => setCancelDialog(reservation.id)}>
              {t('plans.cancelPlan', lang)}
            </Button>
          )}
          {['completed', 'attended'].includes(reservation.state) && (
            <Button variant="ghost" size="sm" onClick={() => onGoToFeedback(reservation.id)}>
              {lang === 'ar' ? 'إرسال ملاحظات' : 'Give feedback'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: typeof userReservations) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-charcoal-500 uppercase tracking-wide">{title}</h2>
        {items.map(renderPlanCard)}
      </section>
    );
  };

  const hasAnyPlans = userReservations.length > 0;

  return (
    <div className="min-h-screen bg-ivory">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-charcoal-900">{t('plans.title', lang)}</h1>
      </div>

      <div className="px-5 pb-8 space-y-6">
        {hasAnyPlans ? (
          <>
            {renderSection(t('plans.actionRequired', lang), actionRequired)}
            {renderSection(t('plans.upcoming', lang), upcoming)}
            {renderSection(t('plans.pendingWaitlisted', lang), pendingWaitlisted)}
            {renderSection(t('plans.cancelled', lang), cancelled)}
            {renderSection(t('plans.past', lang), past)}
          </>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-charcoal-300 mx-auto mb-4" />
            <p className="text-charcoal-500">{t('plans.empty', lang)}</p>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        title={t('plans.cancelPlan', lang)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setCancelDialog(null)}>{t('common.cancel', lang)}</Button>
            <Button variant="danger" onClick={() => {
              if (cancelDialog) {
                dispatch({ type: 'CANCEL_RESERVATION', payload: cancelDialog });
                setCancelDialog(null);
              }
            }}>{t('common.confirm', lang)}</Button>
          </>
        }
      >
        <p className="text-sm text-charcoal-600">
          {lang === 'ar'
            ? 'هل أنت متأكد من إلغاء حجزك؟ قد لا يكون الاسترداد متاحاً اعتماداً على سياسة الإلغاء.'
            : 'Are you sure you want to cancel? Refunds may not be available depending on the cancellation policy.'}
        </p>
      </Dialog>
    </div>
  );
}
