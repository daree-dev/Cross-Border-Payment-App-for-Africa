import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { NotificationType } from '../../services/notification.service';

interface ToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const config: Record<NotificationType, { icon: React.ReactNode; classes: string }> = {
  success: { icon: <CheckCircle size={18} />, classes: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300' },
  error:   { icon: <XCircle size={18} />,     classes: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300' },
  warning: { icon: <AlertTriangle size={18} />, classes: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300' },
  info:    { icon: <Info size={18} />,          classes: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' },
};

export function Toast({ id, type, title, message, duration = 4000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => { setVisible(false); setTimeout(() => onDismiss(id), 300); }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const { icon, classes } = config[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3 pr-4 rounded-lg border shadow-md max-w-sm w-full transition-all duration-300 ${classes} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {message && <p className="text-xs mt-0.5 opacity-80">{message}</p>}
      </div>
      <button onClick={() => onDismiss(id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

// Toast container — mount once at app root
interface ToastItem { id: string; type: NotificationType; title: string; message?: string; duration?: number; }
let addToast: (t: Omit<ToastItem, 'id'>) => void = () => {};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToast = (t) => setToasts(prev => [...prev, { ...t, id: crypto.randomUUID() }]);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

export const toast = {
  success: (title: string, message?: string) => addToast({ type: 'success', title, message }),
  error:   (title: string, message?: string) => addToast({ type: 'error',   title, message }),
  warning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
  info:    (title: string, message?: string) => addToast({ type: 'info',    title, message }),
};
