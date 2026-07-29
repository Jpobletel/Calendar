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

/**
 * Genera un horario de ejemplo que ilustra: varias personas con colores distintos,
 * turnos de lunes a sábado, una persona con dos turnos el mismo día, un turno con
 * pausa, un turno que cruza medianoche y un conflicto de horarios intencional.
 */
export function createSampleSchedule(): Schedule {
  const now = new Date().toISOString();

  const veronica = createPerson('Verónica Soto', PERSON_COLORS[0], 0);
  const camila = createPerson('Camila Rojas', PERSON_COLORS[1], 1);
  const diego = createPerson('Diego Fernández', PERSON_COLORS[2], 2);

  const people = [veronica, camila, diego];

  const shifts: Shift[] = [
    // Verónica: turno normal con pausa (lunes)
    createShift({ personId: veronica.id, day: 0, startTime: '09:00', endTime: '18:00', breakMinutes: 60, location: 'Sucursal Centro' }),
    // Verónica: dos turnos el mismo día (martes, mañana y tarde)
    createShift({ personId: veronica.id, day: 1, startTime: '09:00', endTime: '13:00' }),
    createShift({ personId: veronica.id, day: 1, startTime: '15:00', endTime: '19:00', note: 'Turno partido' }),
    createShift({ personId: veronica.id, day: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 }),
    // Verónica: conflicto de horarios intencional (jueves, turnos superpuestos)
    createShift({ personId: veronica.id, day: 3, startTime: '09:00', endTime: '14:00', note: 'Ejemplo de conflicto' }),
    createShift({ personId: veronica.id, day: 3, startTime: '13:00', endTime: '18:00', note: 'Ejemplo de conflicto' }),

    // Camila: turno nocturno que cruza medianoche (lunes -> martes)
    createShift({ personId: camila.id, day: 0, startTime: '22:00', endTime: '06:00', note: 'Termina al día siguiente' }),
    createShift({ personId: camila.id, day: 2, startTime: '10:00', endTime: '16:00' }),
    createShift({ personId: camila.id, day: 4, startTime: '09:00', endTime: '17:00', breakMinutes: 30 }),
    createShift({ personId: camila.id, day: 5, startTime: '09:00', endTime: '13:00' }),

    // Diego: turnos regulares con pausa, incluyendo sábado
    createShift({ personId: diego.id, day: 1, startTime: '08:00', endTime: '16:00', breakMinutes: 45, location: 'Bodega Norte' }),
    createShift({ personId: diego.id, day: 3, startTime: '08:00', endTime: '16:00', breakMinutes: 45 }),
    createShift({ personId: diego.id, day: 4, startTime: '08:00', endTime: '16:00', breakMinutes: 45 }),
    createShift({ personId: diego.id, day: 5, startTime: '08:00', endTime: '12:00' }),
  ];

  return {
    id: generateId('schedule'),
    name: 'Semana actual',
    people,
    shifts,
    viewSettings: createDefaultViewSettings(people.map((p) => p.id)),
    createdAt: now,
    updatedAt: now,
  };
}

export function createSampleAppData(): AppData {
  const schedule = createSampleSchedule();
  return {
    version: APP_DATA_VERSION,
    schedules: [schedule],
    settings: {
      ...createDefaultSettings(),
      lastScheduleId: schedule.id,
    },
  };
}
