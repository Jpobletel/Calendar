import { useState } from 'react';
import { Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ScheduleNameDialog } from './ScheduleNameDialog';
import { useStore } from '../../state/store';
import { useSchedules } from '../../state/selectors';
import type { Schedule } from '../../types';

interface ScheduleSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeScheduleId: string | undefined;
}

type PendingAction =
  | { type: 'rename'; schedule: Schedule }
  | { type: 'delete'; schedule: Schedule }
  | { type: 'create' }
  | { type: 'duplicateFromCurrent' }
  | null;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ScheduleSelectorDialog({ isOpen, onClose, activeScheduleId }: ScheduleSelectorDialogProps) {
  const schedules = useSchedules();
  const setActiveSchedule = useStore((s) => s.setActiveSchedule);
  const createSchedule = useStore((s) => s.createSchedule);
  const renameSchedule = useStore((s) => s.renameSchedule);
  const duplicateSchedule = useStore((s) => s.duplicateSchedule);
  const deleteSchedule = useStore((s) => s.deleteSchedule);
  const [pending, setPending] = useState<PendingAction>(null);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Horarios guardados" size="md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setPending({ type: 'create' })}
              fullWidth
              className="sm:w-auto"
            >
              Crear horario vacío
            </Button>
            <Button
              variant="secondary"
              icon={<Copy className="h-4 w-4" aria-hidden="true" />}
              onClick={() => setPending({ type: 'duplicateFromCurrent' })}
              fullWidth
              className="sm:w-auto"
            >
              Crear a partir del actual
            </Button>
          </div>

          <ul className="flex flex-col gap-2">
            {schedules.map((schedule) => {
              const isActive = schedule.id === activeScheduleId;
              return (
                <li
                  key={schedule.id}
                  className={`flex items-center gap-1 rounded-xl border px-2 py-2 sm:gap-2 sm:px-3 ${
                    isActive
                      ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-950/40'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSchedule(schedule.id);
                      onClose();
                    }}
                    className="flex min-h-touch flex-1 flex-col items-start justify-center overflow-hidden text-left"
                  >
                    <span className="flex items-center gap-1.5 truncate font-medium text-slate-900 dark:text-white">
                      {isActive && <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden="true" />}
                      <span className="truncate">{schedule.name}</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {schedule.people.length} persona{schedule.people.length === 1 ? '' : 's'} · {schedule.shifts.length} turno
                      {schedule.shifts.length === 1 ? '' : 's'} · actualizado {formatDate(schedule.updatedAt)}
                    </span>
                  </button>
                  <IconButton
                    icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                    label={`Renombrar ${schedule.name}`}
                    onClick={() => setPending({ type: 'rename', schedule })}
                  />
                  <IconButton
                    icon={<Copy className="h-4 w-4" aria-hidden="true" />}
                    label={`Duplicar ${schedule.name}`}
                    onClick={() => duplicateSchedule(schedule.id)}
                  />
                  <IconButton
                    icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                    label={`Eliminar ${schedule.name}`}
                    variant="danger"
                    onClick={() => setPending({ type: 'delete', schedule })}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>

      <ScheduleNameDialog
        isOpen={pending?.type === 'create'}
        title="Nuevo horario"
        confirmLabel="Crear"
        onClose={() => setPending(null)}
        onConfirm={(name) => {
          createSchedule(name);
          setPending(null);
          onClose();
        }}
      />
      <ScheduleNameDialog
        isOpen={pending?.type === 'duplicateFromCurrent'}
        title="Nuevo horario a partir del actual"
        confirmLabel="Crear"
        onClose={() => setPending(null)}
        onConfirm={(name) => {
          createSchedule(name, { fromCurrent: true });
          setPending(null);
          onClose();
        }}
      />
      <ScheduleNameDialog
        isOpen={pending?.type === 'rename'}
        title="Renombrar horario"
        initialName={pending?.type === 'rename' ? pending.schedule.name : ''}
        confirmLabel="Guardar"
        onClose={() => setPending(null)}
        onConfirm={(name) => {
          if (pending?.type === 'rename') renameSchedule(pending.schedule.id, name);
          setPending(null);
        }}
      />
      <ConfirmDialog
        isOpen={pending?.type === 'delete'}
        title="Eliminar horario"
        message={
          pending?.type === 'delete' ? (
            <>
              <p>
                ¿Eliminar el horario <strong>{pending.schedule.name}</strong>? Se eliminarán también sus{' '}
                {pending.schedule.people.length} persona(s) y {pending.schedule.shifts.length} turno(s).
              </p>
              {schedules.length === 1 && <p className="mt-2">Como es tu único horario, se creará automáticamente uno nuevo y vacío.</p>}
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          if (pending?.type === 'delete') deleteSchedule(pending.schedule.id);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
