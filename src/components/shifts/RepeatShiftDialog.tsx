import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PersonAvatar } from '../common/PersonAvatar';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';
import { DAY_LABELS_SHORT } from '../../types';

interface RepeatShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  shiftId: string;
}

export function RepeatShiftDialog({ isOpen, onClose, schedule, shiftId }: RepeatShiftDialogProps) {
  const repeatShift = useStore((s) => s.repeatShift);
  const original = schedule.shifts.find((sh) => sh.id === shiftId);
  const [days, setDays] = useState<number[]>(original ? [original.day] : []);
  const [personIds, setPersonIds] = useState<string[]>(original ? [original.personId] : []);

  if (!original) return null;

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)));
  }
  function togglePerson(id: string) {
    setPersonIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repetir turno"
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} fullWidth className="sm:w-auto">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              repeatShift(schedule.id, shiftId, { days, personIds });
              onClose();
            }}
            disabled={days.length === 0 || personIds.length === 0}
            fullWidth
            className="sm:w-auto"
          >
            Repetir turno
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Repetir en estos días</p>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDays([0, 1, 2, 3, 4])}
              className="min-h-touch rounded-lg bg-slate-100 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              Días laborales
            </button>
            <button
              type="button"
              onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}
              className="min-h-touch rounded-lg bg-slate-100 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              Semana completa
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS_SHORT.map((label, index) => (
              <button
                key={label}
                type="button"
                aria-pressed={days.includes(index)}
                onClick={() => toggleDay(index)}
                className={`min-h-touch min-w-touch rounded-lg border px-2 text-sm font-medium ${
                  days.includes(index)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Repetir para estas personas</p>
          <ul className="flex flex-col gap-1">
            {schedule.people.map((person) => (
              <li key={person.id}>
                <button
                  type="button"
                  aria-pressed={personIds.includes(person.id)}
                  onClick={() => togglePerson(person.id)}
                  className={`flex min-h-touch w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium ${
                    personIds.includes(person.id)
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
        </div>
      </div>
    </Modal>
  );
}
