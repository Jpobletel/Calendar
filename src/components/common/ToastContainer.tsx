import { useStore } from '../../state/store';
import { Toast } from './Toast';

export function ToastContainer() {
  const notifications = useStore((s) => s.ui.notifications);
  const dismissNotification = useStore((s) => s.dismissNotification);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex flex-col gap-2 px-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 sm:px-0"
    >
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onDismiss={dismissNotification} />
      ))}
    </div>
  );
}
