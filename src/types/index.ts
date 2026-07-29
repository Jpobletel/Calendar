/**
 * Modelo de datos central de la aplicación.
 * day: índice de día de la semana, 0 = lunes ... 6 = domingo (independiente
 * de si la interfaz se muestra empezando el lunes o el domingo).
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export type WeekStart = 'monday' | 'sunday';

export type CalendarRangeMode = 'full' | 'business' | 'auto';

/**
 * Vistas disponibles para mostrar un horario.
 * day: vista por día (predeterminada en móvil).
 * week: tabla semanal compacta (personas x días).
 * calendar: vista tipo calendario con eje de horas y bloques por persona (vista combinada).
 * people: tarjetas por persona.
 * summary: resumen de horas.
 */
export type ViewMode = 'day' | 'week' | 'calendar' | 'people' | 'summary';

export type DayFilterMode = 'all' | 'weekdays' | 'withShifts';

export interface Person {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  order: number;
  createdAt: string;
}

export interface Shift {
  id: string;
  personId: string;
  /** 0 = lunes ... 6 = domingo */
  day: number;
  /** Formato HH:mm, 24 horas */
  startTime: string;
  /** Formato HH:mm, 24 horas. Si es < startTime, el turno cruza medianoche. */
  endTime: string;
  breakMinutes: number;
  note?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewShiftInput {
  personId: string;
  day: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  note?: string;
  location?: string;
}

export interface ScheduleViewSettings {
  selectedPersonIds: string[];
  viewMode: ViewMode;
  weekStart: WeekStart;
  dayFilter: DayFilterMode;
  calendarRangeMode: CalendarRangeMode;
  calendarStart: string;
  calendarEnd: string;
  selectedDay: number;
  /** Persona activa para crear turnos rápidamente arrastrando en la vista Calendario. */
  activePersonId: string | null;
}

export interface Schedule {
  id: string;
  name: string;
  people: Person[];
  shifts: Shift[];
  viewSettings: ScheduleViewSettings;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: ThemeMode;
  lastScheduleId: string | null;
  sampleDataDismissed: boolean;
}

export const APP_DATA_VERSION = 1;

export interface AppData {
  version: number;
  schedules: Schedule[];
  settings: AppSettings;
}

export interface ExportedData {
  version: number;
  exportedAt: string;
  schedules: Schedule[];
  settings: AppSettings;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  /** Si es true, la notificación no se cierra automáticamente. */
  persistent?: boolean;
  createdAt: number;
  /** Acción opcional de deshacer. */
  undo?: {
    label: string;
    onUndo: () => void;
  };
}

export interface Conflict {
  personId: string;
  day: number;
  shiftIds: [string, string];
  overlapMinutes: number;
}

export type SummarySortBy = 'name' | 'hoursDesc' | 'hoursAsc' | 'shiftsDesc' | 'shiftsAsc';
export type SummaryFilterBy = 'visible' | 'all' | 'withShifts' | 'withoutShifts';

export const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

export const PERSON_COLORS = [
  '#3b66f5', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#d946ef',
] as const;
