import type { DayFilterMode, Shift, WeekStart } from '../types';

/** Índices de día (0=lunes...6=domingo) en el orden en que deben mostrarse según la preferencia de inicio de semana. */
export function getOrderedDayIndices(weekStart: WeekStart): number[] {
  if (weekStart === 'monday') return [0, 1, 2, 3, 4, 5, 6];
  return [6, 0, 1, 2, 3, 4, 5];
}

export function filterDayIndices(days: number[], dayFilter: DayFilterMode, shifts: Shift[]): number[] {
  if (dayFilter === 'weekdays') return days.filter((d) => d <= 4);
  if (dayFilter === 'withShifts') return days.filter((d) => shifts.some((s) => s.day === d));
  return days;
}
