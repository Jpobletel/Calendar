import { useStore } from './store';
import type { Schedule, ThemeMode } from '../types';

/** Selector reactivo: se re-renderiza solo cuando el horario activo cambia de referencia. */
export function useActiveSchedule(): Schedule | undefined {
  return useStore((s) => s.data.schedules.find((sch) => sch.id === s.data.settings.lastScheduleId) ?? s.data.schedules[0]);
}

export function useSchedules(): Schedule[] {
  return useStore((s) => s.data.schedules);
}

export function useThemeSetting(): ThemeMode {
  return useStore((s) => s.data.settings.theme);
}

export function useSaveStatus() {
  return useStore((s) => s.ui.saveStatus);
}

export function useLastSavedAt(): string | null {
  return useStore((s) => s.ui.lastSavedAt);
}

export function useNotifications() {
  return useStore((s) => s.ui.notifications);
}
