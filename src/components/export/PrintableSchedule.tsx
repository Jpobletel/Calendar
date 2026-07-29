import { ExportContent } from './ExportContent';
import { useActiveSchedule } from '../../state/selectors';
import type { ExportJob } from './types';

/**
 * Contenido exclusivo para impresión (@media print). Permanece oculto en pantalla y
 * solo se muestra al imprimir o guardar como PDF desde el navegador.
 */
export function PrintableSchedule() {
  const schedule = useActiveSchedule();
  if (!schedule) return null;

  const job: ExportJob = {
    schedule,
    scope: 'combined',
    orientation: 'portrait',
    quality: 'normal',
    background: 'light',
    filenamePrefix: 'horario',
    filenameSubject: schedule.name,
  };

  return (
    <div id="print-root" className="hidden print:block">
      <ExportContent job={job} />
    </div>
  );
}
