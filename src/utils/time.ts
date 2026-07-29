/**
 * Utilidades de tiempo. Todos los cálculos internos se hacen en minutos
 * para evitar errores de redondeo con números decimales de horas.
 */

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Convierte "HH:mm" a minutos desde medianoche. Lanza si el formato es inválido. */
export function timeToMinutes(time: string): number {
  const match = TIME_RE.exec(time);
  if (!match) {
    throw new Error(`Hora inválida: "${time}". Se espera formato HH:mm.`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/** Convierte minutos desde medianoche a "HH:mm". El valor se normaliza dentro de 0-1439. */
export function minutesToTime(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function isValidTimeString(time: string): boolean {
  return TIME_RE.test(time);
}

/** Un turno cruza medianoche cuando su hora de término es menor o igual a la de inicio. */
export function isOvernightShift(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) <= timeToMinutes(startTime);
}

/** Duración total del turno en minutos, incluyendo pausa. Nunca es negativa. */
export function getShiftDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (end > start) return end - start;
  if (end === start) return 0;
  return 24 * 60 - start + end;
}

/** Duración trabajada, descontando la pausa. Nunca es negativa. */
export function getWorkedMinutes(startTime: string, endTime: string, breakMinutes: number): number {
  const total = getShiftDurationMinutes(startTime, endTime);
  const worked = total - Math.max(0, breakMinutes);
  return Math.max(0, worked);
}

/** Formatea minutos como texto legible: "8 h", "7 h 30 min", "45 min", "0 h". */
export function formatMinutesAsHours(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0 && mins === 0) return '0 h';
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

/** Calcula el solapamiento en minutos entre dos intervalos [start, end). 0 si no se solapan. */
export function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
  return overlap > 0 ? overlap : 0;
}
