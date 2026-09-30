import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 start-4 end-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    info: <Info className="w-5 h-5 text-info" />,
  };

  const bgColors = {
    success: 'bg-success-bg border-success/20',
    error: 'bg-error-bg border-error/20',
    info: 'bg-info-bg border-info/20',
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto slide-up ${bgColors[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm font-medium text-text-primary">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="p-1 hover:bg-black/5 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-text-tertiary" />
      </button>
    </div>
  );
}
