import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Options {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement>;
}

const openModalStack: symbol[] = [];
let previousBodyOverflow = '';

/** Maneja el foco de un modal: cierre con Escape, trampa de foco con Tab, y restauración al cerrar. */
export function useModalA11y({ isOpen, onClose, containerRef }: Options): void {
  const tokenRef = useRef(Symbol('modal'));

  useEffect(() => {
    if (!isOpen) return;
    const token = tokenRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    openModalStack.push(token);

    if (openModalStack.length === 1) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const focusFirst = () => {
      const focusable = container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable?.[0] ?? container)?.focus();
    };
    focusFirst();

    function handleKeyDown(event: KeyboardEvent) {
      if (openModalStack[openModalStack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      const index = openModalStack.lastIndexOf(token);
      if (index >= 0) openModalStack.splice(index, 1);
      if (openModalStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
}
