import { BarChart3, CalendarDays, Grid3x3, Table2, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { useStore } from '../../state/store';
import { useActiveSchedule } from '../../state/selectors';
import type { ViewMode } from '../../types';

const TABS: { value: ViewMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'day', label: 'Día', icon: CalendarDays },
  { value: 'week', label: 'Semana', icon: Table2 },
  { value: 'calendar', label: 'Calendario', icon: Grid3x3 },
  { value: 'people', label: 'Personas', icon: Users },
  { value: 'summary', label: 'Resumen', icon: BarChart3 },
];

/** Navegación inferior móvil para acceder a todas las vistas, incluido el calendario dinámico. */
export function MobileNavigation() {
  const schedule = useActiveSchedule();
  const updateScheduleViewSettings = useStore((s) => s.updateScheduleViewSettings);
  if (!schedule) return null;
  const current = schedule.viewSettings.viewMode;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-safe-left pb-safe-bottom pr-safe-right shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ value, label, icon: Icon }) => {
          const active = current === value;
          return (
            <li key={value}>
              <button
                type="button"
                onClick={() => updateScheduleViewSettings(schedule.id, { viewMode: value })}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-1 px-0.5 pb-1.5 pt-2 text-[10px] font-semibold transition-colors sm:text-xs ${
                  active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`flex h-7 min-w-10 items-center justify-center rounded-full px-2 transition-all ${
                    active ? 'bg-brand-100 dark:bg-brand-950' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
