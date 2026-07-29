import { Plus, Zap } from 'lucide-react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { PersonAvatar } from '../common/PersonAvatar';
import type { Conflict, Person, Schedule } from '../../types';
import { DAY_LABELS, DAY_LABELS_SHORT } from '../../types';
import { isShiftInConflict } from '../../utils/conflicts';
import { assignOverlapLanes } from '../../utils/layout';
import {
  formatMinutesAsHours,
  getShiftDurationMinutes,
  getWorkedMinutes,
  isOvernightShift,
  minutesToTime,
  timeToMinutes,
} from '../../utils/time';
import { clampMinutes, snapMinutes } from './dragUtils';

const MOBILE_HOUR_HEIGHT = 64;

interface MobileCalendarViewProps {
  schedule: Schedule;
  visiblePeople: Person[];
  days: number[];
  activePerson: Person | undefined;
  startHour: number;
  endHour: number;
  conflicts: Conflict[];
  onSelectDay: (day: number) => void;
  onSetActivePerson: (personId: string) => void;
  onCreateShift: (input: {
    day: number;
    personId: string;
    startTime: string;
    endTime: string;
  }) => void;
  onEditShift: (shiftId: string) => void;
  onMissingActivePerson: () => void;
}

function readableTextColor(color: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return '#ffffff';
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance > 165 ? '#0f172a' : '#ffffff';
}

export function MobileCalendarView({
  schedule,
  visiblePeople,
  days,
  activePerson,
  startHour,
  endHour,
  conflicts,
  onSelectDay,
  onSetActivePerson,
  onCreateShift,
  onEditShift,
  onMissingActivePerson,
}: MobileCalendarViewProps) {
  const dayOptions = days.length > 0 ? days : [schedule.viewSettings.selectedDay];
  const selectedDay = dayOptions.includes(schedule.viewSettings.selectedDay)
    ? schedule.viewSettings.selectedDay
    : dayOptions[0];
  const visiblePersonIds = new Set(visiblePeople.map((person) => person.id));
  const dayShifts = schedule.shifts.filter(
    (shift) => shift.day === selectedDay && visiblePersonIds.has(shift.personId),
  );
  const laneItems = dayShifts.map((shift) => ({
    id: shift.id,
    start: timeToMinutes(shift.startTime),
    end: timeToMinutes(shift.startTime) + getShiftDurationMinutes(shift.startTime, shift.endTime),
  }));
  const { lanes, laneCount } = assignOverlapLanes(laneItems);
  const totalHours = Math.max(1, endHour - startHour);
  const rangeStartMinutes = startHour * 60;
  const rangeEndMinutes = endHour * 60;
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, index) => startHour + index);
  const totalWorked = dayShifts.reduce(
    (total, shift) => total + getWorkedMinutes(shift.startTime, shift.endTime, shift.breakMinutes),
    0,
  );

  function requestCreate(startMinutes: number) {
    if (!activePerson) {
      onMissingActivePerson();
      return;
    }
    const safeStart = clampMinutes(
      snapMinutes(startMinutes),
      rangeStartMinutes,
      Math.max(rangeStartMinutes, rangeEndMinutes - 60),
    );
    onCreateShift({
      day: selectedDay,
      personId: activePerson.id,
      startTime: minutesToTime(safeStart),
      endTime: minutesToTime(Math.min(safeStart + 60, rangeEndMinutes)),
    });
  }

  function handleTimelineClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('[data-mobile-shift]')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clickedMinutes =
      rangeStartMinutes + ((event.clientY - rect.top) / MOBILE_HOUR_HEIGHT) * 60;
    requestCreate(clickedMinutes);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2" role="tablist" aria-label="Seleccionar día del calendario">
          {dayOptions.map((day) => {
            const shiftCount = schedule.shifts.filter(
              (shift) => shift.day === day && visiblePersonIds.has(shift.personId),
            ).length;
            const active = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectDay(day)}
                className={`flex h-14 w-14 snap-start flex-col items-center justify-center rounded-2xl border text-xs font-bold transition-colors ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <span>{DAY_LABELS_SHORT[day]}</span>
                <span className={`mt-0.5 text-[10px] ${active ? 'text-white/80' : 'text-slate-400'}`}>
                  {shiftCount || '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Crear turnos para</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {activePerson?.name ?? 'Elige una persona'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => requestCreate(Math.max(rangeStartMinutes, 9 * 60))}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-bold text-white shadow-sm shadow-brand-600/25 active:bg-brand-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Turno
          </button>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2" role="radiogroup" aria-label="Persona activa para crear turnos">
            {visiblePeople.map((person) => {
              const active = person.id === activePerson?.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSetActivePerson(person.id)}
                  className={`flex min-h-11 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-brand-400 bg-brand-50 text-brand-800 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <PersonAvatar name={person.name} color={person.color} size="sm" />
                  <span className="max-w-32 truncate">{person.name}</span>
                  {active && <Zap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-300" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{DAY_LABELS[selectedDay]}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dayShifts.length} {dayShifts.length === 1 ? 'turno' : 'turnos'} · {formatMinutesAsHours(totalWorked)}
            </p>
          </div>
          <p className="max-w-36 text-right text-[10px] leading-tight text-slate-400">
            Toca un turno para editar o un espacio para crear
          </p>
        </div>

        <div className="flex">
          <div className="relative w-12 shrink-0 border-r border-slate-100 dark:border-slate-800" style={{ height: totalHours * MOBILE_HOUR_HEIGHT }}>
            {hourMarks.map((hour, index) => (
              <span
                key={hour}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] font-medium tabular-nums text-slate-400"
                style={{ top: index * MOBILE_HOUR_HEIGHT }}
              >
                {String(hour % 24).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          <div
            className="relative min-w-0 flex-1 touch-pan-y bg-[linear-gradient(to_bottom,transparent_63px,rgba(148,163,184,0.16)_64px)] bg-[length:100%_64px]"
            style={{ height: totalHours * MOBILE_HOUR_HEIGHT }}
            onClick={handleTimelineClick}
            aria-label={`Calendario del ${DAY_LABELS[selectedDay]}`}
          >
            {dayShifts.map((shift) => {
              const person = schedule.people.find((candidate) => candidate.id === shift.personId);
              const startMinutes = timeToMinutes(shift.startTime);
              const endMinutes = startMinutes + getShiftDurationMinutes(shift.startTime, shift.endTime);
              if (endMinutes <= rangeStartMinutes || startMinutes >= rangeEndMinutes) return null;
              const visibleStart = Math.max(startMinutes, rangeStartMinutes);
              const visibleEnd = Math.min(endMinutes, rangeEndMinutes);
              const top = ((visibleStart - rangeStartMinutes) / 60) * MOBILE_HOUR_HEIGHT;
              const height = Math.max(44, ((visibleEnd - visibleStart) / 60) * MOBILE_HOUR_HEIGHT);
              const lane = lanes.get(shift.id) ?? 0;
              const textColor = readableTextColor(person?.color ?? '#64748b');
              const compact = height < 62;
              return (
                <button
                  key={shift.id}
                  type="button"
                  data-mobile-shift=""
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditShift(shift.id);
                  }}
                  className={`absolute overflow-hidden rounded-xl border border-white/50 px-2 py-1.5 text-left shadow-md transition-transform active:scale-[0.98] ${
                    isShiftInConflict(conflicts, shift.id) ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                  }`}
                  style={{
                    top,
                    height,
                    left: `calc(${(lane / laneCount) * 100}% + 3px)`,
                    width: `calc(${100 / laneCount}% - 6px)`,
                    backgroundColor: person?.color ?? '#64748b',
                    color: textColor,
                  }}
                  aria-label={`${person?.name ?? 'Persona'}, ${shift.startTime} a ${shift.endTime}. Tocar para editar.`}
                >
                  <span className="block truncate text-xs font-extrabold">{person?.name}</span>
                  <span className="block truncate text-[11px] font-semibold tabular-nums">
                    {shift.startTime}–{shift.endTime}
                    {isOvernightShift(shift.startTime, shift.endTime) ? ' +1' : ''}
                  </span>
                  {!compact && (
                    <span className="block truncate text-[10px] font-medium opacity-80">
                      {formatMinutesAsHours(getWorkedMinutes(shift.startTime, shift.endTime, shift.breakMinutes))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
