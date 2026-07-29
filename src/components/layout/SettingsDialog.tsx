import { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ThemeToggle } from './ThemeToggle';
import { SegmentedControl } from '../common/SegmentedControl';
import { useStore } from '../../state/store';
import { useActiveSchedule } from '../../state/selectors';
import type { CalendarRangeMode, DayFilterMode, WeekStart } from '../../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const schedule = useActiveSchedule();
  const updateScheduleViewSettings = useStore((s) => s.updateScheduleViewSettings);
  const addSampleSchedule = useStore((s) => s.addSampleSchedule);
  const hardReset = useStore((s) => s.hardReset);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  if (!schedule) return null;
  const { viewSettings } = schedule;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Configuración" size="md">
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Apariencia</h3>
            <ThemeToggle />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">La semana comienza en</h3>
            <SegmentedControl<WeekStart>
              ariaLabel="Primer día de la semana"
              value={viewSettings.weekStart}
              onChange={(weekStart) => updateScheduleViewSettings(schedule.id, { weekStart })}
              options={[
                { value: 'monday', label: 'Lunes' },
                { value: 'sunday', label: 'Domingo' },
              ]}
            />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Días a mostrar</h3>
            <SegmentedControl<DayFilterMode>
              ariaLabel="Días visibles en las vistas semanales"
              value={viewSettings.dayFilter}
              onChange={(dayFilter) => updateScheduleViewSettings(schedule.id, { dayFilter })}
              options={[
                { value: 'all', label: 'Los 7 días' },
                { value: 'weekdays', label: 'Lunes a viernes' },
                { value: 'withShifts', label: 'Solo con turnos' },
              ]}
            />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Rango horario del calendario</h3>
            <SegmentedControl<CalendarRangeMode>
              ariaLabel="Rango de horas visible en la vista calendario"
              value={viewSettings.calendarRangeMode}
              onChange={(calendarRangeMode) => updateScheduleViewSettings(schedule.id, { calendarRangeMode })}
              options={[
                { value: 'auto', label: 'Automático' },
                { value: 'business', label: '06:00 - 23:00' },
                { value: 'full', label: '00:00 - 24:00' },
              ]}
            />
          </section>

          <section className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Datos de ejemplo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Agrega las 3 opciones de horario de ejemplo (misma persona, distinta distribución de horas) para ver cómo
              funciona la aplicación, o elimina tus datos si quieres empezar de cero.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => addSampleSchedule()}>
                Agregar horarios de ejemplo
              </Button>
              <Button variant="danger" onClick={() => setConfirmResetOpen(true)}>
                Restablecer todos los datos
              </Button>
            </div>
          </section>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Restablecer todos los datos"
        message="Esto eliminará permanentemente todos los horarios, personas y turnos guardados en este navegador, y los reemplazará por los datos de ejemplo. Esta acción no se puede deshacer. Te recomendamos exportar un respaldo antes de continuar."
        confirmLabel="Restablecer"
        onConfirm={() => {
          hardReset();
          setConfirmResetOpen(false);
          onClose();
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </>
  );
}
