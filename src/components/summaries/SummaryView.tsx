import { useMemo, useState } from 'react';
import { EmptyState } from '../common/EmptyState';
import { PersonAvatar } from '../common/PersonAvatar';
import type { Schedule, SummaryFilterBy, SummarySortBy } from '../../types';
import { DAY_LABELS_SHORT } from '../../types';
import { calculateAllStats, calculateGrandTotalMinutes } from '../../utils/totals';
import { formatMinutesAsHours } from '../../utils/time';
import { sortPeopleBySummary } from '../../utils/sort';

interface SummaryViewProps {
  schedule: Schedule;
}

const SORT_OPTIONS: { value: SummarySortBy; label: string }[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'hoursDesc', label: 'Más horas' },
  { value: 'hoursAsc', label: 'Menos horas' },
  { value: 'shiftsDesc', label: 'Más turnos' },
  { value: 'shiftsAsc', label: 'Menos turnos' },
];

const FILTER_OPTIONS: { value: SummaryFilterBy; label: string }[] = [
  { value: 'visible', label: 'Personas visibles' },
  { value: 'all', label: 'Todas las personas' },
  { value: 'withShifts', label: 'Con turnos' },
  { value: 'withoutShifts', label: 'Sin turnos' },
];

/** Resumen de horas: no clasifica automáticamente ninguna cantidad como correcta o incorrecta. */
export function SummaryView({ schedule }: SummaryViewProps) {
  const [sortBy, setSortBy] = useState<SummarySortBy>('name');
  const [filterBy, setFilterBy] = useState<SummaryFilterBy>('visible');

  const stats = useMemo(
    () => calculateAllStats(schedule.shifts, schedule.people.map((p) => p.id)),
    [schedule.shifts, schedule.people],
  );

  const filtered = useMemo(() => {
    return schedule.people.filter((p) => {
      const s = stats.get(p.id);
      if (filterBy === 'visible') return p.visible;
      if (filterBy === 'withShifts') return (s?.shiftCount ?? 0) > 0;
      if (filterBy === 'withoutShifts') return (s?.shiftCount ?? 0) === 0;
      return true;
    });
  }, [schedule.people, stats, filterBy]);

  const sorted = useMemo(() => sortPeopleBySummary(filtered, stats, sortBy), [filtered, stats, sortBy]);
  const sortedPersonIds = useMemo(() => new Set(sorted.map((person) => person.id)), [sorted]);
  const grandTotal = useMemo(
    () => calculateGrandTotalMinutes(schedule.shifts.filter((s) => sortedPersonIds.has(s.personId))),
    [schedule.shifts, sortedPersonIds],
  );

  if (schedule.people.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay personas."
        description="Crea la primera persona para comenzar a organizar el horario."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <label htmlFor="summary-filter" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Mostrar
          </label>
          <select
            id="summary-filter"
            value={filterBy}
            onChange={(event) => setFilterBy(event.target.value as SummaryFilterBy)}
            className="min-h-touch rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="summary-sort" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ordenar por
          </label>
          <select
            id="summary-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SummarySortBy)}
            className="min-h-touch rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No hay personas que coincidan con este filtro.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900">
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Persona
                  </th>
                  {DAY_LABELS_SHORT.map((label) => (
                    <th key={label} scope="col" className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Total semanal
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Turnos
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Días trabajados
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                    Promedio/día
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((person) => {
                  const s = stats.get(person.id);
                  const dailyMinutes = s?.dailyMinutes ?? [0, 0, 0, 0, 0, 0, 0];
                  return (
                    <tr key={person.id} className="border-t border-slate-100 dark:border-slate-800">
                      <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <PersonAvatar name={person.name} color={person.color} size="sm" />
                          <span className="max-w-[8rem] truncate">{person.name}</span>
                        </div>
                      </th>
                      {dailyMinutes.map((minutes, index) => (
                        <td key={index} className="px-2 py-2 text-slate-600 dark:text-slate-300">
                          {minutes > 0 ? formatMinutesAsHours(minutes) : '—'}
                        </td>
                      ))}
                      <td className="px-3 py-2 font-bold text-brand-700 dark:text-brand-300">
                        {formatMinutesAsHours(s?.weeklyMinutes ?? 0)}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s?.shiftCount ?? 0}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{s?.daysWorked ?? 0}</td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                        {formatMinutesAsHours(s?.avgMinutesPerDayWorked ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
            Total general: {formatMinutesAsHours(grandTotal)}
          </div>
        </>
      )}
    </div>
  );
}
