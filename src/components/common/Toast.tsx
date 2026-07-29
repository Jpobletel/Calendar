import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { AppNotification } from '../../types';

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };

const COLORS: Record<AppNotification['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  info: 'border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-200',
};

interface ToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

export function Toast({ notification, onDismiss }: ToastProps) {
  const Icon = ICONS[notification.type];

  useEffect(() => {
    if (notification.persistent) return undefined;
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-up ${COLORS[notification.type]}`}
      role="status"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p>{notification.message}</p>
        {notification.undo && (
          <button
            type="button"
            onClick={() => {
              notification.undo?.onUndo();
              onDismiss(notification.id);
            }}
            className="mt-1 font-semibold underline underline-offset-2"
          >
            {notification.undo.label}
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Cerrar notificación"
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
