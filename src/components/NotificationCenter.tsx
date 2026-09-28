import { useApp } from '../data/store';
import { t } from '../i18n';
import { Bell, Check, X, Calendar, AlertCircle, Info } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { state } = useApp();
  const lang = state.language;
  const userNotifications = state.notifications.filter(n => n.recipientId === 'user-1');

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'confirmation':
      case 'reconfirmation':
        return <Check className="w-4 h-4 text-success" />;
      case 'material_change':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'reminder':
        return <Calendar className="w-4 h-4 text-info" />;
      default:
        return <Info className="w-4 h-4 text-text-secondary" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'confirmation':
      case 'reconfirmation':
        return 'bg-success-bg';
      case 'material_change':
        return 'bg-warning-bg';
      case 'reminder':
        return 'bg-info-bg';
      default:
        return 'bg-surface-sunken';
    }
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
        className="fixed top-14 end-4 w-80 max-h-96 bg-surface-raised rounded-xl shadow-lg border border-border z-50 overflow-hidden slide-up"
        role="dialog"
        aria-label={t('nav.notifications', lang)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">
            {t('nav.notifications', lang)}
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
        <div className="overflow-y-auto max-h-80">
          {userNotifications.length > 0 ? (
            <div className="divide-y divide-border">
              {userNotifications.map(notif => (
                <div key={notif.id} className="p-4 hover:bg-surface-sunken transition-colors">
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${getBgColor(notif.type)} flex items-center justify-center flex-shrink-0`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary mb-1">
                        {lang === 'ar' ? notif.titleAr : notif.title}
                      </p>
                      <p className="text-xs text-text-secondary mb-2 line-clamp-2">
                        {lang === 'ar' ? notif.bodyAr : notif.body}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(notif.createdAt).toLocaleDateString(
                          lang === 'ar' ? 'ar-SA' : 'en-US',
                          { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface NotificationBellProps {
  onClick: () => void;
  count: number;
}

export function NotificationBell({ onClick, count }: NotificationBellProps) {
  const { state } = useApp();
  const lang = state.language;

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-surface-sunken rounded-full transition-colors"
      aria-label={t('nav.notifications', lang)}
    >
      <Bell className="w-5 h-5 text-text-secondary" />
      {count > 0 && (
        <span className="absolute top-0.5 end-0.5 w-4 h-4 bg-accent-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
