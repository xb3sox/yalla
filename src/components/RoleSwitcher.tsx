import { useApp } from '../data/store';
import { t } from '../i18n';
import type { Role } from '../types';
import { Shield, User, Briefcase, HeadphonesIcon, X } from 'lucide-react';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoleSwitcher({ isOpen, onClose }: RoleSwitcherProps) {
  const { state, dispatch } = useApp();
  const lang = state.language;

  if (!isOpen) return null;

  const roles: { value: Role; label: string; labelAr: string; icon: React.ReactNode; description: string; descriptionAr: string }[] = [
    {
      value: 'participant',
      label: 'Participant',
      labelAr: 'مشارك',
      icon: <User className="w-5 h-5" />,
      description: 'Discover and book experiences',
      descriptionAr: 'اكتشف واحجز التجارب',
    },
    {
      value: 'operations',
      label: 'Operations',
      labelAr: 'العمليات',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Manage plans, hosts, and venues',
      descriptionAr: 'إدارة الخطط والمضيفين والأماكن',
    },
    {
      value: 'support',
      label: 'Support',
      labelAr: 'الدعم',
      icon: <HeadphonesIcon className="w-5 h-5" />,
      description: 'Handle support requests',
      descriptionAr: 'معالجة طلبات الدعم',
    },
    {
      value: 'trust_safety',
      label: 'Trust & Safety',
      labelAr: 'الثقة والسلامة',
      icon: <Shield className="w-5 h-5" />,
      description: 'Review safety cases',
      descriptionAr: 'مراجعة حالات السلامة',
    },
  ];

  const handleRoleChange = (role: Role) => {
    dispatch({ type: 'SET_ROLE', payload: role });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed top-14 end-4 w-80 bg-surface-raised rounded-xl shadow-lg border border-border z-50 overflow-hidden slide-up"
        role="dialog"
        aria-label={t('nav.switchRole', lang)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            {t('nav.switchRole', lang)}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-sunken rounded-lg transition-colors"
            aria-label={t('common.close', lang)}
          >
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2">
          {roles.map(role => (
            <button
              key={role.value}
              onClick={() => handleRoleChange(role.value)}
              className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-start ${
                state.role === role.value
                  ? 'bg-brand-50 border border-brand-200'
                  : 'hover:bg-surface-sunken'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                state.role === role.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-sunken text-text-secondary'
              }`}>
                {role.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary mb-0.5">
                  {lang === 'ar' ? role.labelAr : role.label}
                </p>
                <p className="text-xs text-text-secondary">
                  {lang === 'ar' ? role.descriptionAr : role.description}
                </p>
              </div>
              {state.role === role.value && (
                <div className="w-2 h-2 rounded-full bg-brand-500 mt-2" />
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-sunken">
          <p className="text-xs text-text-tertiary text-center">
            {lang === 'ar'
              ? 'تبديل الدور للمحاكاة فقط'
              : 'Role switching is for demonstration only'}
          </p>
        </div>
      </div>
    </>
  );
}
