export const HOUR_HEIGHT = 56;
export const SNAP_MINUTES = 15;
export const MIN_DURATION_MINUTES = 15;
export const MOVE_THRESHOLD_PX = 6;
export const HANDLE_HEIGHT = 8;
export const MIN_BLOCK_HEIGHT = 32;

export function snapMinutes(minutes: number, snap: number = SNAP_MINUTES): number {
  return Math.round(minutes / snap) * snap;
}

export function clampMinutes(minutes: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, minutes));
}

/** Convierte una coordenada vertical del puntero en minutos, dado el borde superior de la columna del día. */
export function minutesFromClientY(clientY: number, columnTop: number, rangeStartMinutes: number): number {
  return rangeStartMinutes + ((clientY - columnTop) / HOUR_HEIGHT) * 60;
}

export interface ResolvedColumn {
  day: number;
  rect: DOMRect;
}

/** Encuentra la columna de día (marcada con data-day-column) que está bajo un punto de la pantalla. */
export function resolveColumnAtPoint(clientX: number, clientY: number): ResolvedColumn | null {
  const el = document.elementFromPoint(clientX, clientY);
  const columnEl = el?.closest<HTMLElement>('[data-day-column]');
  if (!columnEl) return null;
  const day = Number(columnEl.dataset.dayColumn);
  if (Number.isNaN(day)) return null;
  return { day, rect: columnEl.getBoundingClientRect() };
}

export type DragKind = 'create' | 'move' | 'resize-start' | 'resize-end';

export interface DragPreview {
  kind: DragKind;
  day: number;
  startMinutes: number;
  endMinutes: number;
  personId: string;
  /** Presente en 'move' y 'resize-*': el turno real que se está modificando. */
  shiftId?: string;
}
