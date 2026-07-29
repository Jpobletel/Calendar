import { describe, expect, it } from 'vitest';
import type { Shift } from '../types';
import { calculateDailyTotal, calculatePersonStats, calculateWeeklyTotal } from './totals';

function makeShift(overrides: Partial<Shift>): Shift {
  return {
    id: overrides.id ?? 'shift-1',
    personId: overrides.personId ?? 'person-1',
    day: overrides.day ?? 0,
    startTime: overrides.startTime ?? '09:00',
    endTime: overrides.endTime ?? '17:00',
    breakMinutes: overrides.breakMinutes ?? 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculateDailyTotal', () => {
  it('suma varios turnos del mismo día para una persona', () => {
    const shifts = [
      makeShift({ id: 'a', day: 0, startTime: '09:00', endTime: '13:00' }),
      makeShift({ id: 'b', day: 0, startTime: '15:00', endTime: '18:00' }),
      makeShift({ id: 'c', day: 1, startTime: '09:00', endTime: '18:00' }),
    ];
    expect(calculateDailyTotal(shifts, 'person-1', 0)).toBe(7 * 60);
  });
});

describe('calculateWeeklyTotal', () => {
  it('suma todos los turnos de la semana descontando pausas', () => {
    const shifts = [
      makeShift({ id: 'a', day: 0, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }),
      makeShift({ id: 'b', day: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }),
    ];
    expect(calculateWeeklyTotal(shifts, 'person-1')).toBe(16 * 60);
  });
});

describe('calculatePersonStats', () => {
  it('calcula estadísticas completas incluyendo turno nocturno', () => {
    const shifts = [
      makeShift({ id: 'a', day: 0, startTime: '09:00', endTime: '17:00', breakMinutes: 60 }),
      makeShift({ id: 'b', day: 2, startTime: '22:00', endTime: '06:00' }),
    ];
    const stats = calculatePersonStats(shifts, 'person-1');
    expect(stats.shiftCount).toBe(2);
    expect(stats.daysWorked).toBe(2);
    expect(stats.weeklyMinutes).toBe(7 * 60 + 8 * 60);
    expect(stats.firstStart).toBe('09:00');
    expect(stats.lastEnd).toBe('17:00');
    expect(stats.avgMinutesPerDayWorked).toBeCloseTo((7 * 60 + 8 * 60) / 2);
  });

  it('retorna ceros cuando la persona no tiene turnos', () => {
    const stats = calculatePersonStats([], 'person-1');
    expect(stats.weeklyMinutes).toBe(0);
    expect(stats.shiftCount).toBe(0);
    expect(stats.daysWorked).toBe(0);
    expect(stats.firstStart).toBeNull();
  });
});
