import type { AppData, ExportedData, Schedule } from '../../types';
import { APP_DATA_VERSION } from '../../types';
import { downloadJSON, generateFilename } from '../../utils/files';

/** Exporta un único horario a un archivo JSON descargable. */
export function exportScheduleAsJSON(schedule: Schedule, settings: AppData['settings']): void {
  const payload: ExportedData = {
    version: APP_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    schedules: [schedule],
    settings,
  };
  downloadJSON(payload, generateFilename('horario', schedule.name, 'json'));
}

/** Exporta todos los horarios guardados a un archivo JSON descargable (respaldo completo). */
export function exportAllSchedulesAsJSON(data: AppData): void {
  const payload: ExportedData = {
    version: APP_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    schedules: data.schedules,
    settings: data.settings,
  };
  downloadJSON(payload, generateFilename('respaldo-horarios', 'completo', 'json'));
}
