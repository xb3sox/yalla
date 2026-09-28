import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useEffect, useRef } from 'react';
import { useApp } from '../data/store';
import { t, TranslationKey } from '../i18n';
import { CheckCircle, Clock, XCircle, Info, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

/* ═══════════════════════════════════════════
   BUTTON
   Clear hierarchy: primary > secondary > ghost > danger
   ═══════════════════════════════════════════ */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-40 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
    secondary: 'bg-surface-raised text-text-primary border border-border hover:bg-surface-sunken active:bg-border',
    ghost: 'text-brand-600 hover:bg-brand-50 active:bg-brand-100',
    danger: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-700',
  };
  const sizes = {
    sm: 'px-3.5 py-2 text-sm gap-1.5 rounded-lg min-h-[36px]',
    md: 'px-5 py-2.5 text-[15px] gap-2 rounded-xl min-h-[44px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 rounded-xl min-h-[52px]',
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════
   STATUS BADGE
   Minimal, semantic, icon + text (never color alone)
   ═══════════════════════════════════════════ */

interface StatusBadgeProps {
  state: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ state, size = 'md' }: StatusBadgeProps) {
  const { state: appState } = useApp();
  const lang = appState.language;

  const config: Record<string, { bg: string; text: string; icon: ReactNode; key: TranslationKey }> = {
    confirmed:        { bg: 'bg-success-bg', text: 'text-success', icon: <CheckCircle className="w-3 h-3" />, key: 'state.confirmed' },
    reconfirmed:      { bg: 'bg-success-bg', text: 'text-success', icon: <CheckCircle className="w-3 h-3" />, key: 'state.confirmed' },
    reconfirmation_required: { bg: 'bg-warning-bg', text: 'text-warning', icon: <Clock className="w-3 h-3" />, key: 'state.reconfirmationRequired' },
    waitlisted:       { bg: 'bg-info-bg', text: 'text-info', icon: <Clock className="w-3 h-3" />, key: 'state.waitlisted' },
    offered:          { bg: 'bg-brand-50', text: 'text-brand-600', icon: <CheckCircle className="w-3 h-3" />, key: 'state.seatOffered' },
    expired:          { bg: 'bg-surface-sunken', text: 'text-text-tertiary', icon: <XCircle className="w-3 h-3" />, key: 'state.expired' },
    cancelled_by_participant: { bg: 'bg-surface-sunken', text: 'text-text-tertiary', icon: <XCircle className="w-3 h-3" />, key: 'common.cancelled' },
    cancelled_by_yalla: { bg: 'bg-surface-sunken', text: 'text-text-tertiary', icon: <XCircle className="w-3 h-3" />, key: 'common.cancelled' },
    payment_pending:  { bg: 'bg-warning-bg', text: 'text-warning', icon: <Clock className="w-3 h-3" />, key: 'common.pending' },
    published:        { bg: 'bg-success-bg', text: 'text-success', icon: <CheckCircle className="w-3 h-3" />, key: 'state.available' },
    full:             { bg: 'bg-accent-50', text: 'text-accent-600', icon: <XCircle className="w-3 h-3" />, key: 'state.full' },
    sent:             { bg: 'bg-info-bg', text: 'text-info', icon: <Info className="w-3 h-3" />, key: 'common.pending' },
    delivered:        { bg: 'bg-success-bg', text: 'text-success', icon: <CheckCircle className="w-3 h-3" />, key: 'state.confirmed' },
  };

  const c = config[state] || { bg: 'bg-surface-sunken', text: 'text-text-tertiary', icon: <Info className="w-3 h-3" />, key: 'common.pending' };
  const sz = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${c.bg} ${c.text} ${sz}`}>
      <span aria-hidden="true">{c.icon}</span>
      {t(c.key, lang)}
    </span>
  );
}

/* ═══════════════════════════════════════════
   EXPERIENCE CARD
   Clean, image-first, minimal metadata
   ═══════════════════════════════════════════ */

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
    imageUrl: string;
  };
  onPress: () => void;
}

export function ExperienceCard({ experience, onPress }: ExperienceCardProps) {
  const { state } = useApp();
  const lang = state.language;
  const spotsLeft = experience.capacity - experience.booked;
  const isFull = spotsLeft <= 0;

  return (
    <button
      onClick={onPress}
      className="group w-full text-start rounded-2xl overflow-hidden bg-surface-raised shadow-xs hover:shadow-sm transition-shadow duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      aria-label={lang === 'ar' ? experience.titleAr : experience.title}
    >
      {/* Visual */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={experience.imageUrl}
          alt={lang === 'ar' ? experience.titleAr : experience.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-3 end-3 flex gap-2">
          {isFull ? (
            <span className="bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              {t('explore.full', lang)}
            </span>
          ) : (
            <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              {t('explore.spotsLeft', lang, { count: spotsLeft })}
            </span>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <FavoriteButton experienceId={experience.id} size="sm" />
          </div>
        </div>
        <h3 className="absolute bottom-4 start-4 end-4 text-white text-lg font-semibold leading-tight drop-shadow-md">
          {lang === 'ar' ? experience.titleAr : experience.title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Key info — single line */}
        <p className="text-sm text-text-secondary">
          {experience.date} · {experience.time} · {lang === 'ar' ? experience.areaAr : experience.area}
        </p>

        {/* Price and group */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-lg font-semibold text-text-primary tabular-nums">{experience.price}</span>
            <span className="text-sm text-text-secondary ms-1">{t('common.sar', lang)}</span>
          </div>
          <span className="text-xs text-text-tertiary">
            {experience.groupSizeMin}–{experience.groupSizeMax} {t('common.people', lang)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   STATUS PANEL
   Answers three questions directly
   ═══════════════════════════════════════════ */

interface StatusPanelProps {
  reservationState: string;
  expiryAt?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function StatusPanel({ reservationState, expiryAt, onAction, actionLabel }: StatusPanelProps) {
  const { state } = useApp();
  const lang = state.language;

  interface PanelData { headline: string; detail: string; tone: 'success' | 'warning' | 'neutral'; deadline?: string; }

  const panels: Record<string, PanelData> = {
    confirmed: {
      headline: lang === 'ar' ? 'مكانك مؤكد' : 'Your place is confirmed',
      detail: lang === 'ar' ? 'ستتلقى تفاصيل الوصول قبل التجربة.' : 'You\'ll receive arrival details before the experience.',
      tone: 'success',
    },
    reconfirmed: {
      headline: lang === 'ar' ? 'مكانك مؤكد' : 'Your place is confirmed',
      detail: lang === 'ar' ? 'أنت جاهز. استعد للتجربة!' : 'You\'re all set. Get ready!',
      tone: 'success',
    },
    reconfirmation_required: {
      headline: lang === 'ar' ? 'إعادة التأكيد مطلوبة' : 'Reconfirmation required',
      detail: lang === 'ar' ? 'أكد حضورك قبل الموعد النهائي للحفاظ على مكانك.' : 'Reconfirm before the deadline to keep your place.',
      tone: 'warning',
      deadline: expiryAt,
    },
    waitlisted: {
      headline: lang === 'ar' ? 'في قائمة الانتظار' : 'On the waitlist',
      detail: lang === 'ar' ? 'سنُعلمك فور توفر مكان.' : 'We\'ll notify you as soon as a spot opens.',
      tone: 'neutral',
    },
    cancelled_by_participant: {
      headline: lang === 'ar' ? 'ملغي' : 'Cancelled',
      detail: lang === 'ar' ? 'استكشف تجارب جديدة.' : 'Explore new experiences.',
      tone: 'neutral',
    },
  };

  const panel = panels[reservationState] || panels.confirmed;

  const toneStyles = {
    success: 'bg-success-bg border-success/20',
    warning: 'bg-warning-bg border-warning/20',
    neutral: 'bg-surface-sunken border-border',
  };

  return (
    <div className={`rounded-xl border p-4 ${toneStyles[panel.tone]}`} role="status" aria-live="polite">
      <p className="text-sm font-semibold text-text-primary">{panel.headline}</p>
      <p className="text-sm text-text-secondary mt-1">{panel.detail}</p>
      {panel.deadline && (
        <p className="text-xs text-text-tertiary mt-2">
          {t('common.deadline', lang)}: {new Date(panel.deadline).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })}
        </p>
      )}
      {onAction && actionLabel && (
        <Button variant="primary" size="sm" className="mt-3 w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MATERIAL CHANGE BANNER
   ═══════════════════════════════════════════ */

interface MaterialChangeBannerProps {
  changes: { field: string; fieldAr: string; oldValue: string; newValue: string }[];
  onAccept: () => void;
}

export function MaterialChangeBanner({ changes, onAccept }: MaterialChangeBannerProps) {
  const { state } = useApp();
  const lang = state.language;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning-bg p-4" role="alert">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text-primary">{lang === 'ar' ? 'تغييرات مهمة' : 'Important changes'}</h3>
      </div>
      <div className="space-y-1.5 mb-4">
        {changes.map((change, i) => (
          <p key={i} className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{lang === 'ar' ? change.fieldAr : change.field}: </span>
            <span className="line-through text-text-tertiary">{change.oldValue}</span>
            <span className="mx-1.5 text-text-tertiary">→</span>
            <span className="font-medium text-text-primary">{change.newValue}</span>
          </p>
        ))}
      </div>
      <Button variant="primary" size="sm" onClick={onAccept} className="w-full">
        {lang === 'ar' ? 'قبول التغييرات' : 'Accept changes'}
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   FORM CONTROLS
   ═══════════════════════════════════════════ */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">{label}</label>
      <input
        id={inputId}
        className={`w-full px-4 py-3 rounded-xl bg-surface-raised border text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 min-h-[44px] ${error ? 'border-error' : 'border-border'} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="text-sm text-error" role="alert">{error}</p>}
      {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">{hint}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function Select({ label, options, error, id, className = '', ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="block text-sm font-medium text-text-primary">{label}</label>
      <select
        id={selectId}
        className={`w-full px-4 py-3 rounded-xl bg-surface-raised border text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 min-h-[44px] appearance-none ${error ? 'border-error' : 'border-border'} ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || label.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="space-y-1.5">
      <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary">{label}</label>
      <textarea
        id={textareaId}
        className={`w-full px-4 py-3 rounded-xl bg-surface-raised border text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 min-h-[100px] resize-y ${error ? 'border-error' : 'border-border'} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DIALOG — with focus trap
   ═══════════════════════════════════════════ */

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function Dialog({ open, onClose, title, children, actions }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    // Focus first focusable element
    setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea');
      first?.focus();
    }, 50);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 fade-in" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="relative bg-surface-raised rounded-2xl shadow-lg max-w-md w-full p-6 max-h-[85vh] overflow-y-auto slide-up"
      >
        <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>
        <div className="mb-6">{children}</div>
        {actions && <div className="flex gap-3 justify-end">{actions}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════ */

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon && <div className="mb-4 text-text-tertiary">{icon}</div>}
      <h3 className="text-base font-semibold text-text-primary mb-1.5">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-6 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRICE SUMMARY
   ═══════════════════════════════════════════ */

interface PriceSummaryProps {
  price: number;
  currency: string;
  included: string[];
  excluded: string[];
}

export function PriceSummary({ price, included, excluded }: PriceSummaryProps) {
  const { state } = useApp();
  const lang = state.language;
  return (
    <div className="rounded-xl bg-surface-sunken p-5 space-y-4">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-text-secondary">{t('details.expectedPrice', lang)}</span>
        <div>
          <span className="text-2xl font-bold text-text-primary tabular-nums">{price}</span>
          <span className="text-sm text-text-secondary ms-1">{t('common.sar', lang)}</span>
        </div>
      </div>
      <div className="h-px bg-border" />
      <div>
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">{t('details.included', lang)}</p>
        <ul className="space-y-1.5">
          {included.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      {excluded.length > 0 && (
        <div>
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">{t('details.excluded', lang)}</p>
          <ul className="space-y-1.5">
            {excluded.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-text-tertiary">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[10px] text-text-tertiary pt-2 border-t border-border">
        {t('booking.syntheticLabel', lang)}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TIMELINE
   ═══════════════════════════════════════════ */

interface TimelineProps {
  items: { time: string; activity: string; activityAr: string }[];
}

export function Timeline({ items }: TimelineProps) {
  const { state } = useApp();
  const lang = state.language;
  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-brand-500 mt-2" />
            {i < items.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className="pb-5">
            <p className="text-xs font-medium text-brand-600 tabular-nums">{item.time}</p>
            <p className="text-sm text-text-secondary mt-0.5">{lang === 'ar' ? item.activityAr : item.activity}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ARRIVAL ACTION
   ═══════════════════════════════════════════ */

interface ArrivalActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function ArrivalAction({ icon, label, onClick, variant = 'secondary' }: ArrivalActionProps) {
  const base = variant === 'primary'
    ? 'bg-brand-600 text-white hover:bg-brand-700'
    : 'bg-surface-raised border border-border text-text-primary hover:bg-surface-sunken';
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors min-h-[52px] ${base}`}
    >
      {icon}
      <span className="font-medium text-[15px]">{label}</span>
      <ChevronRight className="w-4 h-4 ms-auto opacity-40 flip-rtl" aria-hidden="true" />
    </button>
  );
}

/* ═══════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════ */

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-border rounded-lg ${className}`} aria-hidden="true" />;
}

/* ═══════════════════════════════════════════
   SYNTHETIC PAYMENT LABEL
   ═══════════════════════════════════════════ */

export function SyntheticPaymentLabel() {
  const { state } = useApp();
  return (
    <p className="text-[10px] text-text-tertiary flex items-center gap-1">
      <Info className="w-3 h-3" aria-hidden="true" />
      {t('common.syntheticPayment', state.language)}
    </p>
  );
}
