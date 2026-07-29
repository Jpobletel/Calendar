import { getShiftDurationMinutes, isValidTimeString } from './time';

export interface FieldValidation {
  valid: boolean;
  error?: string;
}

export function validatePersonName(name: string): FieldValidation {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'El nombre de la persona no puede estar vacío.' };
  }
  if (trimmed.length > 60) {
    return { valid: false, error: 'El nombre es demasiado largo (máximo 60 caracteres).' };
  }
  return { valid: true };
}

export function validateScheduleName(name: string): FieldValidation {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'El nombre del horario no puede estar vacío.' };
  }
  if (trimmed.length > 80) {
    return { valid: false, error: 'El nombre es demasiado largo (máximo 80 caracteres).' };
  }
  return { valid: true };
}

export interface ShiftFormInput {
  personId: string;
  day: number | null;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export interface ShiftFormErrors {
  personId?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: string;
}

export function validateShiftForm(input: ShiftFormInput): { valid: boolean; errors: ShiftFormErrors } {
  const errors: ShiftFormErrors = {};

  if (!input.personId) {
    errors.personId = 'Selecciona una persona.';
  }
  if (input.day === null || input.day === undefined || input.day < 0 || input.day > 6) {
    errors.day = 'Selecciona un día.';
  }
  if (!input.startTime) {
    errors.startTime = 'Falta la hora de inicio.';
  } else if (!isValidTimeString(input.startTime)) {
    errors.startTime = 'La hora de inicio no es válida.';
  }
  if (!input.endTime) {
    errors.endTime = 'Falta la hora de término.';
  } else if (!isValidTimeString(input.endTime)) {
    errors.endTime = 'La hora de término no es válida.';
  }
  if (input.breakMinutes < 0) {
    errors.breakMinutes = 'La pausa no puede ser negativa.';
  }

  if (!errors.startTime && !errors.endTime && !errors.breakMinutes) {
    const duration = getShiftDurationMinutes(input.startTime, input.endTime);
    if (input.breakMinutes > duration) {
      errors.breakMinutes = 'La pausa no puede ser mayor que la duración del turno.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
