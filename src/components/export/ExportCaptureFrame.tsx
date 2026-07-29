import { forwardRef, useEffect } from 'react';
import { ExportContent } from './ExportContent';
import type { ExportJob } from './types';

interface ExportCaptureFrameProps {
  job: ExportJob;
  onReady: () => void;
}

/**
 * Contenedor fuera de pantalla, dedicado exclusivamente a generar imágenes o impresión.
 * No incluye botones, menús ni controles de edición, y siempre renderiza el horario
 * completo (no lo que esté visible en el viewport actual).
 */
export const ExportCaptureFrame = forwardRef<HTMLDivElement, ExportCaptureFrameProps>(function ExportCaptureFrame(
  { job, onReady },
  ref,
) {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // continuar de todas formas
        }
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) onReady();
        });
      });
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: -99999, zIndex: -1, pointerEvents: 'none' }} aria-hidden="true">
      <div
        ref={ref}
        style={{
          width: job.orientation === 'landscape' ? 1400 : 960,
          padding: 32,
          backgroundColor: job.background === 'dark' ? '#0f172a' : '#ffffff',
        }}
      >
        <ExportContent job={job} />
      </div>
    </div>
  );
});
