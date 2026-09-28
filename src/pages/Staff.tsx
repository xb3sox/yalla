import { useState } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { Button, StatusBadge, Dialog, Input, Select } from '../components/DesignSystem';
import { Layout, Users, MapPin, ClipboardList, Clock, CheckSquare, Bell, Wrench, Shield, FileText, BarChart3, ArrowLeft } from 'lucide-react';

interface StaffPageProps {
  onBack: () => void;
}

type StaffSection = 'plans' | 'hosts' | 'venues' | 'requests' | 'waitlist' | 'attendance' | 'notifications' | 'recovery' | 'safety' | 'audit' | 'metrics';

export function StaffPage({ onBack }: StaffPageProps) {
  const { state, dispatch } = useApp();
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
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-charcoal-900 text-white px-5 pt-6 pb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-charcoal-300 hover:text-white mb-3">
          <ArrowLeft className="w-4 h-4 flip-rtl" />
          <span className="text-xs">{t('common.back', lang)}</span>
        </button>
        <h1 className="text-lg font-bold">{lang === 'ar' ? 'لوحة العمليات' : 'Operations'}</h1>
      </div>

      {/* Section Tabs */}
      <div className="overflow-x-auto border-b border-sand-200 bg-white">
        <div className="flex min-w-max">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeSection === s.key ? 'border-teal-500 text-teal-700' : 'border-transparent text-charcoal-500 hover:text-charcoal-700'
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
        {activeSection === 'hosts' && <HostsSection lang={lang} state={state} />}
        {activeSection === 'venues' && <VenuesSection lang={lang} />}
        {activeSection === 'requests' && <RequestsSection lang={lang} state={state} />}
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
        title={
          assignDialog?.type === 'host' ? t('staff.assignHost', lang) :
          assignDialog?.type === 'attendance' ? t('staff.correctAttendance', lang) :
          t('staff.assignVenue', lang)
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => { setAssignDialog(null); setReason(''); }}>{t('common.cancel', lang)}</Button>
            <Button variant="primary" disabled={!reason.trim()} onClick={() => { setAssignDialog(null); setReason(''); }}>{t('common.confirm', lang)}</Button>
          </>
        }
      >
        <div className="space-y-3">
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
          <p className="text-[10px] text-charcoal-400">
            {lang === 'ar' ? 'سيتم تسجيل هذا الإجراء في سجل التدقيق.' : 'This action will be recorded in the audit log.'}
          </p>
        </div>
      </Dialog>
    </div>
  );
}

// Plans Section
function PlansSection({ lang, state, onAssign }: { lang: 'en' | 'ar'; state: any; onAssign: (id: string) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.plans', lang)}</h2>
      {state.experiences.map((exp: any) => (
        <div key={exp.id} className="bg-white rounded-xl border border-sand-200 p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-medium text-charcoal-900 text-sm">{lang === 'ar' ? exp.titleAr : exp.title}</h3>
              <p className="text-xs text-charcoal-500">{exp.date} • {exp.time}</p>
            </div>
            <StatusBadge state={exp.planState} size="sm" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-charcoal-500 mt-3">
            <div><span className="text-charcoal-400">{t('staff.setCapacity', lang)}:</span> {exp.booked}/{exp.capacity}</div>
            <div><span className="text-charcoal-400">Min:</span> {exp.minAttendance}</div>
            <div><span className="text-charcoal-400">Price:</span> {exp.price} SAR</div>
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

// Hosts Section
function HostsSection({ lang, state }: { lang: 'en' | 'ar'; state: any }) {
  const hosts = [
    { id: 'host-1', name: lang === 'ar' ? 'سارة الراشد' : 'Sarah Al-Rashid', role: lang === 'ar' ? 'مرشدة فنية' : 'Art guide', assigned: 1 },
    { id: 'host-2', name: lang === 'ar' ? 'خالد العتيبي' : 'Khalid Al-Otaibi', role: lang === 'ar' ? 'مرشد صحراوي' : 'Desert guide', assigned: 1 },
    { id: 'host-3', name: lang === 'ar' ? 'نورة الفهد' : 'Noura Al-Fahad', role: lang === 'ar' ? 'خبيرة قهوة' : 'Coffee expert', assigned: 1 },
  ];
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.hosts', lang)}</h2>
      {hosts.map(h => (
        <div key={h.id} className="bg-white rounded-xl border border-sand-200 p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-charcoal-900 text-sm">{h.name}</p>
            <p className="text-xs text-charcoal-500">{h.role}</p>
          </div>
          <div className="text-xs text-charcoal-400">{h.assigned} {lang === 'ar' ? 'خطة' : 'plan(s)'}</div>
        </div>
      ))}
    </div>
  );
}

// Venues Section
function VenuesSection({ lang }: { lang: 'en' | 'ar' }) {
  const venues = [
    { id: 'v1', name: lang === 'ar' ? 'حي الفن بالخبر' : 'Al Khobar Art District', area: lang === 'ar' ? 'الخبر' : 'Al Khobar', type: 'primary' },
    { id: 'v2', name: lang === 'ar' ? 'المركز الثقافي بالخبر' : 'Al Khobar Cultural Center', area: lang === 'ar' ? 'الخبر' : 'Al Khobar', type: 'fallback' },
    { id: 'v3', name: lang === 'ar' ? 'مجلس بن وتقاليد' : 'Bun & Traditions Majlis', area: lang === 'ar' ? 'الرياض' : 'Riyadh', type: 'primary' },
    { id: 'v4', name: lang === 'ar' ? 'مخيم نجوم الصحراء' : 'Desert Star Camp', area: lang === 'ar' ? 'الرياض' : 'Riyadh', type: 'primary' },
  ];
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.venues', lang)}</h2>
      {venues.map(v => (
        <div key={v.id} className="bg-white rounded-xl border border-sand-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-charcoal-900 text-sm">{v.name}</p>
              <p className="text-xs text-charcoal-500">{v.area}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.type === 'primary' ? 'bg-teal-50 text-teal-700' : 'bg-sand-100 text-charcoal-500'}`}>
              {v.type}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Requests Section
function RequestsSection({ lang, state }: { lang: 'en' | 'ar'; state: any }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.requests', lang)}</h2>
      <div className="bg-white rounded-xl border border-sand-200 p-4 text-center py-8">
        <p className="text-sm text-charcoal-400">{lang === 'ar' ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
      </div>
    </div>
  );
}

// Waitlist Section
function WaitlistSection({ lang, state }: { lang: 'en' | 'ar'; state: any }) {
  const waitlisted = state.reservations.filter((r: any) => r.state === 'waitlisted');
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.waitlist', lang)}</h2>
      {waitlisted.length > 0 ? waitlisted.map((r: any) => {
        const exp = state.experiences.find((e: any) => e.id === r.planId);
        return (
          <div key={r.id} className="bg-white rounded-xl border border-sand-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-charcoal-900 text-sm">{exp ? (lang === 'ar' ? exp.titleAr : exp.title) : r.planId}</p>
              <p className="text-xs text-charcoal-500">{lang === 'ar' ? 'في قائمة الانتظار' : 'Waiting'} • {r.createdAt.slice(0, 10)}</p>
            </div>
            <Button variant="ghost" size="sm">{lang === 'ar' ? 'عرض' : 'Offer seat'}</Button>
          </div>
        );
      }) : (
        <div className="bg-white rounded-xl border border-sand-200 p-4 text-center py-8">
          <p className="text-sm text-charcoal-400">{lang === 'ar' ? 'لا يوجد أشخاص في قائمة الانتظار' : 'No one on the waitlist'}</p>
        </div>
      )}
    </div>
  );
}

// Attendance Section
function AttendanceSection({ lang, state, onCorrect }: { lang: 'en' | 'ar'; state: any; onCorrect: () => void }) {
  const confirmed = state.reservations.filter((r: any) => ['confirmed', 'reconfirmed'].includes(r.state));
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.attendance', lang)}</h2>
      {confirmed.map((r: any) => {
        const exp = state.experiences.find((e: any) => e.id === r.planId);
        return (
          <div key={r.id} className="bg-white rounded-xl border border-sand-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-charcoal-900 text-sm">{exp ? (lang === 'ar' ? exp.titleAr : exp.title) : r.planId}</p>
                <p className="text-xs text-charcoal-500">{lang === 'ar' ? 'الحضور' : 'Attendance'}: <span className="text-amber-600">{lang === 'ar' ? 'غير معروف' : 'Unknown'}</span></p>
              </div>
              <Button variant="ghost" size="sm" onClick={onCorrect}>{t('staff.correctAttendance', lang)}</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Notifications Section
function NotificationsSection({ lang, state }: { lang: 'en' | 'ar'; state: any }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.notifications', lang)}</h2>
      {state.notifications.map((n: any) => (
        <div key={n.id} className="bg-white rounded-xl border border-sand-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-charcoal-900 text-sm">{lang === 'ar' ? n.titleAr : n.title}</p>
              <p className="text-xs text-charcoal-500">{n.createdAt.slice(0, 10)}</p>
            </div>
            <StatusBadge state={n.state === 'delivered' ? 'confirmed' : n.state === 'sent' ? 'reconfirmed' : 'expired'} size="sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Recovery Section
function RecoverySection({ lang }: { lang: 'en' | 'ar' }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.recovery', lang)}</h2>
      <div className="bg-white rounded-xl border border-sand-200 p-4 text-center py-8">
        <Wrench className="w-8 h-8 text-charcoal-300 mx-auto mb-2" />
        <p className="text-sm text-charcoal-400">{lang === 'ar' ? 'لا توجد عمليات تحتاج استرداد' : 'No operations require recovery'}</p>
      </div>
    </div>
  );
}

// Safety Section
function SafetySection({ lang }: { lang: 'en' | 'ar' }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.safetyCases', lang)}</h2>
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-terracotta-600" />
          <p className="text-xs font-medium text-terracotta-700">{lang === 'ar' ? 'وصول مقيد' : 'Restricted access'}</p>
        </div>
        <p className="text-xs text-charcoal-600">
          {lang === 'ar'
            ? 'حالات السلامة مقيدة ولا يمكن الوصول إليها إلا من قبل فريق الثقة والسلامة المعين. جميع الإجراءات مدققة.'
            : 'Safety cases are restricted and accessible only to assigned Trust & Safety staff. All actions are audited.'}
        </p>
      </div>
      <div className="bg-white rounded-xl border border-sand-200 p-4 text-center py-8">
        <p className="text-sm text-charcoal-400">{lang === 'ar' ? 'لا توجد حالات مفتوحة' : 'No open cases'}</p>
      </div>
    </div>
  );
}

// Audit Section
function AuditSection({ lang }: { lang: 'en' | 'ar' }) {
  const events = [
    { action: lang === 'ar' ? 'إنشاء خطة' : 'Plan created', actor: 'ops-1', time: '2026-01-20 14:00', resource: 'exp-1' },
    { action: lang === 'ar' ? 'تعيين مضيف' : 'Host assigned', actor: 'ops-1', time: '2026-01-20 14:05', resource: 'exp-1' },
    { action: lang === 'ar' ? 'نشر خطة' : 'Plan published', actor: 'ops-1', time: '2026-01-20 14:10', resource: 'exp-1' },
    { action: lang === 'ar' ? 'حجز مؤكد' : 'Booking confirmed', actor: 'system', time: '2026-01-20 14:15', resource: 'res-1' },
  ];
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.audit', lang)}</h2>
      <div className="space-y-2">
        {events.map((e, i) => (
          <div key={i} className="bg-white rounded-lg border border-sand-200 p-3 text-xs">
            <div className="flex justify-between">
              <span className="font-medium text-charcoal-700">{e.action}</span>
              <span className="text-charcoal-400">{e.time}</span>
            </div>
            <p className="text-charcoal-400 mt-1">{e.actor} → {e.resource}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Metrics Section
function MetricsSection({ lang, state }: { lang: 'en' | 'ar'; state: any }) {
  const totalPlans = state.experiences.length;
  const totalBookings = state.reservations.length;
  const confirmedBookings = state.reservations.filter((r: any) => ['confirmed', 'reconfirmed'].includes(r.state)).length;
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-charcoal-700">{t('staff.metrics', lang)}</h2>
      <div className="bg-white rounded-xl border border-sand-200 p-4">
        <p className="text-xs text-charcoal-400 mb-3">{lang === 'ar' ? 'مقاييس تجريبية — ليست للإنتاج' : 'Pilot metrics — not for production'}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-charcoal-900">{totalPlans}</p>
            <p className="text-xs text-charcoal-500">{lang === 'ar' ? 'خطط منشورة' : 'Published plans'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal-900">{totalBookings}</p>
            <p className="text-xs text-charcoal-500">{lang === 'ar' ? 'إجمالي الحجوزات' : 'Total reservations'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-teal-600">{confirmedBookings}</p>
            <p className="text-xs text-charcoal-500">{lang === 'ar' ? 'مؤكد' : 'Confirmed'}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-charcoal-900">{totalPlans > 0 ? Math.round((confirmedBookings / Math.max(totalBookings, 1)) * 100) : 0}%</p>
            <p className="text-xs text-charcoal-500">{lang === 'ar' ? `معدل التأكيد (${confirmedBookings}/${totalBookings})` : `Confirmation rate (${confirmedBookings}/${totalBookings})`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
