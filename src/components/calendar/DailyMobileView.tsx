import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { ShiftChip } from '../shifts/ShiftChip';
import { ShiftForm } from '../shifts/ShiftForm';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';
import { DAY_LABELS, DAY_LABELS_SHORT } from '../../types';
import { calculateDailyTotal } from '../../utils/totals';
import { formatMinutesAsHours } from '../../utils/time';
import { detectConflicts, isShiftInConflict } from '../../utils/conflicts';
import { sortShiftsByStartTime } from '../../utils/sort';

interface DailyMobileViewProps {
  schedule: Schedule;
}

/** Vista predeterminada en móvil: un día a la vez con entrada, salida, pausa y totales. */
export function DailyMobileView({ schedule }: DailyMobileViewProps) {
  const updateScheduleViewSettings = useStore((s) => s.updateScheduleViewSettings);
  const selectedDay = schedule.viewSettings.selectedDay;
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const visiblePeople = useMemo(() => schedule.people.filter((p) => p.visible), [schedule.people]);
  const visiblePersonIds = useMemo(() => new Set(visiblePeople.map((person) => person.id)), [visiblePeople]);
  const conflicts = useMemo(() => detectConflicts(schedule.shifts), [schedule.shifts]);
  const dayShifts = useMemo(
    () =>
      sortShiftsByStartTime(
        schedule.shifts.filter((sh) => sh.day === selectedDay && visiblePersonIds.has(sh.personId)),
      ),
    [schedule.shifts, selectedDay, visiblePersonIds],
  );
  const dayTotal = visiblePeople.reduce((sum, p) => sum + calculateDailyTotal(schedule.shifts, p.id, selectedDay), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5" role="tablist" aria-label="Seleccionar día">
          {DAY_LABELS_SHORT.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={selectedDay === index}
              onClick={() => updateScheduleViewSettings(schedule.id, { selectedDay: index })}
              className={`flex min-h-touch min-w-touch shrink-0 flex-col items-center justify-center rounded-xl px-3 text-xs font-semibold transition-colors ${
                selectedDay === index
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{DAY_LABELS[selectedDay]}</h2>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setCreating(true)}>
          Turno
        </Button>
      </div>

      {visiblePeople.length === 0 ? (
        <EmptyState title="Selecciona una o más personas para ver sus horarios." />
      ) : dayShifts.length === 0 ? (
        <EmptyState
          title="Este horario todavía no tiene turnos."
          description="Agrega un turno para comenzar."
          action={
            <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Agregar turno
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {dayShifts.map((shift) => {
            const person = schedule.people.find((p) => p.id === shift.personId);
            return (
              <li key={shift.id}>
                <ShiftChip
                  shift={shift}
                  person={person}
                  hasConflict={isShiftInConflict(conflicts, shift.id)}
                  onClick={() => setEditingShiftId(shift.id)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {dayShifts.length > 0 && (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Total del día: {formatMinutesAsHours(dayTotal)}
        </div>
      )}

      <ShiftForm isOpen={creating} onClose={() => setCreating(false)} schedule={schedule} initialDay={selectedDay} />
      {editingShiftId && (
        <ShiftForm
          isOpen={Boolean(editingShiftId)}
          onClose={() => setEditingShiftId(null)}
          schedule={schedule}
          shiftId={editingShiftId}
        />
      )}
    </div>
  );
}
