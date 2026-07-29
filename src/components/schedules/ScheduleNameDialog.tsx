import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { validateScheduleName } from '../../utils/validation';

interface ScheduleNameDialogProps {
  isOpen: boolean;
  title: string;
  initialName?: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function ScheduleNameDialog({
  isOpen,
  title,
  initialName = '',
  confirmLabel = 'Guardar',
  onConfirm,
  onClose,
}: ScheduleNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setError(undefined);
    }
  }, [isOpen, initialName]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validateScheduleName(name);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    onConfirm(name.trim());
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth className="sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" form="schedule-name-form" fullWidth className="sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <form id="schedule-name-form" onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="schedule-name-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nombre del horario
        </label>
        <input
          id="schedule-name-input"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'schedule-name-error' : undefined}
          className="min-h-touch rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          placeholder="Ej: Semana actual"
        />
        {error && (
          <p id="schedule-name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
