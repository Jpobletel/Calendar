import type { AppData, AppSettings, ExportedData, Person, Schedule, ScheduleViewSettings, Shift } from '../types';
import { isValidTimeString } from '../utils/time';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}
function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}
function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function validatePerson(value: unknown, errors: string[], path: string): value is Person {
  if (!isObject(value)) {
    errors.push(`${path}: la persona no es un objeto válido.`);
    return false;
  }
  let ok = true;
  if (!isString(value.id) || value.id.length === 0) { errors.push(`${path}.id: identificador faltante o inválido.`); ok = false; }
  if (!isString(value.name)) { errors.push(`${path}.name: nombre faltante o inválido.`); ok = false; }
  if (!isString(value.color)) { errors.push(`${path}.color: color faltante o inválido.`); ok = false; }
  if (!isBoolean(value.visible)) { errors.push(`${path}.visible: debe ser verdadero o falso.`); ok = false; }
  if (!isNumber(value.order)) { errors.push(`${path}.order: debe ser un número.`); ok = false; }
  if (!isString(value.createdAt)) { errors.push(`${path}.createdAt: fecha faltante o inválida.`); ok = false; }
  return ok;
}

function validateShift(value: unknown, errors: string[], path: string): value is Shift {
  if (!isObject(value)) {
    errors.push(`${path}: el turno no es un objeto válido.`);
    return false;
  }
  let ok = true;
  if (!isString(value.id) || value.id.length === 0) { errors.push(`${path}.id: identificador faltante o inválido.`); ok = false; }
  if (!isString(value.personId) || value.personId.length === 0) { errors.push(`${path}.personId: persona asignada faltante.`); ok = false; }
  if (!isNumber(value.day) || value.day < 0 || value.day > 6) { errors.push(`${path}.day: debe ser un número entre 0 (lunes) y 6 (domingo).`); ok = false; }
  if (!isString(value.startTime) || !isValidTimeString(value.startTime)) { errors.push(`${path}.startTime: hora de inicio inválida.`); ok = false; }
  if (!isString(value.endTime) || !isValidTimeString(value.endTime)) { errors.push(`${path}.endTime: hora de término inválida.`); ok = false; }
  if (!isNumber(value.breakMinutes) || value.breakMinutes < 0) { errors.push(`${path}.breakMinutes: la pausa debe ser un número mayor o igual a 0.`); ok = false; }
  if (value.note !== undefined && !isString(value.note)) { errors.push(`${path}.note: debe ser texto.`); ok = false; }
  if (value.location !== undefined && !isString(value.location)) { errors.push(`${path}.location: debe ser texto.`); ok = false; }
  if (!isString(value.createdAt)) { errors.push(`${path}.createdAt: fecha de creación faltante.`); ok = false; }
  if (!isString(value.updatedAt)) { errors.push(`${path}.updatedAt: fecha de modificación faltante.`); ok = false; }
  return ok;
}

function validateViewSettings(value: unknown, errors: string[], path: string): value is ScheduleViewSettings {
  if (!isObject(value)) {
    errors.push(`${path}: configuración de visualización inválida.`);
    return false;
  }
  let ok = true;
  if (!isArray(value.selectedPersonIds)) { errors.push(`${path}.selectedPersonIds: debe ser una lista.`); ok = false; }
  if (!isString(value.viewMode)) { errors.push(`${path}.viewMode: debe ser texto.`); ok = false; }
  if (!isString(value.weekStart)) { errors.push(`${path}.weekStart: debe ser texto.`); ok = false; }
  if (!isString(value.dayFilter)) { errors.push(`${path}.dayFilter: debe ser texto.`); ok = false; }
  if (!isString(value.calendarRangeMode)) { errors.push(`${path}.calendarRangeMode: debe ser texto.`); ok = false; }
  if (!isString(value.calendarStart)) { errors.push(`${path}.calendarStart: debe ser texto.`); ok = false; }
  if (!isString(value.calendarEnd)) { errors.push(`${path}.calendarEnd: debe ser texto.`); ok = false; }
  if (!isNumber(value.selectedDay)) { errors.push(`${path}.selectedDay: debe ser un número.`); ok = false; }
  // Campo agregado después del lanzamiento inicial: opcional para no invalidar datos ya guardados.
  if (value.activePersonId !== undefined && value.activePersonId !== null && !isString(value.activePersonId)) {
    errors.push(`${path}.activePersonId: debe ser texto o nulo.`);
    ok = false;
  }
  return ok;
}

function validateSchedule(value: unknown, errors: string[], path: string): value is Schedule {
  if (!isObject(value)) {
    errors.push(`${path}: el horario no es un objeto válido.`);
    return false;
  }
  let ok = true;
  if (!isString(value.id) || value.id.length === 0) { errors.push(`${path}.id: identificador faltante.`); ok = false; }
  if (!isString(value.name) || value.name.trim().length === 0) { errors.push(`${path}.name: el nombre del horario no puede estar vacío.`); ok = false; }
  if (!isArray(value.people)) {
    errors.push(`${path}.people: debe ser una lista de personas.`);
    ok = false;
  } else {
    value.people.forEach((p, i) => { ok = validatePerson(p, errors, `${path}.people[${i}]`) && ok; });
  }
  if (!isArray(value.shifts)) {
    errors.push(`${path}.shifts: debe ser una lista de turnos.`);
    ok = false;
  } else {
    value.shifts.forEach((s, i) => { ok = validateShift(s, errors, `${path}.shifts[${i}]`) && ok; });
  }
  if (!validateViewSettings(value.viewSettings, errors, `${path}.viewSettings`)) ok = false;
  if (!isString(value.createdAt)) { errors.push(`${path}.createdAt: fecha faltante.`); ok = false; }
  if (!isString(value.updatedAt)) { errors.push(`${path}.updatedAt: fecha faltante.`); ok = false; }

  if (ok && isArray(value.shifts) && isArray(value.people)) {
    const peopleIds = new Set((value.people as Person[]).map((p) => p.id));
    (value.shifts as Shift[]).forEach((s, i) => {
      if (!peopleIds.has(s.personId)) {
        errors.push(`${path}.shifts[${i}]: hace referencia a una persona que no existe (${s.personId}).`);
        ok = false;
      }
    });
  }
  return ok;
}

function validateSettings(value: unknown, errors: string[], path: string): value is AppSettings {
  if (!isObject(value)) {
    errors.push(`${path}: configuración inválida.`);
    return false;
  }
  let ok = true;
  if (!isString(value.theme)) { errors.push(`${path}.theme: debe ser texto.`); ok = false; }
  if (value.lastScheduleId !== null && !isString(value.lastScheduleId)) { errors.push(`${path}.lastScheduleId: debe ser texto o nulo.`); ok = false; }
  if (!isBoolean(value.sampleDataDismissed)) { errors.push(`${path}.sampleDataDismissed: debe ser verdadero o falso.`); ok = false; }
  return ok;
}

export function validateAppData(value: unknown): ValidationResult & { data?: AppData } {
  const errors: string[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: ['El contenido guardado no es un objeto JSON válido.'] };
  }
  let ok = true;
  if (!isNumber(value.version)) { errors.push('version: falta o es inválida.'); ok = false; }
  if (!isArray(value.schedules)) {
    errors.push('schedules: debe ser una lista de horarios.');
    ok = false;
  } else {
    value.schedules.forEach((s, i) => { ok = validateSchedule(s, errors, `schedules[${i}]`) && ok; });
  }
  if (!validateSettings(value.settings, errors, 'settings')) ok = false;

  if (!ok) return { valid: false, errors };
  return { valid: true, errors: [], data: value as unknown as AppData };
}

export function validateExportedData(value: unknown): ValidationResult & { data?: ExportedData } {
  const errors: string[] = [];
  if (!isObject(value)) {
    return { valid: false, errors: ['El archivo no contiene un objeto JSON válido.'] };
  }
  let ok = true;
  if (!isNumber(value.version)) { errors.push('version: falta el número de versión del formato.'); ok = false; }
  if (!isString(value.exportedAt)) { errors.push('exportedAt: falta la fecha de exportación.'); ok = false; }
  if (!isArray(value.schedules)) {
    errors.push('schedules: el archivo debe contener una lista de horarios.');
    ok = false;
  } else if (value.schedules.length === 0) {
    errors.push('schedules: el archivo no contiene ningún horario.');
    ok = false;
  } else {
    value.schedules.forEach((s, i) => { ok = validateSchedule(s, errors, `schedules[${i}]`) && ok; });
  }
  if (value.settings !== undefined && !validateSettings(value.settings, errors, 'settings')) ok = false;

  if (!ok) return { valid: false, errors };
  return { valid: true, errors: [], data: value as unknown as ExportedData };
}
