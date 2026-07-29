import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Copy, Repeat, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useStore } from '../../state/store';
import type { Schedule, Shift } from '../../types';
import { DAY_LABELS } from '../../types';
import { validateShiftForm, type ShiftFormErrors } from '../../utils/validation';
import { isOvernightShift, isValidTimeString } from '../../utils/time';
import { detectConflicts } from '../../utils/conflicts';
import { RepeatShiftDialog } from './RepeatShiftDialog';

interface ShiftFormProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
  shiftId?: string;
  initialPersonId?: string;
  initialDay?: number;
  initialStartTime?: string;
  initialEndTime?: string;
}

const TEMP_ID = '__preview__';

interface Snapshot {
  personId: string;
  day: number | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  note: string;
  location: string;
}

const inputClass =
  'min-h-touch w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

export function ShiftForm({
  isOpen,
  onClose,
  schedule,
  shiftId,
  initialPersonId,
  initialDay,
  initialStartTime,
  initialEndTime,
}: ShiftFormProps) {
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const deleteShift = useStore((s) => s.deleteShift);
  const duplicateShift = useStore((s) => s.duplicateShift);

  const existing = shiftId ? schedule.shifts.find((sh) => sh.id === shiftId) : undefined;
  const isEdit = Boolean(existing);

  const [personId, setPersonId] = useState('');
  const [day, setDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const next: Snapshot = existing
      ? {
          personId: existing.personId,
          day: existing.day,
          startTime: existing.startTime,
          endTime: existing.endTime,
          breakMinutes: existing.breakMinutes,
          note: existing.note ?? '',
          location: existing.location ?? '',
        }
      : {
          personId: initialPersonId ?? schedule.people[0]?.id ?? '',
          day: initialDay ?? 0,
          startTime: initialStartTime ?? '09:00',
          endTime: initialEndTime ?? '17:00',
          breakMinutes: 0,
          note: '',
          location: '',
        };
    setPersonId(next.personId);
    setDay(next.day);
    setStartTime(next.startTime);
    setEndTime(next.endTime);
    setBreakMinutes(next.breakMinutes);
    setNote(next.note);
    setLocation(next.location);
    setSnapshot(next);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, shiftId]);

  const isDirty =
    snapshot !== null &&
    (personId !== snapshot.personId ||
      day !== snapshot.day ||
      startTime !== snapshot.startTime ||
      endTime !== snapshot.endTime ||
      breakMinutes !== snapshot.breakMinutes ||
      note !== snapshot.note ||
      location !== snapshot.location);

  function requestClose() {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      onClose();
    }
  }

  const overnight = isValidTimeString(startTime) && isValidTimeString(endTime) && isOvernightShift(startTime, endTime);

  const conflicts = useMemo(() => {
    if (day === null || !personId || !isValidTimeString(startTime) || !isValidTimeString(endTime)) return [];
    const others = schedule.shifts.filter((sh) => sh.id !== shiftId);
    const preview: Shift = {
      id: TEMP_ID,
      personId,
      day,
      startTime,
      endTime,
      breakMinutes,
      createdAt: '',
      updatedAt: '',
    };
    return detectConflicts([...others, preview]).filter((c) => c.shiftIds.includes(TEMP_ID));
  }, [schedule.shifts, shiftId, personId, day, startTime, endTime, breakMinutes]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { valid, errors: formErrors } = validateShiftForm({ personId, day, startTime, endTime, breakMinutes });
    if (!valid) {
      setErrors(formErrors);
      return;
    }
    const input = {
      personId,
      day: day as number,
      startTime,
      endTime,
      breakMinutes,
      note: note.trim() || undefined,
      location: location.trim() || undefined,
    };
    if (isEdit && shiftId) {
      updateShift(schedule.id, shiftId, input);
    } else {
      addShift(schedule.id, input);
    }
    onClose();
  }

  if (schedule.people.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Nuevo turno" size="sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Primero crea al menos una persona para poder asignarle turnos.
        </p>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={requestClose}
        title={isEdit ? 'Editar turno' : 'Nuevo turno'}
        size="md"
        footer={
          <div className="flex flex-col gap-2">
            {isEdit && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Copy className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    if (shiftId) duplicateShift(schedule.id, shiftId);
                    onClose();
                  }}
                  className="flex-1"
                >
                  Duplicar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={<Repeat className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => setRepeatOpen(true)}
                  className="flex-1"
                >
                  Repetir
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => {
                    if (shiftId) deleteShift(schedule.id, shiftId);
                    onClose();
                  }}
                  className="flex-1"
                >
                  Eliminar
                </Button>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={requestClose} fullWidth className="sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" form="shift-form" fullWidth className="sm:w-auto">
                Guardar
              </Button>
            </div>
          </div>
        }
      >
        <form id="shift-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Persona" htmlFor="shift-person" error={errors.personId}>
            <select id="shift-person" value={personId} onChange={(event) => setPersonId(event.target.value)} className={inputClass}>
              {schedule.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Día" htmlFor="shift-day" error={errors.day}>
            <select
              id="shift-day"
              value={day ?? ''}
              onChange={(event) => setDay(Number(event.target.value))}
              className={inputClass}
            >
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora de inicio" htmlFor="shift-start" error={errors.startTime}>
              <input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Hora de término" htmlFor="shift-end" error={errors.endTime}>
              <input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {overnight && (
            <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Este turno termina al día siguiente (+1 día).
            </p>
          )}

          <Field label="Pausa / colación (minutos)" htmlFor="shift-break" error={errors.breakMinutes}>
            <input
              id="shift-break"
              type="number"
              inputMode="numeric"
              min={0}
              value={breakMinutes}
              onChange={(event) => setBreakMinutes(Number(event.target.value))}
              className={inputClass}
            />
          </Field>

          <Field label="Lugar o área (opcional)" htmlFor="shift-location">
            <input
              id="shift-location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={inputClass}
              placeholder="Ej: Sucursal Centro"
            />
          </Field>

          <Field label="Nota (opcional)" htmlFor="shift-note">
            <textarea
              id="shift-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              className={`${inputClass} resize-none py-2`}
              placeholder="Ej: Turno partido"
            />
          </Field>

          {conflicts.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              Este turno se superpone con otro turno de la misma persona ({conflicts[0].overlapMinutes} min de superposición).
              Puedes guardarlo igual si es intencional.
            </div>
          )}
        </form>
      </Modal>

      {isEdit && shiftId && (
        <RepeatShiftDialog isOpen={repeatOpen} onClose={() => setRepeatOpen(false)} schedule={schedule} shiftId={shiftId} />
      )}

      <ConfirmDialog
        isOpen={confirmDiscardOpen}
        title="Descartar cambios"
        message="Tienes cambios sin guardar en este turno. ¿Quieres descartarlos?"
        confirmLabel="Descartar cambios"
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscardOpen(false)}
      />
    </>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
