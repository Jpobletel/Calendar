import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ColorPicker } from '../common/ColorPicker';
import { validatePersonName } from '../../utils/validation';
import { PERSON_COLORS } from '../../types';

interface PersonFormProps {
  isOpen: boolean;
  title: string;
  initialName?: string;
  initialColor?: string;
  confirmLabel?: string;
  onConfirm: (name: string, color: string) => void;
  onClose: () => void;
}

export function PersonForm({
  isOpen,
  title,
  initialName = '',
  initialColor,
  confirmLabel = 'Guardar',
  onConfirm,
  onClose,
}: PersonFormProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor ?? PERSON_COLORS[0]);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setColor(initialColor ?? PERSON_COLORS[0]);
      setError(undefined);
    }
  }, [isOpen, initialName, initialColor]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validatePersonName(name);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    onConfirm(name.trim(), color);
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
          <Button type="submit" form="person-form" fullWidth className="sm:w-auto">
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <form id="person-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="person-name-input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre
          </label>
          <input
            id="person-name-input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'person-name-error' : undefined}
            className="min-h-touch rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Ej: Verónica Soto"
          />
          {error && (
            <p id="person-name-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <ColorPicker value={color} onChange={setColor} />
      </form>
    </Modal>
  );
}
