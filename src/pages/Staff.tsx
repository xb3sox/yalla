import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, StatusBadge, Dialog, Select, Input } from '../components/DesignSystem';
import { ArrowLeft, Layout, Users, MapPin, ClipboardList, Clock, CheckSquare, Bell, Wrench, Shield, FileText, BarChart3, Download } from 'lucide-react';
import type { Experience, Reservation, Notification } from '../types';
import { api } from '../services/api';

interface StaffPageProps {
  onBack: () => void;
}

type StaffSection = 'plans' | 'hosts' | 'venues' | 'requests' | 'waitlist' | 'attendance' | 'notifications' | 'recovery' | 'safety' | 'audit' | 'metrics';

export function StaffPage({ onBack }: StaffPageProps) {
  const { state } = useApp();
  const lang = state.language;
  const [activeSection, setActiveSection] = useState<StaffSection>('plans');
  const [assignDialog, setAssignDialog] = useState<{ type: string; id: string } | null>(null);
  const [reason, setReason] = useState('');

  // Simplified sections - grouped by category
  const sections: { key: StaffSection; icon: React.ReactNode; label: string; category: string }[] = [
    { key: 'plans', icon: <Layout className="w-4 h-4" />, label: t('staff.plans', lang), category: 'main' },
    { key: 'hosts', icon: <Users className="w-4 h-4" />, label: t('staff.hosts', lang), category: 'main' },
    { key: 'venues', icon: <MapPin className="w-4 h-4" />, label: t('staff.venues', lang), category: 'main' },
    { key: 'requests', icon: <ClipboardList className="w-4 h-4" />, label: t('staff.requests', lang), category: 'operations' },
    { key: 'waitlist', icon: <Clock className="w-4 h-4" />, label: t('staff.waitlist', lang), category: 'operations' },
    { key: 'attendance', icon: <CheckSquare className="w-4 h-4" />, label: t('staff.attendance', lang), category: 'operations' },
    { key: 'notifications', icon: <Bell className="w-4 h-4" />, label: t('staff.notifications', lang), category: 'system' },
    { key: 'recovery', icon: <Wrench className="w-4 h-4" />, label: t('staff.recovery', lang), category: 'system' },
    { key: 'safety', icon: <Shield className="w-4 h-4" />, label: t('staff.safetyCases', lang), category: 'system' },
    { key: 'audit', icon: <FileText className="w-4 h-4" />, label: t('staff.audit', lang), category: 'system' },
    { key: 'metrics', icon: <BarChart3 className="w-4 h-4" />, label: t('staff.metrics', lang), category: 'system' },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <div className="bg-text-primary text-text-inverse px-5 pt-5 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4 flip-rtl" />
          <span className="text-xs">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-lg font-semibold">{lang === 'ar' ? 'العمليات' : 'Operations'}</h1>
      </div>

      {/* Section tabs - with visual grouping */}
      <div className="overflow-x-auto border-b border-border bg-surface-raised sticky top-0 z-30">
        <div className="flex min-w-max px-2">
          {sections.map((s, index) => (
            <div key={s.key} className="flex items-center">
              {index > 0 && sections[index - 1].category !== s.category && (
                <div className="w-px h-6 bg-border mx-1" />
              )}
              <button
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === s.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {activeSection === 'plans' && <PlansSection lang={lang} state={state} onAssign={(id) => setAssignDialog({ type: 'host', id })} />}
        {activeSection === 'hosts' && <HostsSection lang={lang} />}
        {activeSection === 'venues' && <VenuesSection lang={lang} />}
        {activeSection === 'requests' && <EmptySection lang={lang} message={lang === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending requests'} />}
        {activeSection === 'waitlist' && <WaitlistSection lang={lang} state={state} />}
        {activeSection === 'attendance' && <AttendanceSection lang={lang} state={state} onCorrect={() => setAssignDialog({ type: 'attendance', id: 'res-1' })} />}
        {activeSection === 'notifications' && <NotificationsSection lang={lang} state={state} />}
        {activeSection === 'recovery' && <RecoverySection lang={lang} />}
        {activeSection === 'safety' && <SafetySection lang={lang} />}
        {activeSection === 'audit' && <AuditSection lang={lang} />}
        {activeSection === 'metrics' && <MetricsSection lang={lang} state={state} />}
      </div>

      {/* Assign Dialog */}
      <Dialog
        open={!!assignDialog}
        onClose={() => { setAssignDialog(null); setReason(''); }}
        title={assignDialog?.type === 'host' ? t('staff.assignHost', lang) : t('staff.correctAttendance', lang)}
        actions={<>
          <Button variant="secondary" onClick={() => { setAssignDialog(null); setReason(''); }}>{t('common.cancel', lang)}</Button>
          <Button variant="primary" disabled={!reason.trim()} onClick={() => { setAssignDialog(null); setReason(''); }}>{t('common.confirm', lang)}</Button>
        </>}
      >
        <div className="space-y-4">
          {assignDialog?.type === 'host' && (
            <Select
              label={t('staff.hosts', lang)}
              options={[
                { value: 'host-1', label: lang === 'ar' ? 'سارة الراشد' : 'Sarah Al-Rashid' },
                { value: 'host-2', label: lang === 'ar' ? 'خالد العتيبي' : 'Khalid Al-Otaibi' },
                { value: 'host-3', label: lang === 'ar' ? 'نورة الفهد' : 'Noura Al-Fahad' },
              ]}
            />
          )}
          <Input
            label={t('staff.reasonRequired', lang)}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={lang === 'ar' ? 'سبب هذا الإجراء...' : 'Reason for this action...'}
          />
          <p className="text-[10px] text-text-tertiary">
            {lang === 'ar' ? 'سيتم تسجيل هذا الإجراء في سجل التدقيق.' : 'This action will be recorded in the audit log.'}
          </p>
        </div>
      </Dialog>
    </div>
  );
}

function PlansSection({ lang, state, onAssign }: { lang: 'en' | 'ar'; state: ReturnType<typeof useApp>['state']; onAssign: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {state.experiences.map((exp: Experience) => (
        <div key={exp.id} className="bg-surface-raised rounded-xl border border-border p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-text-primary text-sm">{lang === 'ar' ? exp.titleAr : exp.title}</h3>
              <p className="text-xs text-text-tertiary mt-0.5">{exp.date} · {exp.time}</p>
            </div>
            <StatusBadge state={exp.planState} size="sm" />
          </div>
          <div className="flex items-center gap-4 text-xs text-text-tertiary mt-3">
            <span>{exp.booked}/{exp.capacity} {lang === 'ar' ? 'محجوز' : 'booked'}</span>
            <span>{exp.price} {t('common.sar', lang)}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => onAssign(exp.id)}>{t('staff.assignHost', lang)}</Button>
            <Button variant="ghost" size="sm">{t('staff.assignVenue', lang)}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HostsSection({ lang }: { lang: 'en' | 'ar' }) {
  const hosts = [
    { name: lang === 'ar' ? 'سارة الراشد' : 'Sarah Al-Rashid', role: lang === 'ar' ? 'مرشدة فنية' : 'Art guide' },
    { name: lang === 'ar' ? 'خالد العتيبي' : 'Khalid Al-Otaibi', role: lang === 'ar' ? 'مرشد صحراوي' : 'Desert guide' },
    { name: lang === 'ar' ? 'نورة الفهد' : 'Noura Al-Fahad', role: lang === 'ar' ? 'خبيرة قهوة' : 'Coffee expert' },
  ];
  return (
    <div className="space-y-2">
      {hosts.map((h) => (
        <div key={h.name} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary text-sm">{h.name}</p>
            <p className="text-xs text-text-tertiary">{h.role}</p>
          </div>
          <span className="text-xs text-text-tertiary">1 {lang === 'ar' ? 'خطة' : 'plan'}</span>
        </div>
      ))}
    </div>
  );
}

function VenuesSection({ lang }: { lang: 'en' | 'ar' }) {
  const venues = [
    { name: lang === 'ar' ? 'حي الفن بالخبر' : 'Al Khobar Art District', area: lang === 'ar' ? 'الخبر' : 'Al Khobar', type: 'primary' },
    { name: lang === 'ar' ? 'المركز الثقافي بالخبر' : 'Al Khobar Cultural Center', area: lang === 'ar' ? 'الخبر' : 'Al Khobar', type: 'fallback' },
    { name: lang === 'ar' ? 'مجلس بن وتقاليد' : 'Bun & Traditions Majlis', area: lang === 'ar' ? 'الرياض' : 'Riyadh', type: 'primary' },
    { name: lang === 'ar' ? 'مخيم نجوم الصحراء' : 'Desert Star Camp', area: lang === 'ar' ? 'الرياض' : 'Riyadh', type: 'primary' },
  ];
  return (
    <div className="space-y-2">
      {venues.map((v) => (
        <div key={v.name} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary text-sm">{v.name}</p>
            <p className="text-xs text-text-tertiary">{v.area}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${v.type === 'primary' ? 'bg-brand-50 text-brand-600' : 'bg-surface-sunken text-text-tertiary'}`}>
            {v.type}
          </span>
        </div>
      ))}
    </div>
  );
}

function WaitlistSection({ lang, state }: { lang: 'en' | 'ar'; state: ReturnType<typeof useApp>['state'] }) {
  const waitlisted = state.reservations.filter((r: Reservation) => r.state === 'waitlisted');
  
  const handleOfferSeat = (reservationId: string) => {
    // In a real app, this would update the reservation state to 'offered'
    // and send a notification to the user
    alert(lang === 'ar' 
      ? `سيتم عرض المقعد على المستخدم. سيتلقون إشعاراً.`
      : `Seat will be offered to user. They will receive a notification.`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          {lang === 'ar' 
            ? `${waitlisted.length} ${waitlisted.length === 1 ? 'شخص' : 'أشخاص'} في قائمة الانتظار`
            : `${waitlisted.length} ${waitlisted.length === 1 ? 'person' : 'people'} on waitlist`}
        </p>
      </div>
      {waitlisted.length > 0 ? (
        <div className="space-y-2">
          {waitlisted.map((r: Reservation) => {
            const exp = state.experiences.find((e: Experience) => e.id === r.planId);
            return (
              <div key={r.id} className="bg-surface-raised rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary text-sm mb-1">
                      {exp ? (lang === 'ar' ? exp.titleAr : exp.title) : r.planId}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {lang === 'ar' ? 'في الانتظار منذ' : 'Waiting since'} {new Date(r.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-info-bg text-info font-medium">
                    {lang === 'ar' ? 'في الانتظار' : 'Waitlisted'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleOfferSeat(r.id)}
                  >
                    {lang === 'ar' ? 'عرض مقعد' : 'Offer seat'}
                  </Button>
                  <Button variant="ghost" size="sm">
                    {lang === 'ar' ? 'عرض التفاصيل' : 'View details'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptySection lang={lang} message={lang === 'ar' ? 'لا يوجد أشخاص في قائمة الانتظار' : 'No one on the waitlist'} />
      )}
    </div>
  );
}

function AttendanceSection({ lang, state, onCorrect }: { lang: 'en' | 'ar'; state: ReturnType<typeof useApp>['state']; onCorrect: () => void }) {
  const confirmed = state.reservations.filter((r: Reservation) => ['confirmed', 'reconfirmed'].includes(r.state));
  return (
    <div className="space-y-2">
      {confirmed.map((r: Reservation) => {
        const exp = state.experiences.find((e: Experience) => e.id === r.planId);
        return (
          <div key={r.id} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary text-sm">{exp ? (lang === 'ar' ? exp.titleAr : exp.title) : r.planId}</p>
              <p className="text-xs text-warning">{lang === 'ar' ? 'الحضور: غير معروف' : 'Attendance: Unknown'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCorrect}>{t('staff.correctAttendance', lang)}</Button>
          </div>
        );
      })}
    </div>
  );
}

function NotificationsSection({ lang, state }: { lang: 'en' | 'ar'; state: ReturnType<typeof useApp>['state'] }) {
  return (
    <div className="space-y-2">
      {state.notifications.map((n: Notification) => (
        <div key={n.id} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary text-sm">{lang === 'ar' ? n.titleAr : n.title}</p>
            <p className="text-xs text-text-tertiary">{n.createdAt.slice(0, 10)}</p>
          </div>
          <StatusBadge state={n.state} size="sm" />
        </div>
      ))}
    </div>
  );
}

function SafetySection({ lang }: { lang: 'en' | 'ar' }) {
  // Mock safety cases for demonstration
  const safetyCases = [
    {
      id: 'case-1',
      category: lang === 'ar' ? 'سلوك غير لائق' : 'Inappropriate behavior',
      status: 'under_review',
      reporter: 'user-2',
      reported: 'user-3',
      createdAt: '2026-01-28',
      priority: 'high',
    },
    {
      id: 'case-2',
      category: lang === 'ar' ? 'مخاوف تتعلق بالسلامة' : 'Safety concern',
      status: 'triage',
      reporter: 'user-4',
      reported: 'venue-2',
      createdAt: '2026-01-29',
      priority: 'medium',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; labelAr: string; color: string }> = {
      triage: { label: 'Triage', labelAr: 'فرز', color: 'bg-warning-bg text-warning' },
      under_review: { label: 'Under Review', labelAr: 'قيد المراجعة', color: 'bg-info-bg text-info' },
      action_taken: { label: 'Action Taken', labelAr: 'تم اتخاذ إجراء', color: 'bg-success-bg text-success' },
      closed: { label: 'Closed', labelAr: 'مغلق', color: 'bg-surface-sunken text-text-tertiary' },
    };
    const s = statusMap[status] || statusMap.triage;
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>
        {lang === 'ar' ? s.labelAr : s.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; labelAr: string; color: string }> = {
      high: { label: 'High', labelAr: 'عالي', color: 'bg-accent-50 text-accent-600' },
      medium: { label: 'Medium', labelAr: 'متوسط', color: 'bg-warning-bg text-warning' },
      low: { label: 'Low', labelAr: 'منخفض', color: 'bg-surface-sunken text-text-tertiary' },
    };
    const p = priorityMap[priority] || priorityMap.medium;
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.color}`}>
        {lang === 'ar' ? p.labelAr : p.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent-50 border border-accent-100 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-accent-500" />
          <p className="text-xs font-medium text-accent-600">{lang === 'ar' ? 'وصول مقيد' : 'Restricted access'}</p>
        </div>
        <p className="text-xs text-text-secondary">
          {lang === 'ar' ? 'حالات السلامة مقيدة ولا يمكن الوصول إليها إلا من قبل فريق الثقة والسلامة. جميع الإجراءات مدققة.' : 'Safety cases are restricted to Trust & Safety staff only. All actions are audited.'}
        </p>
      </div>

      {safetyCases.length > 0 ? (
        <div className="space-y-2">
          {safetyCases.map(c => (
            <div key={c.id} className="bg-surface-raised rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-text-primary text-sm mb-1">{c.category}</p>
                  <p className="text-xs text-text-tertiary">{c.createdAt}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getPriorityBadge(c.priority)}
                  {getStatusBadge(c.status)}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm">
                  {lang === 'ar' ? 'عرض التفاصيل' : 'View details'}
                </Button>
                <Button variant="ghost" size="sm">
                  {lang === 'ar' ? 'تحديث الحالة' : 'Update status'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptySection lang={lang} message={lang === 'ar' ? 'لا توجد حالات مفتوحة' : 'No open cases'} />
      )}
    </div>
  );
}

function AuditSection({ lang }: { lang: 'en' | 'ar' }) {
  const events = [
    { action: lang === 'ar' ? 'إنشاء خطة' : 'Plan created', actor: 'ops-1', actorName: lang === 'ar' ? 'أحمد' : 'Ahmed', time: '2026-01-20 14:00', resource: 'exp-1', classification: 'internal' },
    { action: lang === 'ar' ? 'تعيين مضيف' : 'Host assigned', actor: 'ops-1', actorName: lang === 'ar' ? 'أحمد' : 'Ahmed', time: '2026-01-20 14:05', resource: 'exp-1', classification: 'internal' },
    { action: lang === 'ar' ? 'تعيين مكان' : 'Venue assigned', actor: 'ops-1', actorName: lang === 'ar' ? 'أحمد' : 'Ahmed', time: '2026-01-20 14:08', resource: 'exp-1', classification: 'internal' },
    { action: lang === 'ar' ? 'نشر خطة' : 'Plan published', actor: 'ops-1', actorName: lang === 'ar' ? 'أحمد' : 'Ahmed', time: '2026-01-20 14:10', resource: 'exp-1', classification: 'internal' },
    { action: lang === 'ar' ? 'حجز مؤكد' : 'Booking confirmed', actor: 'system', actorName: 'System', time: '2026-01-20 14:15', resource: 'res-1', classification: 'confidential' },
    { action: lang === 'ar' ? 'إرسال إشعار' : 'Notification sent', actor: 'system', actorName: 'System', time: '2026-01-20 14:16', resource: 'notif-1', classification: 'internal' },
    { action: lang === 'ar' ? 'تأكيد الحضور' : 'Attendance confirmed', actor: 'user-1', actorName: lang === 'ar' ? 'محمد' : 'Mohammed', time: '2026-01-22 09:01', resource: 'res-2', classification: 'confidential' },
    { action: lang === 'ar' ? 'تصحيح حضور' : 'Attendance corrected', actor: 'ops-2', actorName: lang === 'ar' ? 'فاطمة' : 'Fatima', time: '2026-01-22 18:30', resource: 'res-1', classification: 'confidential' },
  ];

  const getClassificationBadge = (classification: string) => {
    const classMap: Record<string, { label: string; labelAr: string; color: string }> = {
      public: { label: 'Public', labelAr: 'عام', color: 'bg-success-bg text-success' },
      internal: { label: 'Internal', labelAr: 'داخلي', color: 'bg-info-bg text-info' },
      confidential: { label: 'Confidential', labelAr: 'سري', color: 'bg-warning-bg text-warning' },
      restricted: { label: 'Restricted', labelAr: 'مقيد', color: 'bg-accent-50 text-accent-600' },
    };
    const c = classMap[classification] || classMap.internal;
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${c.color}`}>
        {lang === 'ar' ? c.labelAr : c.label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary">
          {lang === 'ar' ? `${events.length} حدث` : `${events.length} events`}
        </p>
      </div>
      <div className="space-y-2">
        {events.map((e) => (
          <div key={`${e.time}-${e.action}-${e.actor}`} className="bg-surface-raised rounded-lg border border-border p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-text-primary">{e.action}</p>
                  {getClassificationBadge(e.classification)}
                </div>
                <p className="text-xs text-text-tertiary">
                  {e.actorName} ({e.actor}) → {e.resource}
                </p>
              </div>
              <span className="text-xs text-text-tertiary tabular-nums whitespace-nowrap ms-2">{e.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoverySection({ lang }: { lang: 'en' | 'ar' }) {
  // Mock recovery scenarios
  const recoveryItems = [
    {
      id: 'rec-1',
      type: lang === 'ar' ? 'إشعار فاشل' : 'Failed notification',
      description: lang === 'ar' ? 'فشل إرسال إشعار تأكيد الحجز' : 'Failed to send booking confirmation notification',
      resourceId: 'notif-3',
      status: 'retrying',
      attempts: 2,
      lastAttempt: '2026-01-29 10:30',
    },
    {
      id: 'rec-2',
      type: lang === 'ar' ? 'نتيجة دفع غير معروفة' : 'Unknown payment outcome',
      description: lang === 'ar' ? 'حالة الدفع غير معروفة - بحاجة للمصالحة' : 'Payment status unknown - needs reconciliation',
      resourceId: 'pay-synth-3',
      status: 'manual_recovery',
      attempts: 1,
      lastAttempt: '2026-01-29 09:15',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; labelAr: string; color: string }> = {
      retrying: { label: 'Retrying', labelAr: 'إعادة المحاولة', color: 'bg-warning-bg text-warning' },
      manual_recovery: { label: 'Manual Recovery', labelAr: 'استرداد يدوي', color: 'bg-accent-50 text-accent-600' },
      resolved: { label: 'Resolved', labelAr: 'تم الحل', color: 'bg-success-bg text-success' },
    };
    const s = statusMap[status] || statusMap.retrying;
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>
        {lang === 'ar' ? s.labelAr : s.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-warning-bg border border-warning/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-4 h-4 text-warning" />
          <p className="text-xs font-medium text-warning">{lang === 'ar' ? 'عمليات تحتاج استرداد' : 'Operations requiring recovery'}</p>
        </div>
        <p className="text-xs text-text-secondary">
          {lang === 'ar' 
            ? 'هذه العمليات فشلت أو حالتها غير معروفة. راجعها واتخذ الإجراء المناسب.'
            : 'These operations failed or have unknown status. Review and take appropriate action.'}
        </p>
      </div>

      {recoveryItems.length > 0 ? (
        <div className="space-y-2">
          {recoveryItems.map(item => (
            <div key={item.id} className="bg-surface-raised rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-text-primary text-sm mb-1">{item.type}</p>
                  <p className="text-xs text-text-secondary">{item.description}</p>
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex items-center gap-4 text-xs text-text-tertiary mt-3">
                <span>{lang === 'ar' ? 'المحاولات' : 'Attempts'}: {item.attempts}</span>
                <span>{lang === 'ar' ? 'آخر محاولة' : 'Last attempt'}: {item.lastAttempt}</span>
                <span>ID: {item.resourceId}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" size="sm">
                  {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Button>
                <Button variant="ghost" size="sm">
                  {lang === 'ar' ? 'وضع يدوي' : 'Manual resolve'}
                </Button>
                <Button variant="ghost" size="sm">
                  {lang === 'ar' ? 'تفاصيل' : 'Details'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptySection lang={lang} message={lang === 'ar' ? 'لا توجد عمليات تحتاج استرداد' : 'No operations require recovery'} icon={<Wrench className="w-8 h-8 text-text-tertiary mx-auto mb-2" />} />
      )}
    </div>
  );
}

function MetricsSection({ lang, state }: { lang: 'en' | 'ar'; state: ReturnType<typeof useApp>['state'] }) {
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const totalPlans = state.experiences.length;
  const totalBookings = state.reservations.length;
  const confirmed = state.reservations.filter((r: Reservation) => ['confirmed', 'reconfirmed'].includes(r.state)).length;

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      if (format === 'csv') setExportingCsv(true);
      else setExportingExcel(true);

      const blob = await (format === 'csv' ? api.staff.exportCsv() : api.staff.exportExcel());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reservations.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Failed to export ${format}:`, error);
      alert(`Failed to export ${format}`);
    } finally {
      if (format === 'csv') setExportingCsv(false);
      else setExportingExcel(false);
    }
  };

  return (
    <div className="bg-surface-raised rounded-xl border border-border p-5 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-text-tertiary">{lang === 'ar' ? 'مقاييس تجريبية' : 'Pilot metrics'}</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleExport('csv')} loading={exportingCsv} disabled={exportingExcel}>
              <Download className="w-4 h-4 mr-1" />
              {t('staff.exportCsv', lang)}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleExport('excel')} loading={exportingExcel} disabled={exportingCsv}>
              <Download className="w-4 h-4 mr-1" />
              {t('staff.exportExcel', lang)}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Metric value={totalPlans} label={lang === 'ar' ? 'خطط منشورة' : 'Published plans'} />
          <Metric value={totalBookings} label={lang === 'ar' ? 'إجمالي الحجوزات' : 'Total reservations'} />
          <Metric value={confirmed} label={lang === 'ar' ? 'مؤكد' : 'Confirmed'} highlight />
          <Metric value={`${totalPlans > 0 ? Math.round((confirmed / Math.max(totalBookings, 1)) * 100) : 0}%`} label={lang === 'ar' ? `معدل التأكيد (${confirmed}/${totalBookings})` : `Confirmation (${confirmed}/${totalBookings})`} />
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold tabular-nums ${highlight ? 'text-brand-600' : 'text-text-primary'}`}>{value}</p>
      <p className="text-xs text-text-tertiary mt-0.5">{label}</p>
    </div>
  );
}

function EmptySection({ lang, message, icon }: { lang: 'en' | 'ar'; message: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-surface-raised rounded-xl border border-border p-8 text-center">
      {icon}
      <p className="text-sm text-text-tertiary">{message}</p>
    </div>
  );
}
