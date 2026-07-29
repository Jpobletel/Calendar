import { AlertTriangle, MapPin, StickyNote } from 'lucide-react';
import { PersonAvatar } from '../common/PersonAvatar';
import { formatMinutesAsHours, getWorkedMinutes, isOvernightShift } from '../../utils/time';
import type { Person, Shift } from '../../types';

interface ShiftChipProps {
  shift: Shift;
  person: Person | undefined;
  hasConflict: boolean;
  onClick: () => void;
  showPerson?: boolean;
}

/** Bloque compacto y accionable que representa un turno; se reutiliza en las vistas de día, semana y calendario. */
export function ShiftChip({ shift, person, hasConflict, onClick, showPerson = true }: ShiftChipProps) {
  const worked = getWorkedMinutes(shift.startTime, shift.endTime, shift.breakMinutes);
  const overnight = isOvernightShift(shift.startTime, shift.endTime);
  const color = person?.color ?? '#94a3b8';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-touch w-full flex-col gap-0.5 rounded-xl border border-slate-100 border-l-4 bg-white px-2.5 py-2 text-left shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-slate-700 dark:bg-slate-800 ${
        hasConflict ? 'ring-2 ring-amber-400' : ''
      }`}
      style={{ borderLeftColor: color }}
    >
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
        {showPerson && person && <PersonAvatar name={person.name} color={person.color} size="sm" />}
        {showPerson && person && <span className="truncate">{person.name}</span>}
        {hasConflict && (
          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-medium">Conflicto</span>
          </span>
        )}
      </span>
      <span className="text-xs text-slate-600 dark:text-slate-300">
        {shift.startTime}–{shift.endTime}
        {overnight && <span className="ml-1 font-medium text-indigo-600 dark:text-indigo-400">+1 día</span>}
      </span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatMinutesAsHours(worked)}</span>
      {shift.location && (
        <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{shift.location}</span>
        </span>
      )}
      {shift.note && (
        <span className="flex items-center gap-1 text-[11px] italic text-slate-500 dark:text-slate-400">
          <StickyNote className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{shift.note}</span>
        </span>
      )}
    </button>
  );
}
