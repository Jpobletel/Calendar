import type { Shift } from '../types';
import { getWorkedMinutes, timeToMinutes } from './time';

export interface PersonStats {
  personId: string;
  dailyMinutes: number[];
  weeklyMinutes: number;
  shiftCount: number;
  daysWorked: number;
  avgMinutesPerDayWorked: number;
  firstStart: string | null;
  lastEnd: string | null;
}

/** Total de minutos trabajados por una persona en un día específico. */
export function calculateDailyTotal(shifts: Shift[], personId: string, day: number): number {
  return shifts
    .filter((s) => s.personId === personId && s.day === day)
    .reduce((sum, s) => sum + getWorkedMinutes(s.startTime, s.endTime, s.breakMinutes), 0);
}

/** Total de minutos trabajados por una persona en la semana completa. */
export function calculateWeeklyTotal(shifts: Shift[], personId: string): number {
  return shifts
    .filter((s) => s.personId === personId)
    .reduce((sum, s) => sum + getWorkedMinutes(s.startTime, s.endTime, s.breakMinutes), 0);
}

export function calculateAverageMinutesPerDay(weeklyMinutes: number, daysWorked: number): number {
  if (daysWorked <= 0) return 0;
  return weeklyMinutes / daysWorked;
}

/** Calcula todas las estadísticas de una persona a partir de sus turnos. */
export function calculatePersonStats(shifts: Shift[], personId: string): PersonStats {
  const personShifts = shifts.filter((s) => s.personId === personId);
  const dailyMinutes = Array.from({ length: 7 }, (_, day) => calculateDailyTotal(shifts, personId, day));
  const weeklyMinutes = dailyMinutes.reduce((a, b) => a + b, 0);
  const daysWorked = dailyMinutes.filter((m) => m > 0).length;

  let firstStart: string | null = null;
  let lastEnd: string | null = null;
  let firstStartMinutes = Infinity;
  let lastEndMinutes = -Infinity;
  for (const shift of personShifts) {
    const start = timeToMinutes(shift.startTime);
    if (start < firstStartMinutes) {
      firstStartMinutes = start;
      firstStart = shift.startTime;
    }
    const end = timeToMinutes(shift.endTime);
    if (end > lastEndMinutes) {
      lastEndMinutes = end;
      lastEnd = shift.endTime;
    }
  }

  return {
    personId,
    dailyMinutes,
    weeklyMinutes,
    shiftCount: personShifts.length,
    daysWorked,
    avgMinutesPerDayWorked: calculateAverageMinutesPerDay(weeklyMinutes, daysWorked),
    firstStart,
    lastEnd,
  };
}

export function calculateAllStats(shifts: Shift[], personIds: string[]): Map<string, PersonStats> {
  const result = new Map<string, PersonStats>();
  for (const personId of personIds) {
    result.set(personId, calculatePersonStats(shifts, personId));
  }
  return result;
}

export function calculateGrandTotalMinutes(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => sum + getWorkedMinutes(s.startTime, s.endTime, s.breakMinutes), 0);
}
