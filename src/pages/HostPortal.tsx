import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../data/store';
import { t } from '../i18n';
import { api } from '../services/api';
import {
  Users,
  Star,
  DollarSign,
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Check,
  CreditCard,
} from 'lucide-react';

export function HostPortalPage({ onBack }: { onBack?: () => void }) {
  const { state } = useApp();
  const lang = state.language;

  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'attendees' | 'payouts'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary & Data State
  const [summary, setSummary] = useState<{
    overallRating: number;
    totalEarnings: number;
    upcomingSessions: number;
    totalAttendeesServed: number;
  }>({
    overallRating: 5.0,
    totalEarnings: 0,
    upcomingSessions: 0,
    totalAttendeesServed: 0,
  });

  const [experiences, setExperiences] = useState<any[]>([]);
  const [payoutsData, setPayoutsData] = useState<{
    pendingBalance: number;
    totalPaidOut: number;
    payouts: any[];
  }>({
    pendingBalance: 0,
    totalPaidOut: 0,
    payouts: [],
  });

  // Schedule Modal / Form State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: '',
    title_ar: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:00',
    price: 150,
    capacity: 8,
  });

  // Roster / Attendees State
  const [selectedExperienceId, setSelectedExperienceId] = useState<string>('');
  const [roster, setRoster] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [checkInMessage, setCheckInMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Capacity Adjustment Error Message
  const [capacityError, setCapacityError] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    loadHostData();
  }, []);

  const loadHostData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, expRes, payRes] = await Promise.all([
        api.host.getSummary().catch(() => ({ success: false, data: null })),
        api.host.getExperiences().catch(() => ({ success: false, data: [] })),
        api.host.getPayouts().catch(() => ({ success: false, data: null })),
      ]);

      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (expRes.success && Array.isArray(expRes.data)) {
        setExperiences(expRes.data);
        if (expRes.data.length > 0) {
          setSelectedExperienceId(expRes.data[0].id);
        }
      }
      if (payRes.success && payRes.data) {
        setPayoutsData(payRes.data);
      }
    } catch (err: any) {
      setError(err.message || t('common.error', lang));
    } finally {
      setLoading(false);
    }
  };

  // Load roster when selected experience changes
  useEffect(() => {
    if (selectedExperienceId) {
      loadRoster(selectedExperienceId);
    }
  }, [selectedExperienceId]);

  const loadRoster = async (expId: string) => {
    try {
      const res = await api.host.getRoster(expId);
      if (res.success && Array.isArray(res.data)) {
        setRoster(res.data);
      } else {
        setRoster([]);
      }
    } catch {
      setRoster([]);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.host.scheduleSession(newSession);
      if (res.success) {
        setShowScheduleModal(false);
        setNewSession({
          title: '',
          title_ar: '',
          date: new Date().toISOString().split('T')[0],
          time: '18:00',
          price: 150,
          capacity: 8,
        });
        await loadHostData();
      } else {
        setError(res.error?.message || 'Failed to schedule session');
      }
    } catch (err: any) {
      setError(err.message || 'Error scheduling session');
    }
  };

  const handleCapacityChange = async (expId: string, newCap: number) => {
    setCapacityError(null);
    try {
      const res = await api.host.patchSession(expId, { capacity: newCap });
      if (res.success) {
        setExperiences((prev) =>
          prev.map((e) => (e.id === expId ? { ...e, capacity: newCap } : e))
        );
      } else {
        const msg = res.error?.message || t('host.capacityError', lang);
        setCapacityError({ id: expId, text: msg });
      }
    } catch (err: any) {
      setCapacityError({ id: expId, text: err.message || t('host.capacityError', lang) });
    }
  };

  const handleCancelSession = async (expId: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت تأكد من إلغاء هذه الجلسة؟' : 'Are you sure you want to cancel this session?')) {
      return;
    }
    try {
      const res = await api.host.patchSession(expId, { plan_state: 'cancelled' });
      if (res.success) {
        setExperiences((prev) =>
          prev.map((e) => (e.id === expId ? { ...e, planState: 'cancelled', plan_state: 'cancelled' } : e))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Error cancelling session');
    }
  };

  const handleCheckInPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput || !selectedExperienceId) return;

    setCheckInMessage(null);
    try {
      const res = await api.host.verifyPin(selectedExperienceId, pinInput);
      if (res.success) {
        setCheckInMessage({
          type: 'success',
          text: t('host.checkInSuccess', lang),
        });
        setPinInput('');
        await loadRoster(selectedExperienceId);
      } else {
        setCheckInMessage({
          type: 'error',
          text: res.error?.message || (lang === 'ar' ? 'رمز تحقق غير صحيح' : 'Invalid PIN'),
        });
      }
    } catch (err: any) {
      setCheckInMessage({
        type: 'error',
        text: err.message || (lang === 'ar' ? 'رمز تحقق غير صحيح' : 'Invalid PIN'),
      });
    }
  };

  const filteredRoster = useMemo(() => {
    if (!searchTerm) return roster;
    const term = searchTerm.toLowerCase();
    return roster.filter(
      (r) =>
        (r.participantName && r.participantName.toLowerCase().includes(term)) ||
        (r.id && r.id.toLowerCase().includes(term)) ||
        (r.pin && r.pin.toLowerCase().includes(term))
    );
  }, [roster, searchTerm]);

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4" />
        <p className="text-text-secondary">{t('common.loading', lang)}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto pb-24" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-sunken rounded-full transition-colors"
              aria-label={t('common.back', lang)}
            >
              <ArrowLeft className="w-5 h-5 rtl:rotate-180 text-text-secondary" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{t('host.title', lang)}</h1>
            <p className="text-xs text-text-secondary">
              {lang === 'ar'
                ? 'إدارة جدول المواعيد، السعة، والحضور والأرباح المباشرة'
                : 'Self-service dashboard for experience slot management and earnings'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('host.scheduleSession', lang)}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-accent-50 text-accent-700 border border-accent-200 rounded-xl flex items-center gap-2 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-2 rtl:space-x-reverse overflow-x-auto">
        <TabButton
          label={t('host.overview', lang)}
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          label={t('host.calendar', lang)}
          active={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
        />
        <TabButton
          label={t('host.attendees', lang)}
          active={activeTab === 'attendees'}
          onClick={() => setActiveTab('attendees')}
        />
        <TabButton
          label={t('host.payouts', lang)}
          active={activeTab === 'payouts'}
          onClick={() => setActiveTab('payouts')}
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Users className="w-5 h-5 text-brand-600" />}
              title={t('host.totalAttendees', lang)}
              value={summary.totalAttendeesServed}
            />
            <MetricCard
              icon={<Star className="w-5 h-5 text-amber-500" />}
              title={t('host.averageRating', lang)}
              value={`${summary.overallRating} / 5.0`}
            />
            <MetricCard
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              title={t('host.totalEarnings', lang)}
              value={`${summary.totalEarnings} ${t('common.sar', lang)}`}
            />
            <MetricCard
              icon={<CalendarIcon className="w-5 h-5 text-blue-600" />}
              title={t('host.upcomingSessions', lang)}
              value={summary.upcomingSessions}
            />
          </div>

          <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">{t('host.upcomingSessions', lang)}</h2>
            {experiences.filter((e) => (e.planState || e.plan_state) !== 'cancelled').length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-6">
                {lang === 'ar' ? 'لا توجد جلسات قادمة بعد.' : 'No upcoming experience sessions scheduled yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {experiences
                  .filter((e) => (e.planState || e.plan_state) !== 'cancelled')
                  .slice(0, 5)
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 bg-surface-sunken/50 border border-border rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-text-primary">
                          {lang === 'ar' ? exp.title_ar || exp.title : exp.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {exp.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exp.time}
                          </span>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
                          {exp.booked || 0} / {exp.capacity} {t('common.people', lang)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar & Slots Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">{t('host.calendar', lang)}</h2>
              <span className="text-xs text-text-tertiary">
                {experiences.length} {lang === 'ar' ? 'جلسات' : 'sessions total'}
              </span>
            </div>

            <div className="space-y-4">
              {experiences.map((exp) => {
                const booked = exp.booked || 0;
                const capacity = exp.capacity || 1;
                const percent = Math.min(100, Math.round((booked / capacity) * 100));
                const isCancelled = (exp.planState || exp.plan_state) === 'cancelled';

                return (
                  <div
                    key={exp.id}
                    className={`p-4 border rounded-xl space-y-3 transition-colors ${
                      isCancelled ? 'bg-surface-sunken/40 border-border opacity-60' : 'bg-surface-raised border-border hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary text-base">
                            {lang === 'ar' ? exp.title_ar || exp.title : exp.title}
                          </h3>
                          {isCancelled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-100 text-accent-700">
                              {t('common.cancelled', lang)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                          <span>{exp.date}</span>
                          <span>•</span>
                          <span>{exp.time}</span>
                          <span>•</span>
                          <span>{exp.price} {t('common.sar', lang)}</span>
                        </div>
                      </div>

                      {!isCancelled && (
                        <button
                          onClick={() => handleCancelSession(exp.id)}
                          className="text-xs text-accent-600 hover:text-accent-800 font-medium px-2 py-1 rounded hover:bg-accent-50"
                        >
                          {t('host.cancelSession', lang)}
                        </button>
                      )}
                    </div>

                    {/* Seat Utilization Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-text-secondary">
                        <span>
                          {t('host.seatUtilization', lang, { booked, capacity })}
                        </span>
                        <span className="font-medium">{percent}%</span>
                      </div>
                      <div className="w-full bg-surface-sunken h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent >= 100 ? 'bg-accent-500' : percent >= 75 ? 'bg-amber-500' : 'bg-brand-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Capacity Adjustment */}
                    {!isCancelled && (
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <label className="text-text-secondary font-medium flex items-center gap-2">
                          <span>{t('host.capacity', lang)}:</span>
                          <input
                            type="number"
                            min={booked}
                            value={capacity}
                            onChange={(e) => handleCapacityChange(exp.id, parseInt(e.target.value, 10))}
                            className="w-16 px-2 py-1 bg-surface-sunken border border-border rounded text-center font-medium focus:outline-none focus:border-brand-500"
                          />
                        </label>

                        {capacityError?.id === exp.id && capacityError && (
                          <span className="text-accent-600 font-medium text-[11px]">
                            {capacityError.text}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Attendees Roster & PIN Check-in Tab */}
      {activeTab === 'attendees' && (
        <div className="space-y-6">
          {/* PIN Check-in Card */}
          <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">{t('host.checkInPin', lang)}</h2>
            <form onSubmit={handleCheckInPin} className="flex gap-3">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'أدخل الرمز المكون من 6 خانات...' : 'Enter 6-character PIN or UUID prefix...'}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-surface-sunken border border-border rounded-xl text-sm focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-brand-500 text-white font-medium rounded-xl text-sm hover:bg-brand-600 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{t('host.checkInBtn', lang)}</span>
              </button>
            </form>

            {checkInMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  checkInMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-accent-50 text-accent-700 border border-accent-200'
                }`}
              >
                {checkInMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{checkInMessage.text}</span>
              </div>
            )}
          </div>

          {/* Roster Table */}
          <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-text-primary">{t('host.attendees', lang)}</h2>

              {/* Experience Selector */}
              <select
                value={selectedExperienceId}
                onChange={(e) => setSelectedExperienceId(e.target.value)}
                className="px-3 py-1.5 bg-surface-sunken border border-border rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-brand-500"
              >
                {experiences.map((e) => (
                  <option key={e.id} value={e.id}>
                    {lang === 'ar' ? e.title_ar || e.title : e.title} ({e.date})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute start-3 top-2.5 text-text-tertiary" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث بالحساب أو الاسم...' : 'Search attendees by name or ID...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full ps-9 pe-4 py-2 bg-surface-sunken border border-border rounded-xl text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* List */}
            {filteredRoster.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">
                {lang === 'ar' ? 'لا يوجد حجووزات لهذه الجلسة.' : 'No confirmed reservations found for this session.'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredRoster.map((resItem) => {
                  const isCheckedIn = resItem.state === 'checked_in' || resItem.state === 'attended';
                  return (
                    <div
                      key={resItem.id}
                      className="p-3 bg-surface-sunken/40 border border-border rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-text-primary block">
                          {resItem.participantName || `Participant (${resItem.participantId?.substring(0, 8) || 'user'})`}
                        </span>
                        <span className="text-text-tertiary block font-mono text-[10px]">
                          PIN: {resItem.pin || resItem.id?.substring(0, 8)}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isCheckedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isCheckedIn
                          ? lang === 'ar'
                            ? 'تم الحضور'
                            : 'Checked In'
                          : lang === 'ar'
                          ? 'مؤكد'
                          : 'Confirmed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earnings & Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
              title={t('host.totalPaidOut', lang)}
              value={`${payoutsData.totalPaidOut} ${t('common.sar', lang)}`}
            />
            <MetricCard
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              title={t('host.pendingBalance', lang)}
              value={`${payoutsData.pendingBalance} ${t('common.sar', lang)}`}
            />
          </div>

          <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">{t('host.payouts', lang)}</h2>
            {payoutsData.payouts.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-6">
                {lang === 'ar' ? 'لا توجد تحويلات سابقة حتى الآن.' : 'No completed payout transactions yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {payoutsData.payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-surface-sunken/40 border border-border rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <h3 className="font-semibold text-text-primary text-sm">
                        {lang === 'ar' ? p.sessionTitleAr || p.sessionTitle : p.sessionTitle}
                      </h3>
                      <div className="text-text-secondary mt-1 space-x-2 rtl:space-x-reverse">
                        <span>{p.date}</span>
                        <span>•</span>
                        <span>{p.attendees} {t('common.people', lang)}</span>
                        <span>•</span>
                        <span>Fee: {p.platformFee} SAR (15%)</span>
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="font-bold text-emerald-600 text-sm block">
                        +{p.netPayout} {t('common.sar', lang)}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                        Stripe Transferred
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-raised border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-text-primary">{t('host.scheduleSession', lang)}</h2>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label htmlFor="sessionTitle" className="block text-text-secondary font-medium mb-1">{t('host.sessionTitle', lang)}</label>
                <input
                  id="sessionTitle"
                  type="text"
                  required
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label htmlFor="sessionTitleAr" className="block text-text-secondary font-medium mb-1">{t('host.sessionTitleAr', lang)}</label>
                <input
                  id="sessionTitleAr"
                  type="text"
                  value={newSession.title_ar}
                  onChange={(e) => setNewSession({ ...newSession, title_ar: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">{t('host.date', lang)}</label>
                  <input
                    type="date"
                    required
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">{t('host.time', lang)}</label>
                  <input
                    type="time"
                    required
                    value={newSession.time}
                    onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-medium mb-1">{t('host.price', lang)}</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newSession.price}
                    onChange={(e) => setNewSession({ ...newSession, price: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-medium mb-1">{t('host.capacity', lang)}</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newSession.capacity}
                    onChange={(e) => setNewSession({ ...newSession, capacity: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-surface-sunken border border-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-surface-sunken text-text-secondary font-medium rounded-xl hover:bg-border transition-colors"
                >
                  {t('common.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 transition-colors"
                >
                  {t('common.save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-brand-500 text-brand-600 font-semibold'
          : 'border-transparent text-text-tertiary hover:text-text-secondary'
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return (
    <div className="bg-surface-raised border border-border rounded-2xl p-4 space-y-2 shadow-xs">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-text-secondary font-medium">{title}</span>
      </div>
      <p className="text-xl font-bold text-text-primary tracking-tight">{value}</p>
    </div>
  );
}
