import { describe, expect, it } from 'vitest';
import {
  formatMinutesAsHours,
  getShiftDurationMinutes,
  getWorkedMinutes,
  isOvernightShift,
  minutesToTime,
  timeToMinutes,
} from './time';

describe('timeToMinutes', () => {
  it('convierte horas simples', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('lanza error con formato inválido', () => {
    expect(() => timeToMinutes('25:00')).toThrow();
    expect(() => timeToMinutes('9:00')).toThrow();
    expect(() => timeToMinutes('abc')).toThrow();
  });
});

describe('minutesToTime', () => {
  it('convierte minutos de vuelta a HH:mm', () => {
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(1439)).toBe('23:59');
  });

  it('normaliza valores fuera de rango', () => {
    expect(minutesToTime(1440)).toBe('00:00');
    expect(minutesToTime(-60)).toBe('23:00');
  });
});

describe('isOvernightShift', () => {
  it('detecta turnos que cruzan medianoche', () => {
    expect(isOvernightShift('22:00', '06:00')).toBe(true);
    expect(isOvernightShift('09:00', '18:00')).toBe(false);
    expect(isOvernightShift('09:00', '09:00')).toBe(true);
  });
});

describe('getShiftDurationMinutes', () => {
  it('calcula turnos normales', () => {
    expect(getShiftDurationMinutes('09:00', '18:00')).toBe(9 * 60);
  });

  it('calcula turnos nocturnos que cruzan medianoche', () => {
    expect(getShiftDurationMinutes('22:00', '06:00')).toBe(8 * 60);
  });

  it('nunca retorna duraciones negativas', () => {
    expect(getShiftDurationMinutes('10:00', '10:00')).toBe(0);
    expect(getShiftDurationMinutes('23:00', '00:30')).toBeGreaterThanOrEqual(0);
  });
});

describe('getWorkedMinutes', () => {
  it('descuenta la pausa de la duración total', () => {
    expect(getWorkedMinutes('09:00', '18:00', 60)).toBe(8 * 60);
  });

  it('no permite tiempo trabajado negativo aunque la pausa exceda la duración', () => {
    expect(getWorkedMinutes('09:00', '10:00', 120)).toBe(0);
  });

  it('funciona con turnos nocturnos y pausa', () => {
    expect(getWorkedMinutes('22:00', '06:00', 30)).toBe(8 * 60 - 30);
  });
});

describe('formatMinutesAsHours', () => {
  it('formatea horas exactas', () => {
    expect(formatMinutesAsHours(480)).toBe('8 h');
  });

  it('formatea horas y minutos', () => {
    expect(formatMinutesAsHours(450)).toBe('7 h 30 min');
    expect(formatMinutesAsHours(2535)).toBe('42 h 15 min');
  });

  it('formatea solo minutos cuando hay menos de una hora', () => {
    expect(formatMinutesAsHours(45)).toBe('45 min');
  });

  it('formatea cero', () => {
    expect(formatMinutesAsHours(0)).toBe('0 h');
  });
});
