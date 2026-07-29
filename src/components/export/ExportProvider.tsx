import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { toPng } from 'html-to-image';
import { ExportCaptureFrame } from './ExportCaptureFrame';
import type { ExportJob } from './types';
import { useStore } from '../../state/store';
import { downloadBlob, generateFilename } from '../../utils/files';

interface ExportContextValue {
  requestExport: (job: ExportJob) => Promise<void>;
}

const ExportContext = createContext<ExportContextValue | null>(null);

export function useExport(): ExportContextValue {
  const ctx = useContext(ExportContext);
  if (!ctx) throw new Error('useExport debe usarse dentro de <ExportProvider>.');
  return ctx;
}

/** Proveedor único que renderiza el contenedor oculto de captura y coordina la generación de imágenes PNG. */
export function ExportProvider({ children }: { children: ReactNode }) {
  const [job, setJob] = useState<ExportJob | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<{ resolve: () => void; reject: (error: unknown) => void } | null>(null);
  const pushNotification = useStore((s) => s.pushNotification);

  const requestExport = useCallback((newJob: ExportJob) => {
    return new Promise<void>((resolve, reject) => {
      pendingRef.current = { resolve, reject };
      setJob(newJob);
    });
  }, []);

  const handleReady = useCallback(async () => {
    if (!job || !containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        pixelRatio: job.quality === 'high' ? 3 : 2,
        backgroundColor: job.background === 'dark' ? '#0f172a' : '#ffffff',
      });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      downloadBlob(blob, generateFilename(job.filenamePrefix, job.filenameSubject, 'png'));
      pushNotification('success', 'Imagen generada y descargada correctamente.');
      pendingRef.current?.resolve();
    } catch (error) {
      pushNotification(
        'error',
        `No se pudo generar la imagen: ${error instanceof Error ? error.message : 'error desconocido'}.`,
        { persistent: true },
      );
      pendingRef.current?.reject(error);
    } finally {
      setJob(null);
      pendingRef.current = null;
    }
  }, [job, pushNotification]);

  return (
    <ExportContext.Provider value={{ requestExport }}>
      {children}
      {job && <ExportCaptureFrame ref={containerRef} job={job} onReady={handleReady} />}
    </ExportContext.Provider>
  );
}
