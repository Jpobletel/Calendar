import { describe, expect, it } from 'vitest';
import { validatePersonName, validateScheduleName, validateShiftForm } from './validation';

describe('validatePersonName', () => {
  it('rechaza nombres vacíos', () => {
    expect(validatePersonName('   ').valid).toBe(false);
  });
  it('acepta nombres válidos', () => {
    expect(validatePersonName('Verónica').valid).toBe(true);
  });
});

describe('validateScheduleName', () => {
  it('rechaza nombres vacíos', () => {
    expect(validateScheduleName('').valid).toBe(false);
  });
});

describe('validateShiftForm', () => {
  it('exige persona, día, horas', () => {
    const { valid, errors } = validateShiftForm({
      personId: '',
      day: null,
      startTime: '',
      endTime: '',
      breakMinutes: 0,
    });
    expect(valid).toBe(false);
    expect(errors.personId).toBeDefined();
    expect(errors.day).toBeDefined();
    expect(errors.startTime).toBeDefined();
    expect(errors.endTime).toBeDefined();
  });

  it('rechaza pausas negativas', () => {
    const { errors } = validateShiftForm({
      personId: 'p1',
      day: 0,
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: -10,
    });
    expect(errors.breakMinutes).toBeDefined();
  });

  it('rechaza pausas mayores que la duración del turno', () => {
    const { errors } = validateShiftForm({
      personId: 'p1',
      day: 0,
      startTime: '09:00',
      endTime: '10:00',
      breakMinutes: 90,
    });
    expect(errors.breakMinutes).toBeDefined();
  });

  it('rechaza turnos sin duración y pausas iguales a toda la duración', () => {
    expect(
      validateShiftForm({
        personId: 'p1',
        day: 0,
        startTime: '09:00',
        endTime: '09:00',
        breakMinutes: 0,
      }).valid,
    ).toBe(false);
    expect(
      validateShiftForm({
        personId: 'p1',
        day: 0,
        startTime: '09:00',
        endTime: '10:00',
        breakMinutes: 60,
      }).valid,
    ).toBe(false);
  });

  it('acepta un turno válido', () => {
    const { valid } = validateShiftForm({
      personId: 'p1',
      day: 0,
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60,
    });
    expect(valid).toBe(true);
  });
});
