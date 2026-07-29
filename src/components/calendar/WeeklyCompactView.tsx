import { useMemo, useState } from 'react';
import { EmptyState } from '../common/EmptyState';
import { PersonAvatar } from '../common/PersonAvatar';
import { ShiftChip } from '../shifts/ShiftChip';
import { ShiftForm } from '../shifts/ShiftForm';
import type { Schedule } from '../../types';
import { DAY_LABELS_SHORT } from '../../types';
import { getOrderedDayIndices, filterDayIndices } from '../../utils/days';
import { detectConflicts, isShiftInConflict } from '../../utils/conflicts';
import { calculateDailyTotal, calculateWeeklyTotal } from '../../utils/totals';
import { formatMinutesAsHours } from '../../utils/time';
import { sortPeopleByOrder, sortShiftsByStartTime } from '../../utils/sort';

interface WeeklyCompactViewProps {
  schedule: Schedule;
}

/** Tabla semanal compacta: personas x días. Sirve como vista de tabla en escritorio y vista semanal en móvil. */
export function WeeklyCompactView({ schedule }: WeeklyCompactViewProps) {
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ day: number; personId: string } | null>(null);

  const visiblePeople = useMemo(() => sortPeopleByOrder(schedule.people.filter((p) => p.visible)), [schedule.people]);
  const conflicts = useMemo(() => detectConflicts(schedule.shifts), [schedule.shifts]);
  const days = useMemo(() => {
    const ordered = getOrderedDayIndices(schedule.viewSettings.weekStart);
    const visibleIds = new Set(visiblePeople.map((person) => person.id));
    const visibleShifts = schedule.shifts.filter((shift) => visibleIds.has(shift.personId));
    return filterDayIndices(ordered, schedule.viewSettings.dayFilter, visibleShifts);
  }, [schedule.viewSettings.weekStart, schedule.viewSettings.dayFilter, schedule.shifts, visiblePeople]);

  if (visiblePeople.length === 0) {
    return <EmptyState title="Selecciona una o más personas para ver sus horarios." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900">
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-[9rem] bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Persona
              </th>
              {days.map((day) => (
                <th key={day} scope="col" className="min-w-[8rem] px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                  {DAY_LABELS_SHORT[day]}
                </th>
              ))}
              <th scope="col" className="min-w-[6rem] px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                Total semanal
              </th>
            </tr>
          </thead>
          <tbody>
            {visiblePeople.map((person) => {
              const weeklyMinutes = calculateWeeklyTotal(
                schedule.shifts.filter((s) => days.includes(s.day)),
                person.id,
              );
              return (
                <tr key={person.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <PersonAvatar name={person.name} color={person.color} size="sm" />
                      <span className="max-w-[7rem] truncate">{person.name}</span>
                    </div>
                  </th>
                  {days.map((day) => {
                    const dayShifts = sortShiftsByStartTime(
                      schedule.shifts.filter((s) => s.personId === person.id && s.day === day),
                    );
                    return (
                      <td key={day} className="px-1.5 py-1.5">
                        {dayShifts.length === 0 ? (
                          <button
                            type="button"
                            onClick={() => setCreating({ day, personId: person.id })}
                            className="flex min-h-touch w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:hover:border-brand-500"
                            aria-label={`Agregar turno para ${person.name} el ${DAY_LABELS_SHORT[day]}`}
                          >
                            + Turno
                          </button>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {dayShifts.map((shift) => (
                              <ShiftChip
                                key={shift.id}
                                shift={shift}
                                person={person}
                                hasConflict={isShiftInConflict(conflicts, shift.id)}
                                onClick={() => setEditingShiftId(shift.id)}
                                showPerson={false}
                              />
                            ))}
                          </div>
                        )}
                        {dayShifts.length > 0 && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatMinutesAsHours(calculateDailyTotal(schedule.shifts, person.id, day))}
                          </p>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formatMinutesAsHours(weeklyMinutes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {creating && (
        <ShiftForm
          isOpen={Boolean(creating)}
          onClose={() => setCreating(null)}
          schedule={schedule}
          initialDay={creating.day}
          initialPersonId={creating.personId}
        />
      )}
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
