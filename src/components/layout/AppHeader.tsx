import { useState } from 'react';
import { Download, Menu, Settings, Upload } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SettingsDialog } from './SettingsDialog';
import { ScheduleSelectorDialog } from '../schedules/ScheduleSelectorDialog';
import { ExportDialog } from '../export/ExportDialog';
import { ImportDialog } from '../import/ImportDialog';
import type { Schedule } from '../../types';

interface AppHeaderProps {
  schedule: Schedule | undefined;
  onOpenMenu: () => void;
}

export function AppHeader({ schedule, onOpenMenu }: AppHeaderProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    // Nota: los diálogos se renderizan FUERA de <header> a propósito. El header usa
    // `backdrop-blur` (backdrop-filter), y cualquier ancestro con backdrop-filter/filter/
    // transform crea un "containing block" para elementos position:fixed — si los modales
    // quedaran anidados dentro del header, quedarían recortados a su altura de 56px en vez
    // de cubrir toda la pantalla.
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-slate-200 bg-white/95 px-2 pt-safe-top backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-4">
        <IconButton
          icon={<Menu className="h-5 w-5" aria-hidden="true" />}
          label="Abrir menú de personas y horarios"
          onClick={onOpenMenu}
          className="md:hidden"
        />

        <button
          type="button"
          onClick={() => setScheduleDialogOpen(true)}
          className="flex min-h-touch flex-1 items-center gap-1 overflow-hidden rounded-lg px-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span className="truncate text-base font-semibold text-slate-900 dark:text-white">{schedule?.name ?? 'Horarios'}</span>
        </button>

        <SaveStatusIndicator />
        <IconButton icon={<Upload className="h-5 w-5" aria-hidden="true" />} label="Importar datos" onClick={() => setImportOpen(true)} />
        <IconButton
          icon={<Download className="h-5 w-5" aria-hidden="true" />}
          label="Descargar o imprimir horario"
          onClick={() => setExportOpen(true)}
        />
        <IconButton icon={<Settings className="h-5 w-5" aria-hidden="true" />} label="Configuración" onClick={() => setSettingsOpen(true)} />
      </header>

      <ScheduleSelectorDialog
        isOpen={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        activeScheduleId={schedule?.id}
      />
      {schedule && <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} schedule={schedule} />}
      <ImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} />
      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
