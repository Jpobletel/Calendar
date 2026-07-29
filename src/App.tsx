import { useState } from 'react';
import { CalendarDays, Grid3x3, Table2, Users, BarChart3 } from 'lucide-react';
import { AppHeader } from './components/layout/AppHeader';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { ToastContainer } from './components/common/ToastContainer';
import { EmptyState } from './components/common/EmptyState';
import { Button } from './components/common/Button';
import { ExportProvider } from './components/export/ExportProvider';
import { PrintableSchedule } from './components/export/PrintableSchedule';
import { DailyMobileView } from './components/calendar/DailyMobileView';
import { WeeklyCompactView } from './components/calendar/WeeklyCompactView';
import { CalendarGridView } from './components/calendar/CalendarGridView';
import { PeopleSchedulesView } from './components/calendar/PeopleSchedulesView';
import { SummaryView } from './components/summaries/SummaryView';
import { SegmentedControl } from './components/common/SegmentedControl';
import { useAppliedTheme } from './hooks/useTheme';
import { useActiveSchedule } from './state/selectors';
import { useStore } from './state/store';
import type { ViewMode } from './types';

const DESKTOP_VIEW_OPTIONS: { value: ViewMode; label: string; icon: JSX.Element }[] = [
  { value: 'day', label: 'Día', icon: <CalendarDays className="h-4 w-4" aria-hidden="true" /> },
  { value: 'week', label: 'Semana', icon: <Table2 className="h-4 w-4" aria-hidden="true" /> },
  { value: 'calendar', label: 'Calendario', icon: <Grid3x3 className="h-4 w-4" aria-hidden="true" /> },
  { value: 'people', label: 'Personas', icon: <Users className="h-4 w-4" aria-hidden="true" /> },
  { value: 'summary', label: 'Resumen', icon: <BarChart3 className="h-4 w-4" aria-hidden="true" /> },
];

function ScheduleWorkspace() {
  const schedule = useActiveSchedule();
  const updateScheduleViewSettings = useStore((s) => s.updateScheduleViewSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!schedule) return null;

  let content: JSX.Element;
  switch (schedule.viewSettings.viewMode) {
    case 'day':
      content = <DailyMobileView schedule={schedule} />;
      break;
    case 'calendar':
      content = <CalendarGridView schedule={schedule} />;
      break;
    case 'people':
      content = <PeopleSchedulesView schedule={schedule} />;
      break;
    case 'summary':
      content = <SummaryView schedule={schedule} />;
      break;
    default:
      content = <WeeklyCompactView schedule={schedule} />;
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:shadow-lg dark:focus:bg-slate-900 dark:focus:text-white"
      >
        Saltar al contenido principal
      </a>
      <AppHeader schedule={schedule} onOpenMenu={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar schedule={schedule} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" className="min-w-0 flex-1 px-3 pb-24 pt-4 sm:px-4 md:pb-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="hidden md:block">
              <SegmentedControl<ViewMode>
                ariaLabel="Seleccionar vista del horario"
                value={schedule.viewSettings.viewMode}
                onChange={(viewMode) => updateScheduleViewSettings(schedule.id, { viewMode })}
                options={DESKTOP_VIEW_OPTIONS}
              />
            </div>
            {schedule.people.length === 0 ? (
              <EmptyState
                title="Todavía no hay personas."
                description="Crea la primera persona para comenzar a organizar el horario. Usa el menú de personas para agregarla."
                action={
                  <Button onClick={() => setSidebarOpen(true)} className="md:hidden">
                    Abrir menú de personas
                  </Button>
                }
              />
            ) : (
              content
            )}
          </div>
        </main>
      </div>
      <MobileNavigation />
      <ToastContainer />
      <PrintableSchedule />
    </div>
  );
}

function CorruptDataBanner() {
  const raw = useStore((s) => s.ui.corruptDataRaw);
  const dismiss = useStore((s) => s.dismissCorruptData);
  const download = useStore((s) => s.downloadCorruptBackup);
  const hardReset = useStore((s) => s.hardReset);
  if (!raw) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
    >
      <p className="font-semibold">No se pudieron leer tus datos guardados: parecen estar dañados.</p>
      <p className="mt-1">Se cargaron datos de ejemplo para que puedas seguir trabajando. Puedes descargar una copia de tus datos originales antes de continuar.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={download}>
          Descargar copia dañada
        </Button>
        <Button variant="secondary" onClick={dismiss}>
          Descartar aviso
        </Button>
        <Button variant="danger" onClick={hardReset}>
          Restablecer todo
        </Button>
      </div>
    </div>
  );
}

function StorageUnavailableBanner() {
  const unavailable = useStore((s) => s.ui.storageUnavailable);
  if (!unavailable) return null;

  return (
    <div
      role="alert"
      className="border-b border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      El almacenamiento local no está disponible en este navegador (por ejemplo, en modo privado). Tus cambios no se guardarán al
      cerrar esta página: exporta un respaldo en JSON antes de salir.
    </div>
  );
}

export default function App() {
  useAppliedTheme();
  return (
    <ExportProvider>
      <CorruptDataBanner />
      <StorageUnavailableBanner />
      <ScheduleWorkspace />
    </ExportProvider>
  );
}
