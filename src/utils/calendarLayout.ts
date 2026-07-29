import type { Schedule } from '../types';
import { getShiftDurationMinutes, timeToMinutes } from './time';

export interface CalendarVisibleRange {
  startHour: number;
  endHour: number;
}

/** Rango vertical compartido por la vista interactiva y la captura PNG del calendario. */
export function getCalendarVisibleRange(
  schedule: Schedule,
  visiblePersonIds: ReadonlySet<string>,
): CalendarVisibleRange {
  const { calendarRangeMode, calendarStart, calendarEnd } = schedule.viewSettings;
  if (calendarRangeMode === 'full') return { startHour: 0, endHour: 24 };
  if (calendarRangeMode === 'business') {
    return {
      startHour: timeToMinutes(calendarStart) / 60,
      endHour: timeToMinutes(calendarEnd) / 60,
    };
  }

  const relevant = schedule.shifts.filter((shift) => visiblePersonIds.has(shift.personId));
  if (relevant.length === 0) return { startHour: 8, endHour: 20 };

  let min = 24;
  let max = 0;
  for (const shift of relevant) {
    const start = timeToMinutes(shift.startTime) / 60;
    const duration = getShiftDurationMinutes(shift.startTime, shift.endTime) / 60;
    min = Math.min(min, start);
    max = Math.max(max, Math.min(24, start + duration));
  }

  return {
    startHour: Math.max(0, Math.floor(min)),
    endHour: Math.min(24, Math.ceil(max)),
  };
}
