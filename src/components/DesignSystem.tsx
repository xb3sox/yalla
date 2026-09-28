import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { useApp } from '../data/store';
import { t, TranslationKey } from '../i18n';
import { AlertCircle, CheckCircle, Clock, XCircle, Info, Loader2, Shield, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';

// Button
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]';
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm',
    secondary: 'bg-sand-100 text-charcoal-800 hover:bg-sand-200 active:bg-sand-300 border border-sand-200',
    ghost: 'text-teal-700 hover:bg-teal-50 active:bg-teal-100',
    danger: 'bg-terracotta-600 text-white hover:bg-terracotta-700 active:bg-terracotta-800',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm gap-1.5',
    md: 'px-5 py-3 text-base gap-2',
    lg: 'px-6 py-4 text-lg gap-2.5',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

// Status Badge
interface StatusBadgeProps {
  state: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ state, size = 'md' }: StatusBadgeProps) {
  const { state: appState } = useApp();
  const lang = appState.language;

  const statusConfig: Record<string, { color: string; icon: ReactNode; key: TranslationKey }> = {
    confirmed: { color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" />, key: 'state.confirmed' },
    reconfirmation_required: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" />, key: 'state.reconfirmationRequired' },
    reconfirmed: { color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" />, key: 'state.confirmed' },
    waitlisted: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="w-3.5 h-3.5" />, key: 'state.waitlisted' },
    offered: { color: 'bg-teal-50 text-teal-700 border-teal-200', icon: <CheckCircle className="w-3.5 h-3.5" />, key: 'state.seatOffered' },
    expired: { color: 'bg-charcoal-50 text-charcoal-500 border-charcoal-200', icon: <XCircle className="w-3.5 h-3.5" />, key: 'state.expired' },
    cancelled_by_participant: { color: 'bg-charcoal-50 text-charcoal-500 border-charcoal-200', icon: <XCircle className="w-3.5 h-3.5" />, key: 'common.cancelled' },
    cancelled_by_yalla: { color: 'bg-charcoal-50 text-charcoal-500 border-charcoal-200', icon: <XCircle className="w-3.5 h-3.5" />, key: 'common.cancelled' },
    payment_pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="w-3.5 h-3.5" />, key: 'common.pending' },
    published: { color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" />, key: 'state.available' },
    full: { color: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200', icon: <XCircle className="w-3.5 h-3.5" />, key: 'state.full' },
  };

  const config = statusConfig[state] || { color: 'bg-charcoal-50 text-charcoal-600 border-charcoal-200', icon: <Info className="w-3.5 h-3.5" />, key: 'common.pending' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${config.color} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}>
      {config.icon}
      {t(config.key, lang)}
    </span>
  );
}

// Experience Card
interface ExperienceCardProps {
  experience: {
    id: string;
    title: string;
    titleAr: string;
    date: string;
    time: string;
    duration: string;
    area: string;
    areaAr: string;
    price: number;
    currency: string;
    capacity: number;
    booked: number;
    groupSizeMin: number;
    groupSizeMax: number;
    accessibility: string;
    accessibilityAr: string;
  };
  onPress: () => void;
}

export function ExperienceCard({ experience, onPress }: ExperienceCardProps) {
  const { state } = useApp();
  const lang = state.language;
  const spotsLeft = experience.capacity - experience.booked;
  const isFull = spotsLeft <= 0;

  const gradients = [
    'from-teal-600/80 to-teal-800/90',
    'from-amber-600/80 to-amber-800/90',
    'from-indigo-600/80 to-indigo-800/90',
  ];
  const gradientIndex = parseInt(experience.id.replace('exp-', '')) % 3;

  return (
    <button
      onClick={onPress}
      className="group w-full text-start rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
      aria-label={lang === 'ar' ? experience.titleAr : experience.title}
    >
      {/* Image placeholder with gradient */}
      <div className={`relative h-48 bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative text-white text-center px-6">
          <p className="text-3xl mb-2">{experience.id === 'exp-1' ? '🎨' : experience.id === 'exp-2' ? '☕' : '✨'}</p>
          <h3 className="text-xl font-semibold">{lang === 'ar' ? experience.titleAr : experience.title}</h3>
        </div>
        {isFull && (
          <div className="absolute top-3 end-3 bg-charcoal-900/80 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {t('explore.full', lang)}
          </div>
        )}
        {!isFull && (
          <div className="absolute top-3 end-3 bg-white/90 text-teal-700 text-xs font-medium px-2.5 py-1 rounded-full">
            {t('explore.spotsLeft', lang, { count: spotsLeft })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 text-sm text-charcoal-500 mb-3">
          <span>{experience.date}</span>
          <span>•</span>
          <span>{experience.time}</span>
          <span>•</span>
          <span>{experience.duration}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-charcoal-600 mb-2">
          <span className="text-charcoal-400">📍</span>
          <span>{lang === 'ar' ? experience.areaAr : experience.area}</span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xs text-charcoal-400 mb-0.5">{t('explore.expectedPrice', lang)}</p>
            <p className="text-lg font-semibold text-charcoal-900">{experience.price} {t('common.sar', lang)}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-charcoal-400">
            <span>{experience.groupSizeMin}–{experience.groupSizeMax}</span>
            <span>{t('common.people', lang)}</span>
          </div>
        </div>

        {experience.accessibility && (
          <div className="mt-3 pt-3 border-t border-sand-100">
            <p className="text-xs text-charcoal-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {lang === 'ar' ? experience.accessibilityAr.slice(0, 60) + '...' : experience.accessibility.slice(0, 60) + '...'}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// Status Panel - answers: Do I have a place? Action required? Deadline?
interface StatusPanelProps {
  reservationState: string;
  expiryAt?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function StatusPanel({ reservationState, expiryAt, onAction, actionLabel }: StatusPanelProps) {
  const { state } = useApp();
  const lang = state.language;

  const panels: Record<string, { hasPlace: string; actionRequired: string; deadline?: string; next: string; color: string }> = {
    confirmed: {
      hasPlace: t('common.yes', lang),
      actionRequired: t('common.noActionRequired', lang),
      next: lang === 'ar' ? 'ستتلقى تفاصيل الوصول قبل التجربة.' : 'You\'ll receive arrival details before the experience.',
      color: 'border-green-200 bg-green-50',
    },
    reconfirmation_required: {
      hasPlace: t('common.yes', lang),
      actionRequired: t('common.actionRequired', lang),
      deadline: expiryAt,
      next: lang === 'ar' ? 'أكد حضورك قبل الموعد النهائي.' : 'Reconfirm before the deadline to keep your place.',
      color: 'border-amber-200 bg-amber-50',
    },
    waitlisted: {
      hasPlace: lang === 'ar' ? 'لا — في قائمة الانتظار' : 'No — on waitlist',
      actionRequired: t('common.noActionRequired', lang),
      next: lang === 'ar' ? 'سنُعلمك إذا توفر مكان.' : 'We\'ll notify you if a spot opens.',
      color: 'border-blue-200 bg-blue-50',
    },
    reconfirmed: {
      hasPlace: t('common.yes', lang),
      actionRequired: t('common.noActionRequired', lang),
      next: lang === 'ar' ? 'أنت مؤكد. استعد للتجربة!' : 'You\'re confirmed. Get ready!',
      color: 'border-green-200 bg-green-50',
    },
    cancelled_by_participant: {
      hasPlace: lang === 'ar' ? 'لا — ملغي' : 'No — cancelled',
      actionRequired: '',
      next: lang === 'ar' ? 'استكشف تجارب جديدة.' : 'Explore new experiences.',
      color: 'border-charcoal-200 bg-charcoal-50',
    },
  };

  const panel = panels[reservationState] || panels.confirmed;

  return (
    <div className={`rounded-xl border p-4 ${panel.color}`} role="status" aria-live="polite">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-charcoal-700">{t('common.doIHaveAPlace', lang)}</span>
          <span className="text-sm font-semibold">{panel.hasPlace}</span>
        </div>
        {panel.actionRequired && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal-600">{t('common.actionRequired', lang)}</span>
            <span className="text-sm font-medium text-amber-700">{panel.actionRequired}</span>
          </div>
        )}
        {panel.deadline && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-charcoal-600">{t('common.deadline', lang)}</span>
            <span className="text-sm font-medium">{new Date(panel.deadline).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-charcoal-600">{t('common.whatHappensNext', lang)}</span>
        </div>
        <p className="text-sm text-charcoal-700">{panel.next}</p>
      </div>
      {onAction && actionLabel && (
        <Button variant="primary" size="sm" className="mt-3 w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Material Change Banner
interface MaterialChangeBannerProps {
  changes: { field: string; fieldAr: string; oldValue: string; newValue: string }[];
  onAccept: () => void;
}

export function MaterialChangeBanner({ changes, onAccept }: MaterialChangeBannerProps) {
  const { state } = useApp();
  const lang = state.language;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" role="alert">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-amber-800">{lang === 'ar' ? 'تغييرات مهمة' : 'Material changes'}</h3>
      </div>
      <div className="space-y-2 mb-4">
        {changes.map((change, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-charcoal-700">{lang === 'ar' ? change.fieldAr : change.field}:</span>
            <span className="line-through text-charcoal-400 mx-2">{change.oldValue}</span>
            <span className="text-teal-700 font-medium">{change.newValue}</span>
          </div>
        ))}
      </div>
      <Button variant="primary" size="sm" onClick={onAccept} className="w-full">
        {lang === 'ar' ? 'قبول التغييرات' : 'Accept changes'}
      </Button>
    </div>
  );
}

// Error Summary
interface ErrorSummaryProps {
  errors: { field: string; message: string }[];
}

export function ErrorSummary({ errors }: ErrorSummaryProps) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4" role="alert" aria-live="assertive">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-800">
          {errors.length === 1 ? '1 error' : `${errors.length} errors`}
        </h3>
      </div>
      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
        {errors.map((err, i) => (
          <li key={i}><a href={`#${err.field}`} className="underline">{err.message}</a></li>
        ))}
      </ul>
    </div>
  );
}

// Form Controls
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-charcoal-700">{label}</label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-charcoal-900 placeholder:text-charcoal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[44px] ${error ? 'border-red-300' : 'border-sand-200'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="text-sm text-red-600" role="alert">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-charcoal-400">{hint}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, id, ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-charcoal-700">{label}</label>
      <select
        id={selectId}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-charcoal-900 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[44px] ${error ? 'border-red-300' : 'border-sand-200'}`}
        aria-invalid={!!error}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, ...props }: TextareaProps) {
  const textareaId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="block text-sm font-medium text-charcoal-700">{label}</label>
      <textarea
        id={textareaId}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-charcoal-900 placeholder:text-charcoal-300 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[100px] resize-y ${error ? 'border-red-300' : 'border-sand-200'}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

// Confirmation Dialog
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-charcoal-900 mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        {actions && <div className="flex gap-3 justify-end">{actions}</div>}
      </div>
    </div>
  );
}

// Loading Skeleton
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-sand-100 rounded-lg ${className}`} />;
}

// Empty State
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-charcoal-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-charcoal-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-charcoal-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// Permission Denied
export function PermissionDenied() {
  const { state } = useApp();
  const lang = state.language;
  return (
    <EmptyState
      icon={<Shield className="w-12 h-12" />}
      title={t('error.permissionDenied', lang)}
      description={t('error.permissionDeniedText', lang)}
    />
  );
}

// Recovery Panel
interface RecoveryPanelProps {
  title: string;
  description: string;
  onRetry?: () => void;
  onContact?: () => void;
}

export function RecoveryPanel({ title, description, onRetry, onContact }: RecoveryPanelProps) {
  const { state } = useApp();
  const lang = state.language;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
      <h3 className="font-semibold text-charcoal-800 mb-2">{title}</h3>
      <p className="text-sm text-charcoal-600 mb-4">{description}</p>
      <div className="flex gap-3 justify-center">
        {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>{t('common.retry', lang)}</Button>}
        {onContact && <Button variant="primary" size="sm" onClick={onContact}>{t('support.operationalHelp', lang)}</Button>}
      </div>
    </div>
  );
}

// Price Summary
interface PriceSummaryProps {
  price: number;
  currency: string;
  included: string[];
  excluded: string[];
}

export function PriceSummary({ price, currency, included, excluded }: PriceSummaryProps) {
  const { state } = useApp();
  const lang = state.language;
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-charcoal-600">{t('details.expectedPrice', lang)}</span>
        <span className="text-xl font-bold text-charcoal-900">{price} {t('common.sar', lang)}</span>
      </div>
      <div className="pt-2 border-t border-sand-100">
        <p className="text-xs font-medium text-charcoal-500 mb-1.5">{t('details.included', lang)}</p>
        <ul className="text-xs text-charcoal-600 space-y-1">
          {included.map((item, i) => <li key={i} className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-green-500" />{item}</li>)}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium text-charcoal-500 mb-1.5">{t('details.excluded', lang)}</p>
        <ul className="text-xs text-charcoal-600 space-y-1">
          {excluded.map((item, i) => <li key={i} className="flex items-center gap-1.5"><XCircle className="w-3 h-3 text-charcoal-300" />{item}</li>)}
        </ul>
      </div>
      <p className="text-[10px] text-charcoal-400 pt-2 border-t border-sand-100">{t('booking.syntheticLabel', lang)}</p>
    </div>
  );
}

// Timeline
interface TimelineProps {
  items: { time: string; activity: string; activityAr: string }[];
}

export function Timeline({ items }: TimelineProps) {
  const { state } = useApp();
  const lang = state.language;
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-teal-500 mt-1.5" />
            {i < items.length - 1 && <div className="w-0.5 flex-1 bg-sand-200 my-1" />}
          </div>
          <div className="pb-4">
            <p className="text-xs font-medium text-teal-600">{item.time}</p>
            <p className="text-sm text-charcoal-700">{lang === 'ar' ? item.activityAr : item.activity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Arrival Action Button
interface ArrivalActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function ArrivalAction({ icon, label, onClick, variant = 'secondary' }: ArrivalActionProps) {
  return (
    <Button variant={variant} size="md" className="w-full justify-start gap-3" onClick={onClick}>
      {icon}
      <span>{label}</span>
      <ChevronRight className="w-4 h-4 ms-auto flip-rtl" />
    </Button>
  );
}

// Directional Chevron (RTL-aware)
export function DirChevron({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  const { state } = useApp();
  const isRtl = state.language === 'ar';
  const showRight = (direction === 'right' && !isRtl) || (direction === 'left' && isRtl);
  return showRight ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />;
}

// Synthetic Payment Label
export function SyntheticPaymentLabel() {
  const { state } = useApp();
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-charcoal-400 bg-charcoal-50 rounded-full px-2 py-0.5 w-fit">
      <AlertCircle className="w-3 h-3" />
      {t('common.syntheticPayment', state.language)}
    </div>
  );
}
