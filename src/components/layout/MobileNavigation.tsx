import { BarChart3, CalendarDays, Table2, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { useStore } from '../../state/store';
import { useActiveSchedule } from '../../state/selectors';
import type { ViewMode } from '../../types';

const TABS: { value: ViewMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: 'day', label: 'Día', icon: CalendarDays },
  { value: 'week', label: 'Semana', icon: Table2 },
  { value: 'people', label: 'Personas', icon: Users },
  { value: 'summary', label: 'Resumen', icon: BarChart3 },
];

/** Navegación inferior obligatoria en móvil: Día / Semana / Personas / Resumen. */
export function MobileNavigation() {
  const schedule = useActiveSchedule();
  const updateScheduleViewSettings = useStore((s) => s.updateScheduleViewSettings);
  if (!schedule) return null;
  const current = schedule.viewSettings.viewMode;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-safe-bottom backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ value, label, icon: Icon }) => {
          const active = current === value;
          return (
            <li key={value}>
              <button
                type="button"
                onClick={() => updateScheduleViewSettings(schedule.id, { viewMode: value })}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-touch w-full flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
