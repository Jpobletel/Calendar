import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, MoreVertical, Pencil, Trash2, Users, Zap, ZapOff } from 'lucide-react';
import { PersonAvatar } from '../common/PersonAvatar';
import { IconButton } from '../common/IconButton';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PersonForm } from './PersonForm';
import { CopyShiftsDialog } from './CopyShiftsDialog';
import { useStore } from '../../state/store';
import type { Person, Schedule } from '../../types';

interface PersonListItemProps {
  schedule: Schedule;
  person: Person;
  shiftCount: number;
  manualOrder: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export function PersonListItem({ schedule, person, shiftCount, manualOrder, isFirst, isLast }: PersonListItemProps) {
  const togglePersonVisibility = useStore((s) => s.togglePersonVisibility);
  const updatePerson = useStore((s) => s.updatePerson);
  const deletePerson = useStore((s) => s.deletePerson);
  const duplicatePerson = useStore((s) => s.duplicatePerson);
  const reorderPerson = useStore((s) => s.reorderPerson);
  const setActivePerson = useStore((s) => s.setActivePerson);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isActive = schedule.viewSettings.activePersonId === person.id;

  return (
    <li className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-2 dark:border-slate-800">
      <IconButton
        icon={person.visible ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
        label={person.visible ? `Ocultar a ${person.name}` : `Mostrar a ${person.name}`}
        aria-pressed={person.visible}
        onClick={() => togglePersonVisibility(schedule.id, person.id)}
      />
      <button
        type="button"
        onClick={() => setActivePerson(schedule.id, isActive ? null : person.id)}
        aria-pressed={isActive}
        aria-label={
          isActive
            ? `${person.name} es la persona activa para agregar turnos. Quitar.`
            : `Usar a ${person.name} como persona activa para agregar turnos arrastrando en el calendario`
        }
        title="Persona activa para agregar turnos arrastrando"
        className={`rounded-full ${isActive ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
      >
        <PersonAvatar name={person.name} color={person.color} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900 dark:text-white">
          <span className="truncate">{person.name}</span>
          {isActive && (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <Zap className="h-2.5 w-2.5" aria-hidden="true" /> Activa
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {shiftCount} turno{shiftCount === 1 ? '' : 's'}
        </p>
      </div>
      <IconButton
        icon={<MoreVertical className="h-4 w-4" aria-hidden="true" />}
        label={`Más acciones para ${person.name}`}
        onClick={() => setMenuOpen(true)}
      />

      <Modal isOpen={menuOpen} onClose={() => setMenuOpen(false)} title={person.name} size="sm">
        <div className="flex flex-col gap-1">
          <ActionButton
            icon={<Pencil className="h-4 w-4" aria-hidden="true" />}
            label="Editar nombre y color"
            onClick={() => {
              setMenuOpen(false);
              setEditOpen(true);
            }}
          />
          <ActionButton
            icon={
              isActive ? (
                <ZapOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Zap className="h-4 w-4" aria-hidden="true" />
              )
            }
            label={isActive ? 'Quitar como persona activa' : 'Marcar como persona activa para agregar turnos'}
            onClick={() => {
              setMenuOpen(false);
              setActivePerson(schedule.id, isActive ? null : person.id);
            }}
          />
          <ActionButton
            icon={<Copy className="h-4 w-4" aria-hidden="true" />}
            label="Duplicar persona y sus turnos"
            onClick={() => {
              setMenuOpen(false);
              duplicatePerson(schedule.id, person.id);
            }}
          />
          <ActionButton
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            label="Copiar turnos a otra persona"
            onClick={() => {
              setMenuOpen(false);
              setCopyOpen(true);
            }}
          />
          {manualOrder && !isFirst && (
            <ActionButton
              icon={<ArrowUp className="h-4 w-4" aria-hidden="true" />}
              label="Mover arriba en la lista"
              onClick={() => {
                setMenuOpen(false);
                reorderPerson(schedule.id, person.id, 'up');
              }}
            />
          )}
          {manualOrder && !isLast && (
            <ActionButton
              icon={<ArrowDown className="h-4 w-4" aria-hidden="true" />}
              label="Mover abajo en la lista"
              onClick={() => {
                setMenuOpen(false);
                reorderPerson(schedule.id, person.id, 'down');
              }}
            />
          )}
          <ActionButton
            icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
            label="Eliminar persona"
            danger
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          />
        </div>
      </Modal>

      <PersonForm
        isOpen={editOpen}
        title="Editar persona"
        initialName={person.name}
        initialColor={person.color}
        onClose={() => setEditOpen(false)}
        onConfirm={(name, color) => {
          updatePerson(schedule.id, person.id, { name, color });
          setEditOpen(false);
        }}
      />

      <CopyShiftsDialog isOpen={copyOpen} onClose={() => setCopyOpen(false)} schedule={schedule} sourcePersonId={person.id} />

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Eliminar persona"
        message={
          <p>
            ¿Eliminar a <strong>{person.name}</strong>? Tiene {shiftCount} turno{shiftCount === 1 ? '' : 's'}, que también se
            eliminarán.
          </p>
        }
        confirmLabel="Eliminar"
        onConfirm={() => {
          deletePerson(schedule.id, person.id);
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </li>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-touch items-center gap-3 rounded-lg px-3 text-left text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 ${
        danger ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
