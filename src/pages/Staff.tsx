import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, StatusBadge, Dialog, Select, Input } from '../components/DesignSystem';
import { ArrowLeft, Layout, Users, MapPin, ClipboardList, Clock, CheckSquare, Bell, Wrench, Shield, FileText, BarChart3 } from 'lucide-react';
import type { Experience, Reservation, Notification } from '../types';

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

  const sections: { key: StaffSection; icon: React.ReactNode; label: string }[] = [
    { key: 'plans', icon: <Layout className="w-4 h-4" />, label: t('staff.plans', lang) },
    { key: 'hosts', icon: <Users className="w-4 h-4" />, label: t('staff.hosts', lang) },
    { key: 'venues', icon: <MapPin className="w-4 h-4" />, label: t('staff.venues', lang) },
    { key: 'requests', icon: <ClipboardList className="w-4 h-4" />, label: t('staff.requests', lang) },
    { key: 'waitlist', icon: <Clock className="w-4 h-4" />, label: t('staff.waitlist', lang) },
    { key: 'attendance', icon: <CheckSquare className="w-4 h-4" />, label: t('staff.attendance', lang) },
    { key: 'notifications', icon: <Bell className="w-4 h-4" />, label: t('staff.notifications', lang) },
    { key: 'recovery', icon: <Wrench className="w-4 h-4" />, label: t('staff.recovery', lang) },
    { key: 'safety', icon: <Shield className="w-4 h-4" />, label: t('staff.safetyCases', lang) },
    { key: 'audit', icon: <FileText className="w-4 h-4" />, label: t('staff.audit', lang) },
    { key: 'metrics', icon: <BarChart3 className="w-4 h-4" />, label: t('staff.metrics', lang) },
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

      {/* Section tabs */}
      <div className="overflow-x-auto border-b border-border bg-surface-raised sticky top-0 z-30">
        <div className="flex min-w-max px-2">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === s.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
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
        {activeSection === 'recovery' && <EmptySection lang={lang} message={lang === 'ar' ? 'لا توجد عمليات تحتاج استرداد' : 'No operations require recovery'} icon={<Wrench className="w-8 h-8 text-text-tertiary mx-auto mb-2" />} />}
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
      {hosts.map((h, i) => (
        <div key={i} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
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
      {venues.map((v, i) => (
        <div key={i} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
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
  return (
    <div className="space-y-2">
      {waitlisted.length > 0 ? waitlisted.map((r: Reservation) => {
        const exp = state.experiences.find((e: Experience) => e.id === r.planId);
        return (
          <div key={r.id} className="bg-surface-raised rounded-xl border border-border p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary text-sm">{exp ? (lang === 'ar' ? exp.titleAr : exp.title) : r.planId}</p>
              <p className="text-xs text-text-tertiary">{lang === 'ar' ? 'في الانتظار' : 'Waiting'}</p>
            </div>
            <Button variant="ghost" size="sm">{lang === 'ar' ? 'عرض' : 'Offer'}</Button>
          </div>
        );
      }) : <EmptySection lang={lang} message={lang === 'ar' ? 'لا يوجد أشخاص في قائمة الانتظار' : 'No one on the waitlist'} />}
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
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent-50 border border-accent-100 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-accent-500" />
          <p className="text-xs font-medium text-accent-600">{lang === 'ar' ? 'وصول مقيد' : 'Restricted access'}</p>
        </div>
        <p className="text-xs text-text-secondary">
          {lang === 'ar' ? 'حالات السلامة مقيدة ولا يمكن الوصول إليها إلا من قبل فريق الثقة والسلامة.' : 'Safety cases are restricted to Trust & Safety staff only. All actions are audited.'}
        </p>
      </div>
      <EmptySection lang={lang} message={lang === 'ar' ? 'لا توجد حالات مفتوحة' : 'No open cases'} />
    </div>
  );
}

function AuditSection({ lang }: { lang: 'en' | 'ar' }) {
  const events = [
    { action: lang === 'ar' ? 'إنشاء خطة' : 'Plan created', actor: 'ops-1', time: '2026-01-20 14:00' },
    { action: lang === 'ar' ? 'تعيين مضيف' : 'Host assigned', actor: 'ops-1', time: '2026-01-20 14:05' },
    { action: lang === 'ar' ? 'نشر خطة' : 'Plan published', actor: 'ops-1', time: '2026-01-20 14:10' },
    { action: lang === 'ar' ? 'حجز مؤكد' : 'Booking confirmed', actor: 'system', time: '2026-01-20 14:15' },
  ];
  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i} className="bg-surface-raised rounded-lg border border-border p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">{e.action}</p>
            <p className="text-xs text-text-tertiary">{e.actor}</p>
          </div>
          <span className="text-xs text-text-tertiary tabular-nums">{e.time}</span>
        </div>
      ))}
    </div>
  );
}

function MetricsSection({ lang, state }: { lang: 'en' | 'ar'; state: ReturnType<typeof useApp>['state'] }) {
  const totalPlans = state.experiences.length;
  const totalBookings = state.reservations.length;
  const confirmed = state.reservations.filter((r: Reservation) => ['confirmed', 'reconfirmed'].includes(r.state)).length;
  return (
    <div className="bg-surface-raised rounded-xl border border-border p-5">
      <p className="text-xs text-text-tertiary mb-4">{lang === 'ar' ? 'مقاييس تجريبية' : 'Pilot metrics'}</p>
      <div className="grid grid-cols-2 gap-6">
        <Metric value={totalPlans} label={lang === 'ar' ? 'خطط منشورة' : 'Published plans'} />
        <Metric value={totalBookings} label={lang === 'ar' ? 'إجمالي الحجوزات' : 'Total reservations'} />
        <Metric value={confirmed} label={lang === 'ar' ? 'مؤكد' : 'Confirmed'} highlight />
        <Metric value={`${totalPlans > 0 ? Math.round((confirmed / Math.max(totalBookings, 1)) * 100) : 0}%`} label={lang === 'ar' ? `معدل التأكيد (${confirmed}/${totalBookings})` : `Confirmation (${confirmed}/${totalBookings})`} />
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
