import { Monitor, Moon, Sun } from 'lucide-react';
import { useStore } from '../../state/store';
import { SegmentedControl } from '../common/SegmentedControl';
import type { ThemeMode } from '../../types';

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useStore((s) => s.data.settings.theme);
  const setTheme = useStore((s) => s.setTheme);

  return (
    <SegmentedControl<ThemeMode>
      ariaLabel="Tema de la aplicación"
      value={theme}
      onChange={setTheme}
      className={className}
      options={[
        { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
        { value: 'dark', label: 'Oscuro', icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
        { value: 'system', label: 'Sistema', icon: <Monitor className="h-4 w-4" aria-hidden="true" /> },
      ]}
    />
  );
}
