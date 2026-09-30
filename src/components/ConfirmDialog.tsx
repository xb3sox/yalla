import { Dialog, Button } from './DesignSystem';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '../data/store';
import { t } from '../i18n';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const { state } = useApp();
  const lang = state.language;

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-error" />,
    warning: <AlertTriangle className="w-6 h-6 text-warning" />,
    info: <AlertTriangle className="w-6 h-6 text-info" />,
  };

  const bgColors = {
    danger: 'bg-error-bg',
    warning: 'bg-warning-bg',
    info: 'bg-info-bg',
  };

  const defaultConfirmLabels = {
    danger: lang === 'ar' ? 'تأكيد الحذف' : 'Confirm deletion',
    warning: lang === 'ar' ? 'تأكيد' : 'Confirm',
    info: lang === 'ar' ? 'موافق' : 'OK',
  };

  const defaultCancelLabels = {
    danger: lang === 'ar' ? 'إلغاء' : 'Cancel',
    warning: lang === 'ar' ? 'إلغاء' : 'Cancel',
    info: lang === 'ar' ? 'إلغاء' : 'Cancel',
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel || defaultCancelLabels[variant]}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel || defaultConfirmLabels[variant]}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${bgColors[variant]} flex items-center justify-center flex-shrink-0`}>
          {icons[variant]}
        </div>
        <p className="text-sm text-text-secondary flex-1">{message}</p>
      </div>
    </Dialog>
  );
}
