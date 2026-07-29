import { describe, expect, it } from 'vitest';
import type { Shift } from '../types';
import { detectConflicts, isShiftInConflict } from './conflicts';

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

describe('detectConflicts', () => {
  it('detecta turnos superpuestos el mismo día', () => {
    const shifts = [
      makeShift({ id: 'a', startTime: '09:00', endTime: '14:00' }),
      makeShift({ id: 'b', startTime: '13:00', endTime: '18:00' }),
    ];
    const conflicts = detectConflicts(shifts);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapMinutes).toBe(60);
    expect(isShiftInConflict(conflicts, 'a')).toBe(true);
    expect(isShiftInConflict(conflicts, 'b')).toBe(true);
  });

  it('no reporta conflicto entre turnos que no se tocan', () => {
    const shifts = [
      makeShift({ id: 'a', startTime: '09:00', endTime: '12:00' }),
      makeShift({ id: 'b', startTime: '13:00', endTime: '18:00' }),
    ];
    expect(detectConflicts(shifts)).toHaveLength(0);
  });

  it('no reporta conflictos entre personas distintas', () => {
    const shifts = [
      makeShift({ id: 'a', personId: 'p1', startTime: '09:00', endTime: '14:00' }),
      makeShift({ id: 'b', personId: 'p2', startTime: '09:00', endTime: '14:00' }),
    ];
    expect(detectConflicts(shifts)).toHaveLength(0);
  });

  it('detecta conflictos causados por un turno nocturno que se extiende al día siguiente', () => {
    const shifts = [
      makeShift({ id: 'a', day: 0, startTime: '22:00', endTime: '06:00' }),
      makeShift({ id: 'b', day: 1, startTime: '05:00', endTime: '13:00' }),
    ];
    const conflicts = detectConflicts(shifts);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].overlapMinutes).toBe(60);
  });
});
