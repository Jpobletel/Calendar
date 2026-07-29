import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useStore } from '../../state/store';
import { readFileAsText } from '../../utils/files';
import { parseImportFile } from './importService';
import type { ExportedData } from '../../types';
import { APP_DATA_VERSION } from '../../types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const replaceAllData = useStore((s) => s.replaceAllData);
  const mergeSchedules = useStore((s) => s.mergeSchedules);
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [parsed, setParsed] = useState<ExportedData | null>(null);
  const [confirmAction, setConfirmAction] = useState<'replace' | 'merge' | null>(null);
  const [fileName, setFileName] = useState('');

  function reset() {
    setErrors([]);
    setParsed(null);
    setFileName('');
    setConfirmAction(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    try {
      const text = await readFileAsText(file);
      const result = parseImportFile(text);
      if (!result.valid || !result.data) {
        setErrors(result.errors);
        setParsed(null);
        return;
      }
      setErrors([]);
      setParsed(result.data);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'No se pudo leer el archivo.']);
      setParsed(null);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Importar datos" size="md">
        <div className="flex flex-col gap-4">
          <div>
            <input
              ref={inputRef}
              id="import-file-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="sr-only"
            />
            <label
              htmlFor="import-file-input"
              className="flex min-h-touch cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 text-center text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300"
            >
              <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{fileName || 'Seleccionar archivo JSON'}</span>
            </label>
          </div>

          {errors.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            >
              <p className="mb-1 font-semibold">El archivo no es válido. No se modificaron tus datos actuales.</p>
              <ul className="list-inside list-disc space-y-0.5">
                {errors.slice(0, 8).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {parsed && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p className="font-semibold">Archivo válido</p>
                <p>
                  Contiene {parsed.schedules.length} horario(s): {parsed.schedules.map((s) => s.name).join(', ')}.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Exportado el {new Date(parsed.exportedAt).toLocaleString('es-CL')}.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" fullWidth onClick={() => setConfirmAction('merge')}>
                  Agregar a mis horarios
                </Button>
                <Button variant="danger" fullWidth onClick={() => setConfirmAction('replace')}>
                  Reemplazar todos mis datos
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmAction === 'merge'}
        title="Agregar horarios importados"
        message={
          <p>
            Se agregarán {parsed?.schedules.length ?? 0} horario(s) nuevo(s) a los que ya tienes. Tus horarios existentes no se
            modificarán, y los identificadores duplicados se resolverán automáticamente.
          </p>
        }
        confirmLabel="Agregar"
        danger={false}
        onConfirm={() => {
          if (parsed) mergeSchedules(parsed.schedules);
          setConfirmAction(null);
          handleClose();
        }}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        isOpen={confirmAction === 'replace'}
        title="Reemplazar todos los datos"
        message={
          <p>
            Esto eliminará permanentemente todos tus horarios actuales y los reemplazará por los {parsed?.schedules.length ?? 0}{' '}
            horario(s) del archivo importado. Esta acción no se puede deshacer.
          </p>
        }
        confirmLabel="Reemplazar"
        onConfirm={() => {
          if (parsed) {
            replaceAllData({
              version: APP_DATA_VERSION,
              schedules: parsed.schedules,
              settings: {
                theme: parsed.settings?.theme ?? 'system',
                lastScheduleId: parsed.schedules[0]?.id ?? null,
                sampleDataDismissed: true,
              },
            });
          }
          setConfirmAction(null);
          handleClose();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
