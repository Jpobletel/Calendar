import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PersonAvatar } from '../common/PersonAvatar';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';

interface CopyShiftsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  sourcePersonId: string;
}

export function CopyShiftsDialog({ isOpen, onClose, schedule, sourcePersonId }: CopyShiftsDialogProps) {
  const copyPersonShiftsTo = useStore((s) => s.copyPersonShiftsTo);
  const [targetId, setTargetId] = useState<string | null>(null);
  const source = schedule.people.find((p) => p.id === sourcePersonId);
  const targets = schedule.people.filter((p) => p.id !== sourcePersonId);
  const sourceShiftCount = schedule.shifts.filter((s) => s.personId === sourcePersonId).length;

  useEffect(() => {
    if (isOpen && !targets.some((person) => person.id === targetId)) {
      setTargetId(null);
    }
  }, [isOpen, targetId, targets]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Copiar turnos de ${source?.name ?? ''}`}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} fullWidth className="sm:w-auto">
            Cancelar
          </Button>
          <Button
            disabled={!targetId}
            onClick={() => {
              if (targetId) {
                copyPersonShiftsTo(schedule.id, sourcePersonId, targetId);
                onClose();
              }
            }}
            fullWidth
            className="sm:w-auto"
          >
            Copiar {sourceShiftCount} turno{sourceShiftCount === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      {targets.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No hay otra persona a la cual copiar los turnos. Crea otra persona primero.
        </p>
      ) : (
        <ul className="flex flex-col gap-1" role="radiogroup" aria-label="Persona destino">
          {targets.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                role="radio"
                aria-checked={targetId === person.id}
                onClick={() => setTargetId(person.id)}
                className={`flex min-h-touch w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium ${
                  targetId === person.id
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <PersonAvatar name={person.name} color={person.color} size="sm" />
                {person.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
