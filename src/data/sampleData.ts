import type { AppData, AppSettings, Person, Schedule, ScheduleViewSettings, Shift } from '../types';
import { APP_DATA_VERSION, PERSON_COLORS } from '../types';
import { generateId } from '../utils/id';

export function createDefaultViewSettings(selectedPersonIds: string[] = []): ScheduleViewSettings {
  return {
    selectedPersonIds,
    viewMode: 'week',
    weekStart: 'monday',
    dayFilter: 'all',
    calendarRangeMode: 'auto',
    calendarStart: '06:00',
    calendarEnd: '23:00',
    selectedDay: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
    activePersonId: selectedPersonIds[0] ?? null,
  };
}

export function createDefaultSettings(): AppSettings {
  return {
    theme: 'system',
    lastScheduleId: null,
    sampleDataDismissed: false,
  };
}

export function createPerson(name: string, color: string, order: number): Person {
  return {
    id: generateId('person'),
    name,
    color,
    visible: true,
    order,
    createdAt: new Date().toISOString(),
  };
}

export function createShift(input: {
  personId: string;
  day: number;
  startTime: string;
  endTime: string;
  breakMinutes?: number;
  note?: string;
  location?: string;
}): Shift {
  const now = new Date().toISOString();
  return {
    id: generateId('shift'),
    personId: input.personId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    breakMinutes: input.breakMinutes ?? 0,
    note: input.note,
    location: input.location,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptySchedule(name: string): Schedule {
  const now = new Date().toISOString();
  return {
    id: generateId('schedule'),
    name,
    people: [],
    shifts: [],
    viewSettings: createDefaultViewSettings(),
    createdAt: now,
    updatedAt: now,
  };
}

const VERONICA_COLOR = PERSON_COLORS[10]; // teal, a tono con las plantillas originales

/** Construye un horario de ejemplo con una sola persona (Verónica López) y sus turnos de lunes a viernes. */
function buildVeronicaSchedule(name: string, shiftInputs: Array<{ day: number; startTime: string; endTime: string }>): Schedule {
  const now = new Date().toISOString();
  const veronica = createPerson('Verónica López', VERONICA_COLOR, 0);
  const shifts = shiftInputs.map((input) => createShift({ personId: veronica.id, ...input }));

  return {
    id: generateId('schedule'),
    name,
    people: [veronica],
    shifts,
    viewSettings: {
      ...createDefaultViewSettings([veronica.id]),
      dayFilter: 'weekdays',
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Tres opciones de "jornada pareja" para la misma persona (Verónica López), ilustrando
 * que un mismo horario guardado puede tener varias variantes independientes entre las
 * que se puede cambiar con el selector de horarios. Los tres reparten 40 horas semanales
 * de lunes a viernes de formas distintas.
 */
export function createSampleSchedules(): Schedule[] {
  const option1 = buildVeronicaSchedule('Opción 1 · Jornada pareja', [
    // 8 h netas cada día, salida siempre a las 18:00 (turno partido con colación 14:30–16:00)
    { day: 0, startTime: '08:30', endTime: '14:30' },
    { day: 0, startTime: '16:00', endTime: '18:00' },
    { day: 1, startTime: '08:30', endTime: '14:30' },
    { day: 1, startTime: '16:00', endTime: '18:00' },
    { day: 2, startTime: '08:30', endTime: '14:30' },
    { day: 2, startTime: '16:00', endTime: '18:00' },
    { day: 3, startTime: '08:30', endTime: '14:30' },
    { day: 3, startTime: '16:00', endTime: '18:00' },
    { day: 4, startTime: '08:30', endTime: '14:30' },
    { day: 4, startTime: '16:00', endTime: '18:00' },
  ]);

  const option2 = buildVeronicaSchedule('Opción 2 · Jornada pareja', [
    // Lunes a jueves: turno partido más corto en la tarde (7,5 h). Viernes: jornada continua sin colación (10 h).
    { day: 0, startTime: '08:30', endTime: '14:30' },
    { day: 0, startTime: '16:00', endTime: '17:30' },
    { day: 1, startTime: '08:30', endTime: '14:30' },
    { day: 1, startTime: '16:00', endTime: '17:30' },
    { day: 2, startTime: '08:30', endTime: '14:30' },
    { day: 2, startTime: '16:00', endTime: '17:30' },
    { day: 3, startTime: '08:30', endTime: '14:30' },
    { day: 3, startTime: '16:00', endTime: '17:30' },
    { day: 4, startTime: '08:30', endTime: '18:30' },
  ]);

  const option3 = buildVeronicaSchedule('Opción 3 · Jornada pareja', [
    // Lunes y miércoles: turno partido largo en la tarde (8,5 h). Martes y jueves: solo la mañana (6 h).
    // Viernes: jornada continua sin colación, la más larga de la semana (11 h).
    { day: 0, startTime: '08:30', endTime: '14:30' },
    { day: 0, startTime: '16:00', endTime: '18:30' },
    { day: 1, startTime: '08:30', endTime: '14:30' },
    { day: 2, startTime: '08:30', endTime: '14:30' },
    { day: 2, startTime: '16:00', endTime: '18:30' },
    { day: 3, startTime: '08:30', endTime: '14:30' },
    { day: 4, startTime: '08:30', endTime: '19:30' },
  ]);

  return [option1, option2, option3];
}

export function createSampleAppData(): AppData {
  const schedules = createSampleSchedules();
  return {
    version: APP_DATA_VERSION,
    schedules,
    settings: {
      ...createDefaultSettings(),
      lastScheduleId: schedules[0].id,
    },
  };
}
