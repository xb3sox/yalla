import { useState, useEffect } from 'react';
import { useApp } from '../data/store';
import { useToast } from '../components/Toast';
import { t } from '../i18n';
import { StatusPanel, StatusBadge, Button, MaterialChangeBanner } from '../components/DesignSystem';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MyPlansPageSkeleton } from '../components/LoadingSkeleton';
import { Calendar } from 'lucide-react';

interface MyPlansPageProps {
  onViewExperience: (id: string) => void;
  onGoToArrival: (id: string) => void;
  onGoToFeedback: (id: string) => void;
}

export function MyPlansPage({ onViewExperience, onGoToArrival, onGoToFeedback }: MyPlansPageProps) {
  const { state, dispatch } = useApp();
  const { showToast } = useToast();
  const lang = state.language;
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userReservations = state.reservations.filter(r => r.participantId === 'user-1');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <MyPlansPageSkeleton />;
  }

  const actionRequired = userReservations.filter(r => r.state === 'reconfirmation_required' || r.state === 'offered');
  const upcoming = userReservations.filter(r => ['confirmed', 'reconfirmed'].includes(r.state));
  const pendingWaitlisted = userReservations.filter(r => ['waitlisted', 'payment_pending', 'initiated'].includes(r.state));
  const cancelled = userReservations.filter(r => ['cancelled_by_participant', 'cancelled_by_yalla'].includes(r.state));
  const past = userReservations.filter(r => ['completed', 'attended'].includes(r.state));

  const getExperience = (planId: string) => state.experiences.find(e => e.id === planId);

  const getNextAction = (reservation: typeof userReservations[0]) => {
    switch (reservation.state) {
      case 'reconfirmation_required':
        return {
          label: t('plans.reconfirm', lang),
          action: () => {
            dispatch({ type: 'RECONFIRM_RESERVATION', payload: reservation.id });
            showToast('success', lang === 'ar' ? 'تم تأكيد حضورك' : 'Attendance confirmed');
          }
        };
      case 'confirmed':
      case 'reconfirmed':
        return { label: t('arrival.title', lang), action: () => onGoToArrival(reservation.planId) };
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
      <div key={reservation.id} className="bg-surface-raised rounded-xl border border-border p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary text-[15px] truncate">
              {lang === 'ar' ? exp.titleAr : exp.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-text-tertiary">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              <span>{exp.date} · {exp.time}</span>
            </div>
          </div>
          <StatusBadge state={reservation.state} size="sm" />
        </div>

        {/* Status */}
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

        {/* Secondary actions */}
        <div className="flex items-center gap-1 pt-1">
          {['confirmed', 'reconfirmed'].includes(reservation.state) && (
            <Button variant="ghost" size="sm" onClick={() => onViewExperience(exp.id)}>
              {lang === 'ar' ? 'التفاصيل' : 'Details'}
            </Button>
          )}
          {['confirmed', 'reconfirmed', 'reconfirmation_required'].includes(reservation.state) && (
            <Button variant="ghost" size="sm" className="text-accent-600 hover:bg-accent-50" onClick={() => setCancelDialog(reservation.id)}>
              {t('plans.cancelPlan', lang)}
            </Button>
          )}
          {['completed', 'attended'].includes(reservation.state) && (
            <Button variant="ghost" size="sm" onClick={() => onGoToFeedback(reservation.id)}>
              {lang === 'ar' ? 'ملاحظات' : 'Feedback'}
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
        <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{title}</h2>
        {items.map(renderPlanCard)}
      </section>
    );
  };

  const hasAnyPlans = userReservations.length > 0;

  return (
    <div className="px-5 pt-4 pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('plans.title', lang)}</h1>
      </div>

      {hasAnyPlans ? (
        <div className="space-y-6">
          {renderSection(t('plans.actionRequired', lang), actionRequired)}
          {renderSection(t('plans.upcoming', lang), upcoming)}
          {renderSection(t('plans.pendingWaitlisted', lang), pendingWaitlisted)}
          {renderSection(t('plans.cancelled', lang), cancelled)}
          {renderSection(t('plans.past', lang), past)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-text-secondary">{t('plans.empty', lang)}</p>
        </div>
      )}

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        onConfirm={() => {
          if (cancelDialog) {
            dispatch({ type: 'CANCEL_RESERVATION', payload: cancelDialog });
            showToast('success', lang === 'ar' ? 'تم إلغاء الحجز' : 'Booking cancelled');
            setCancelDialog(null);
          }
        }}
        title={t('plans.cancelPlan', lang)}
        message={
          lang === 'ar'
            ? 'هل أنت متأكد من إلغاء حجزك؟ قد لا يكون الاسترداد متاحاً.'
            : 'Are you sure you want to cancel this booking? Refunds may not be available.'
        }
        confirmLabel={lang === 'ar' ? 'إلغاء الحجز' : 'Cancel booking'}
        variant="danger"
      />
    </div>
  );
}
