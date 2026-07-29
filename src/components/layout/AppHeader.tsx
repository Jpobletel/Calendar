import { useState } from 'react';
import { CalendarClock, Camera, Download, Menu, MoreHorizontal, Save, Settings, Upload } from 'lucide-react';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import { SettingsDialog } from './SettingsDialog';
import { ScheduleSelectorDialog } from '../schedules/ScheduleSelectorDialog';
import { ExportDialog } from '../export/ExportDialog';
import { useExport } from '../export/ExportProvider';
import { ImportDialog } from '../import/ImportDialog';
import { useStore } from '../../state/store';
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
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const saveNow = useStore((s) => s.saveNow);
  const { requestExport } = useExport();

  async function saveCalendarPhoto() {
    if (!schedule || savingPhoto) return;
    setSavingPhoto(true);
    try {
      await requestExport({
        schedule,
        scope: 'calendarSnapshot',
        orientation: 'landscape',
        quality: 'normal',
        background: 'light',
        filenamePrefix: 'calendario',
        filenameSubject: schedule.name,
      });
      setMobileActionsOpen(false);
    } catch {
      // ExportProvider muestra el detalle del error.
    } finally {
      setSavingPhoto(false);
    }
  }

  return (
    // Nota: los diálogos se renderizan FUERA de <header> a propósito. El header usa
    // `backdrop-blur` (backdrop-filter), y cualquier ancestro con backdrop-filter/filter/
    // transform crea un "containing block" para elementos position:fixed — si los modales
    // quedaran anidados dentro del header, quedarían recortados a su altura de 56px en vez
    // de cubrir toda la pantalla.
    <>
      <header className="sticky top-0 z-30 flex min-h-14 items-center gap-1 border-b border-white/80 bg-white/85 px-2 pb-1 pt-[calc(0.25rem+env(safe-area-inset-top))] shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85 sm:px-4 sm:py-0">
        <IconButton
          icon={<Menu className="h-5 w-5" aria-hidden="true" />}
          label="Abrir menú de personas y horarios"
          onClick={onOpenMenu}
          className="md:hidden"
        />

        <span className="ml-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/25 sm:flex">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
        </span>
        <button
          type="button"
          onClick={() => setScheduleDialogOpen(true)}
          className="group flex min-h-touch flex-1 items-center gap-1 overflow-hidden rounded-xl px-2 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
        >
          <span className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">{schedule?.name ?? 'Horarios'}</span>
        </button>

        <div className="hidden lg:block">
          <SaveStatusIndicator />
        </div>
        <span className="hidden sm:block">
          <IconButton icon={<Upload className="h-5 w-5" aria-hidden="true" />} label="Importar datos" onClick={() => setImportOpen(true)} />
        </span>
        <IconButton
          icon={<Download className="h-5 w-5" aria-hidden="true" />}
          label="Descargar o imprimir horario"
          onClick={() => setExportOpen(true)}
        />
        <span className="hidden sm:block">
          <IconButton icon={<Settings className="h-5 w-5" aria-hidden="true" />} label="Configuración" onClick={() => setSettingsOpen(true)} />
        </span>
        <IconButton
          icon={<MoreHorizontal className="h-5 w-5" aria-hidden="true" />}
          label="Más acciones"
          onClick={() => setMobileActionsOpen(true)}
          className="sm:hidden"
        />
      </header>

      <ScheduleSelectorDialog
        isOpen={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        activeScheduleId={schedule?.id}
      />
      {schedule && <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} schedule={schedule} />}
      <ImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} />
      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Modal isOpen={mobileActionsOpen} onClose={() => setMobileActionsOpen(false)} title="Más acciones" size="sm">
        <div className="flex flex-col gap-1">
          <MobileAction
            icon={<Save className="h-5 w-5" aria-hidden="true" />}
            label="Guardar cambios"
            onClick={() => {
              saveNow();
              setMobileActionsOpen(false);
            }}
          />
          <MobileAction
            icon={<Camera className="h-5 w-5" aria-hidden="true" />}
            label={savingPhoto ? 'Generando foto…' : 'Guardar foto del calendario'}
            disabled={savingPhoto || !schedule}
            onClick={() => void saveCalendarPhoto()}
          />
          <MobileAction
            icon={<Upload className="h-5 w-5" aria-hidden="true" />}
            label="Importar datos"
            onClick={() => {
              setMobileActionsOpen(false);
              setImportOpen(true);
            }}
          />
          <MobileAction
            icon={<Settings className="h-5 w-5" aria-hidden="true" />}
            label="Configuración"
            onClick={() => {
              setMobileActionsOpen(false);
              setSettingsOpen(true);
            }}
          />
        </div>
      </Modal>
    </>
  );
}

function MobileAction({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: JSX.Element;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:cursor-wait disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {icon}
      </span>
      {label}
    </button>
  );
}
