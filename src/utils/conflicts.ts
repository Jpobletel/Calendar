import type { Conflict, Shift } from '../types';
import { getShiftDurationMinutes, overlapMinutes, timeToMinutes } from './time';

const WEEK_MINUTES = 7 * 1440;

interface WeekInterval {
  shiftId: string;
  day: number;
  start: number;
  end: number;
}

function toWeekInterval(shift: Shift): WeekInterval {
  const start = shift.day * 1440 + timeToMinutes(shift.startTime);
  const duration = getShiftDurationMinutes(shift.startTime, shift.endTime);
  return { shiftId: shift.id, day: shift.day, start, end: start + duration };
}

/**
 * Detecta turnos superpuestos de una misma persona, incluyendo superposiciones
 * causadas por turnos que cruzan medianoche hacia el día siguiente.
 */
export function detectConflicts(shifts: Shift[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const byPerson = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const list = byPerson.get(shift.personId) ?? [];
    list.push(shift);
    byPerson.set(shift.personId, list);
  }

  for (const [personId, personShifts] of byPerson) {
    const intervals = personShifts.map(toWeekInterval);
    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const a = intervals[i];
        const b = intervals[j];
        const shifts3 = [b.start, b.start - WEEK_MINUTES, b.start + WEEK_MINUTES];
        let best = 0;
        for (const bStart of shifts3) {
          const bEnd = bStart + (b.end - b.start);
          const overlap = overlapMinutes(a.start, a.end, bStart, bEnd);
          if (overlap > best) best = overlap;
        }
        if (best > 0) {
          conflicts.push({
            personId,
            day: Math.min(a.day, b.day),
            shiftIds: [a.shiftId, b.shiftId],
            overlapMinutes: best,
          });
        }
      }
    }
  }
  return conflicts;
}

export function findConflictsForShift(conflicts: Conflict[], shiftId: string): Conflict[] {
  return conflicts.filter((c) => c.shiftIds.includes(shiftId));
}

export function isShiftInConflict(conflicts: Conflict[], shiftId: string): boolean {
  return conflicts.some((c) => c.shiftIds.includes(shiftId));
}
