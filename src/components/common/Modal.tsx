import { useId, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
};

/**
 * Modal responsivo: panel inferior de casi toda la pantalla en móvil,
 * diálogo centrado en escritorio. Cierra con Escape, atrapa el foco con Tab
 * y restaura el foco anterior al cerrarse.
 */
export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalA11y({ isOpen, onClose, containerRef: containerRef as RefObject<HTMLElement> });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-900/50 backdrop-blur-sm md:items-center md:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white pb-safe-bottom shadow-xl outline-none animate-slide-up dark:bg-slate-900 md:max-h-[85vh] md:animate-fade-in md:rounded-2xl md:pb-0 ${SIZE_CLASS[size]}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <IconCloseButton onClose={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer && <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

function IconCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="flex h-touch w-touch items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
