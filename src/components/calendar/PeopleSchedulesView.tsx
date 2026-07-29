import { useMemo, useState } from 'react';
import { Download, Pencil, Plus } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { PersonAvatar } from '../common/PersonAvatar';
import { ShiftChip } from '../shifts/ShiftChip';
import { ShiftForm } from '../shifts/ShiftForm';
import { PersonForm } from '../people/PersonForm';
import { useExport } from '../export/ExportProvider';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';
import { DAY_LABELS } from '../../types';
import { getOrderedDayIndices, filterDayIndices } from '../../utils/days';
import { calculateAllStats } from '../../utils/totals';
import { formatMinutesAsHours } from '../../utils/time';
import { detectConflicts, isShiftInConflict } from '../../utils/conflicts';
import { sortPeopleByOrder, sortShiftsByStartTime } from '../../utils/sort';

interface PeopleSchedulesViewProps {
  schedule: Schedule;
}

interface EditingShiftState {
  shiftId?: string;
  personId?: string;
  day?: number;
}

/** Vista por persona: una tarjeta por persona con su horario semanal, resumen y acciones. */
export function PeopleSchedulesView({ schedule }: PeopleSchedulesViewProps) {
  const updatePerson = useStore((s) => s.updatePerson);
  const { requestExport } = useExport();
  const [editingShift, setEditingShift] = useState<EditingShiftState | null>(null);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);

  const visiblePeople = useMemo(() => sortPeopleByOrder(schedule.people.filter((p) => p.visible)), [schedule.people]);
  const conflicts = useMemo(() => detectConflicts(schedule.shifts), [schedule.shifts]);
  const days = useMemo(() => {
    const ordered = getOrderedDayIndices(schedule.viewSettings.weekStart);
    return filterDayIndices(ordered, schedule.viewSettings.dayFilter, schedule.shifts);
  }, [schedule.viewSettings.weekStart, schedule.viewSettings.dayFilter, schedule.shifts]);
  const stats = useMemo(
    () => calculateAllStats(schedule.shifts, visiblePeople.map((p) => p.id)),
    [schedule.shifts, visiblePeople],
  );

  const editingPerson = editingPersonId ? schedule.people.find((p) => p.id === editingPersonId) : undefined;

  async function handleQuickDownload(personId: string, name: string) {
    try {
      await requestExport({
        schedule,
        scope: 'person',
        personId,
        orientation: 'portrait',
        quality: 'normal',
        background: 'light',
        filenamePrefix: 'horario',
        filenameSubject: name,
      });
    } catch {
      // el error ya fue notificado por ExportProvider
    }
  }

  if (visiblePeople.length === 0) {
    return <EmptyState title="Selecciona una o más personas para ver sus horarios." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visiblePeople.map((person) => {
        const personStats = stats.get(person.id);
        return (
          <article
            key={person.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <PersonAvatar name={person.name} color={person.color} />
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{person.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatMinutesAsHours(personStats?.weeklyMinutes ?? 0)} · {personStats?.shiftCount ?? 0} turno
                    {personStats?.shiftCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditingPersonId(person.id)}
                  aria-label={`Editar a ${person.name}`}
                  className="flex h-touch w-touch items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDownload(person.id, person.name)}
                  aria-label={`Descargar horario de ${person.name}`}
                  className="flex h-touch w-touch items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {days.map((day) => {
                const dayShifts = sortShiftsByStartTime(
                  schedule.shifts.filter((s) => s.personId === person.id && s.day === day),
                );
                return (
                  <div key={day}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{DAY_LABELS[day]}</p>
                    {dayShifts.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setEditingShift({ personId: person.id, day })}
                        className="flex min-h-touch w-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
                      >
                        + Agregar turno
                      </button>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {dayShifts.map((shift) => (
                          <ShiftChip
                            key={shift.id}
                            shift={shift}
                            person={person}
                            hasConflict={isShiftInConflict(conflicts, shift.id)}
                            onClick={() => setEditingShift({ shiftId: shift.id })}
                            showPerson={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setEditingShift({ personId: person.id, day: schedule.viewSettings.selectedDay })}
              className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Agregar turno
            </button>
          </article>
        );
      })}

      {editingShift && (
        <ShiftForm
          isOpen={Boolean(editingShift)}
          onClose={() => setEditingShift(null)}
          schedule={schedule}
          shiftId={editingShift.shiftId}
          initialPersonId={editingShift.personId}
          initialDay={editingShift.day}
        />
      )}

      {editingPerson && (
        <PersonForm
          isOpen={Boolean(editingPerson)}
          title="Editar persona"
          initialName={editingPerson.name}
          initialColor={editingPerson.color}
          onClose={() => setEditingPersonId(null)}
          onConfirm={(name, color) => {
            updatePerson(schedule.id, editingPerson.id, { name, color });
            setEditingPersonId(null);
          }}
        />
      )}
    </div>
  );
}
