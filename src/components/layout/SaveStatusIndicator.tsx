import { Check, CloudOff, Loader2 } from 'lucide-react';
import { useStore } from '../../state/store';
import { useLastSavedAt, useSaveStatus } from '../../state/selectors';

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export function SaveStatusIndicator() {
  const status = useSaveStatus();
  const lastSavedAt = useLastSavedAt();
  const saveNow = useStore((s) => s.saveNow);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="hidden items-center gap-1 sm:flex" aria-live="polite">
        {status === 'saving' && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Guardando…
          </>
        )}
        {status === 'saved' && (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> Cambios guardados{' '}
            {formatTime(lastSavedAt)}
          </>
        )}
        {status === 'error' && (
          <>
            <CloudOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden="true" /> Error al guardar
          </>
        )}
        {status === 'idle' && 'Sin cambios'}
      </span>
      <button
        type="button"
        onClick={saveNow}
        className="min-h-touch rounded-lg px-2 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950"
      >
        Guardar ahora
      </button>
    </div>
  );
}
