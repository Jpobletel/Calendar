import { useEffect, useState } from 'react';
import { Download, FileJson, Printer } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SegmentedControl } from '../common/SegmentedControl';
import { useExport } from './ExportProvider';
import { exportAllSchedulesAsJSON, exportScheduleAsJSON } from './exportService';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';
import type { ExportBackground, ExportOrientation, ExportQuality, ExportScope } from './types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule;
}

const SCOPE_LABELS: Record<ExportScope, string> = {
  combined: 'Horario combinado (semana completa)',
  person: 'Horario de una persona',
  allPeople: 'Horarios de todas las personas',
  day: 'Vista diaria (día seleccionado)',
  summary: 'Resumen de horas',
};

export function ExportDialog({ isOpen, onClose, schedule }: ExportDialogProps) {
  const { requestExport } = useExport();
  const pushNotification = useStore((s) => s.pushNotification);
  const appData = useStore((s) => s.data);
  const [scope, setScope] = useState<ExportScope>('combined');
  const [personId, setPersonId] = useState(schedule.people[0]?.id ?? '');
  const [orientation, setOrientation] = useState<ExportOrientation>('portrait');
  const [quality, setQuality] = useState<ExportQuality>('normal');
  const [background, setBackground] = useState<ExportBackground>('light');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!schedule.people.some((person) => person.id === personId)) {
      setPersonId(schedule.people[0]?.id ?? '');
    }
  }, [isOpen, personId, schedule.id, schedule.people]);

  async function handleDownload() {
    if (scope === 'person' && !personId) {
      pushNotification('error', 'Selecciona una persona para exportar su horario.');
      return;
    }
    setBusy(true);
    try {
      await requestExport({
        schedule,
        scope,
        personId: scope === 'person' ? personId : undefined,
        day: scope === 'day' ? schedule.viewSettings.selectedDay : undefined,
        orientation,
        quality,
        background,
        filenamePrefix: scope === 'summary' ? 'resumen-horas' : 'horario',
        filenameSubject:
          scope === 'person' ? schedule.people.find((p) => p.id === personId)?.name ?? schedule.name : schedule.name,
      });
      onClose();
    } catch {
      // El error ya se notifica dentro de ExportProvider.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Descargar o imprimir horario"
      size="md"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            icon={<Printer className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              onClose();
              window.setTimeout(() => window.print(), 100);
            }}
            fullWidth
            className="sm:w-auto"
          >
            Imprimir / Guardar PDF
          </Button>
          <Button icon={<Download className="h-4 w-4" aria-hidden="true" />} onClick={handleDownload} disabled={busy} fullWidth className="sm:w-auto">
            {busy ? 'Generando…' : 'Descargar PNG'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Exportar datos (JSON, para respaldo o importar después)</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              icon={<FileJson className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                exportScheduleAsJSON(schedule, appData.settings);
                pushNotification('success', 'Archivo exportado correctamente.');
              }}
              fullWidth
              className="sm:w-auto"
            >
              Solo este horario
            </Button>
            <Button
              variant="secondary"
              icon={<FileJson className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                exportAllSchedulesAsJSON(appData);
                pushNotification('success', 'Respaldo de todos los horarios exportado correctamente.');
              }}
              fullWidth
              className="sm:w-auto"
            >
              Todos los horarios (respaldo)
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">¿Qué imagen quieres descargar?</h3>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Contenido a exportar">
            {(Object.keys(SCOPE_LABELS) as ExportScope[]).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scope === value}
                onClick={() => setScope(value)}
                className={`flex min-h-touch items-center rounded-xl border px-3 text-left text-sm font-medium ${
                  scope === value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
                    : 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200'
                }`}
              >
                {SCOPE_LABELS[value]}
              </button>
            ))}
          </div>
        </section>

        {scope === 'person' && (
          <section>
            <label htmlFor="export-person" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Persona
            </label>
            <select
              id="export-person"
              value={personId}
              onChange={(event) => setPersonId(event.target.value)}
              className="min-h-touch w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {schedule.people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Orientación</h3>
          <SegmentedControl<ExportOrientation>
            ariaLabel="Orientación de la imagen"
            value={orientation}
            onChange={setOrientation}
            options={[
              { value: 'portrait', label: 'Vertical' },
              { value: 'landscape', label: 'Horizontal' },
            ]}
          />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Calidad</h3>
          <SegmentedControl<ExportQuality>
            ariaLabel="Calidad de la imagen"
            value={quality}
            onChange={setQuality}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'Alta' },
            ]}
          />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Fondo</h3>
          <SegmentedControl<ExportBackground>
            ariaLabel="Color de fondo de la imagen"
            value={background}
            onChange={setBackground}
            options={[
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Oscuro' },
            ]}
          />
        </section>
      </div>
    </Modal>
  );
}
