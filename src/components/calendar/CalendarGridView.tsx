import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { MousePointerClick, Zap } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { PersonAvatar } from '../common/PersonAvatar';
import { ShiftForm } from '../shifts/ShiftForm';
import { CalendarShiftBlock } from './CalendarShiftBlock';
import { MobileCalendarView } from './MobileCalendarView';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';
import { DAY_LABELS_SHORT } from '../../types';
import { getOrderedDayIndices, filterDayIndices } from '../../utils/days';
import { getCalendarVisibleRange } from '../../utils/calendarLayout';
import { detectConflicts, isShiftInConflict } from '../../utils/conflicts';
import { formatMinutesAsHours, getShiftDurationMinutes, minutesToTime, timeToMinutes } from '../../utils/time';
import { assignOverlapLanes } from '../../utils/layout';
import { sortPeopleByOrder } from '../../utils/sort';
import {
  HOUR_HEIGHT,
  MIN_DURATION_MINUTES,
  MOVE_THRESHOLD_PX,
  clampMinutes,
  minutesFromClientY,
  snapMinutes,
  type DragPreview,
} from './dragUtils';

interface CreateDragState {
  pointerId: number;
  day: number;
  anchor: number;
  columnTop: number;
  moved: boolean;
  startClientY: number;
  currentStart: number;
  currentEnd: number;
}

interface CalendarGridViewProps {
  schedule: Schedule;
}

interface CreatingShiftState {
  day: number;
  personId: string;
  startTime: string;
  endTime: string;
}

/**
 * Vista tipo calendario con eje de horas: muestra a todas las personas visibles a la vez
 * (vista combinada). Los bloques se pueden arrastrar para moverlos y sus bordes se pueden
 * arrastrar para agrandarlos o acortarlos. También se pueden crear turnos nuevos arrastrando
 * sobre un espacio vacío, para la "persona activa" seleccionada en el panel de personas.
 * Todo lo anterior es un atajo: crear, mover y redimensionar turnos también se puede hacer
 * sin arrastrar, tocando un turno o el botón "+ Turno" de las otras vistas.
 */
export function CalendarGridView({ schedule }: CalendarGridViewProps) {
  const addShift = useStore((s) => s.addShift);
  const updateShift = useStore((s) => s.updateShift);
  const updateScheduleViewSettings = useStore((s) => s.updateScheduleViewSettings);
  const setActivePerson = useStore((s) => s.setActivePerson);
  const pushNotification = useStore((s) => s.pushNotification);
  const isDesktop = useIsDesktop();
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [creatingShift, setCreatingShift] = useState<CreatingShiftState | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const createRef = useRef<CreateDragState | null>(null);

  const visiblePeople = useMemo(() => sortPeopleByOrder(schedule.people.filter((p) => p.visible)), [schedule.people]);
  const visiblePersonIds = useMemo(() => new Set(visiblePeople.map((person) => person.id)), [visiblePeople]);
  const activePerson = visiblePeople.find((p) => p.id === schedule.viewSettings.activePersonId);
  const activePersonId = activePerson?.id ?? null;
  const conflicts = useMemo(() => detectConflicts(schedule.shifts), [schedule.shifts]);
  const days = useMemo(() => {
    const ordered = getOrderedDayIndices(schedule.viewSettings.weekStart);
    const visibleShifts = schedule.shifts.filter((shift) => visiblePersonIds.has(shift.personId));
    return filterDayIndices(ordered, schedule.viewSettings.dayFilter, visibleShifts);
  }, [schedule.viewSettings.weekStart, schedule.viewSettings.dayFilter, schedule.shifts, visiblePersonIds]);

  const { startHour, endHour } = useMemo(
    () => getCalendarVisibleRange(schedule, visiblePersonIds),
    [schedule, visiblePersonIds],
  );
  const totalHours = Math.max(1, endHour - startHour);
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);
  const rangeStartMinutes = startHour * 60;
  const rangeEndMinutes = endHour * 60;

  useEffect(() => {
    if (
      !isDesktop &&
      days.length > 0 &&
      !days.includes(schedule.viewSettings.selectedDay)
    ) {
      updateScheduleViewSettings(schedule.id, { selectedDay: days[0] });
    }
  }, [
    days,
    isDesktop,
    schedule.id,
    schedule.viewSettings.selectedDay,
    updateScheduleViewSettings,
  ]);

  function commitPreview(preview: DragPreview) {
    if (preview.endMinutes - preview.startMinutes < MIN_DURATION_MINUTES) return;
    if (preview.kind === 'create') {
      addShift(schedule.id, {
        personId: preview.personId,
        day: preview.day,
        startTime: minutesToTime(preview.startMinutes),
        endTime: minutesToTime(preview.endMinutes),
        breakMinutes: 0,
      });
    } else if (preview.shiftId) {
      updateShift(schedule.id, preview.shiftId, {
        day: preview.day,
        startTime: minutesToTime(preview.startMinutes),
        endTime: minutesToTime(preview.endMinutes),
      });
    }
  }

  function handleColumnPointerDown(day: number) {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (!activePersonId) {
        pushNotification(
          'info',
          'Selecciona una persona activa (icono de rayo) en el panel de personas para crear turnos arrastrando aquí.',
        );
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const anchor = clampMinutes(
        snapMinutes(minutesFromClientY(event.clientY, rect.top, rangeStartMinutes)),
        rangeStartMinutes,
        rangeEndMinutes - MIN_DURATION_MINUTES,
      );
      createRef.current = {
        pointerId: event.pointerId,
        day,
        anchor,
        columnTop: rect.top,
        moved: false,
        startClientY: event.clientY,
        currentStart: anchor,
        currentEnd: Math.min(anchor + 60, rangeEndMinutes),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragPreview({
        kind: 'create',
        day,
        startMinutes: anchor,
        endMinutes: Math.min(anchor + 60, rangeEndMinutes),
        personId: activePersonId,
      });
    };
  }

  function handleColumnPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const create = createRef.current;
    if (!create || create.pointerId !== event.pointerId || !activePersonId) return;
    if (!create.moved && Math.abs(event.clientY - create.startClientY) > MOVE_THRESHOLD_PX) {
      create.moved = true;
    }
    if (!create.moved) return;
    const current = clampMinutes(
      snapMinutes(minutesFromClientY(event.clientY, create.columnTop, rangeStartMinutes)),
      rangeStartMinutes,
      rangeEndMinutes,
    );
    const start = Math.min(create.anchor, current);
    const end = Math.max(create.anchor, current, start + MIN_DURATION_MINUTES);
    create.currentStart = start;
    create.currentEnd = Math.min(end, rangeEndMinutes);
    setDragPreview({ kind: 'create', day: create.day, startMinutes: start, endMinutes: create.currentEnd, personId: activePersonId });
  }

  function handleColumnPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const create = createRef.current;
    if (!create || create.pointerId !== event.pointerId || !activePersonId) return;
    createRef.current = null;
    setDragPreview(null);
    commitPreview({
      kind: 'create',
      day: create.day,
      startMinutes: create.currentStart,
      endMinutes: create.currentEnd,
      personId: activePersonId,
    });
  }

  function handleColumnPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const create = createRef.current;
    if (!create || create.pointerId !== event.pointerId) return;
    createRef.current = null;
    setDragPreview(null);
  }

  if (visiblePeople.length === 0) {
    return <EmptyState title="Selecciona una o más personas para ver sus horarios." />;
  }

  if (!isDesktop) {
    return (
      <>
        <MobileCalendarView
          schedule={schedule}
          visiblePeople={visiblePeople}
          days={days}
          activePerson={activePerson}
          startHour={startHour}
          endHour={endHour}
          conflicts={conflicts}
          onSelectDay={(selectedDay) => updateScheduleViewSettings(schedule.id, { selectedDay })}
          onSetActivePerson={(personId) => setActivePerson(schedule.id, personId)}
          onCreateShift={setCreatingShift}
          onEditShift={setEditingShiftId}
          onMissingActivePerson={() =>
            pushNotification('info', 'Elige primero una persona en la fila “Crear turnos para”.')
          }
        />
        {creatingShift && (
          <ShiftForm
            isOpen
            onClose={() => setCreatingShift(null)}
            schedule={schedule}
            initialDay={creatingShift.day}
            initialPersonId={creatingShift.personId}
            initialStartTime={creatingShift.startTime}
            initialEndTime={creatingShift.endTime}
          />
        )}
        {editingShiftId && (
          <ShiftForm
            isOpen
            onClose={() => setEditingShiftId(null)}
            schedule={schedule}
            shiftId={editingShiftId}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3" aria-label="Leyenda de colores por persona">
        {visiblePeople.map((person) => (
          <span
            key={person.id}
            className={`flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 ${
              person.id === activePersonId ? 'bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-950/40 dark:ring-brand-700' : ''
            }`}
          >
            <PersonAvatar name={person.name} color={person.color} size="sm" />
            {person.name}
            {person.id === activePersonId && <Zap className="h-3 w-3 text-brand-600 dark:text-brand-400" aria-hidden="true" />}
          </span>
        ))}
      </div>

      <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {activePerson ? (
          <span>
            Mantén presionado y arrastra sobre un espacio vacío para crear un turno de <strong>{activePerson.name}</strong>.
            Arrastra un turno para moverlo, o sus bordes para agrandarlo o acortarlo. Toca un turno para editarlo con el
            formulario completo.
          </span>
        ) : (
          <span>
            Marca a una persona como "activa" (icono de rayo en el panel de personas) para poder crear turnos arrastrando aquí.
            Los turnos existentes igual se pueden arrastrar para moverlos o redimensionarlos.
          </span>
        )}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex min-w-[760px]">
          <div className="w-14 shrink-0 border-r border-slate-200 dark:border-slate-800">
            <div style={{ height: 32 }} />
            <div className="relative" style={{ height: totalHours * HOUR_HEIGHT }}>
              {hourMarks.map((hour, index) => (
                <span
                  key={hour}
                  className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400"
                  style={{ top: index * HOUR_HEIGHT }}
                >
                  {String(hour % 24).padStart(2, '0')}:00
                </span>
              ))}
            </div>
          </div>
          {days.map((day) => {
            const dayShifts = schedule.shifts.filter((s) => s.day === day && visiblePersonIds.has(s.personId));
            const laneItems = dayShifts.map((s) => ({
              id: s.id,
              start: timeToMinutes(s.startTime),
              end: timeToMinutes(s.startTime) + getShiftDurationMinutes(s.startTime, s.endTime),
            }));
            const { lanes, laneCount } = assignOverlapLanes(laneItems);

            const ghost =
              dragPreview && dragPreview.day === day
                ? (() => {
                    const ghostPerson = schedule.people.find((p) => p.id === dragPreview.personId);
                    const ghostTop = ((dragPreview.startMinutes - rangeStartMinutes) / 60) * HOUR_HEIGHT;
                    const ghostHeight = Math.max(
                      20,
                      ((dragPreview.endMinutes - dragPreview.startMinutes) / 60) * HOUR_HEIGHT,
                    );
                    return (
                      <div
                        className="pointer-events-none absolute inset-x-1 z-20 overflow-hidden rounded-lg border-2 border-dashed text-[11px] font-semibold leading-tight text-white shadow-lg"
                        style={{
                          top: ghostTop,
                          height: ghostHeight,
                          backgroundColor: ghostPerson?.color ?? '#3b66f5',
                          borderColor: '#ffffff',
                        }}
                      >
                        <div className="px-1.5 py-1">
                          <p className="truncate">{ghostPerson?.name}</p>
                          <p>
                            {minutesToTime(dragPreview.startMinutes)}–{minutesToTime(dragPreview.endMinutes)}
                          </p>
                          <p className="opacity-90">
                            {formatMinutesAsHours(dragPreview.endMinutes - dragPreview.startMinutes)}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                : null;

            return (
              <div key={day} className="relative flex-1 border-r border-slate-100 last:border-r-0 dark:border-slate-800" style={{ minWidth: 140 }}>
                <div className="border-b border-slate-200 bg-slate-50 py-1.5 text-center text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  {DAY_LABELS_SHORT[day]}
                </div>
                <div
                  data-day-column={day}
                  className="relative touch-pan-x"
                  style={{ height: totalHours * HOUR_HEIGHT }}
                  onPointerDown={handleColumnPointerDown(day)}
                  onPointerMove={handleColumnPointerMove}
                  onPointerUp={handleColumnPointerUp}
                  onPointerCancel={handleColumnPointerCancel}
                >
                  {hourMarks.slice(0, -1).map((hour, index) => (
                    <div
                      key={hour}
                      className="pointer-events-none absolute inset-x-0 border-t border-slate-100 dark:border-slate-800"
                      style={{ top: index * HOUR_HEIGHT }}
                    />
                  ))}
                  {dayShifts.map((shift) => {
                    const person = schedule.people.find((p) => p.id === shift.personId);
                    const startMin = timeToMinutes(shift.startTime);
                    const duration = getShiftDurationMinutes(shift.startTime, shift.endTime);
                    const endMin = startMin + duration;
                    if (endMin <= rangeStartMinutes || startMin >= rangeEndMinutes) return null;
                    const visibleStart = Math.max(rangeStartMinutes, startMin);
                    const visibleEnd = Math.min(rangeEndMinutes, endMin);
                    const top = ((visibleStart - rangeStartMinutes) / 60) * HOUR_HEIGHT;
                    const height = Math.max(32, ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT);
                    const startsBefore = startMin < rangeStartMinutes;
                    const spillsOver = startMin + duration > rangeEndMinutes;
                    const lane = lanes.get(shift.id) ?? 0;
                    const hasConflict = isShiftInConflict(conflicts, shift.id);

                    return (
                      <CalendarShiftBlock
                        key={shift.id}
                        shift={shift}
                        person={person}
                        hasConflict={hasConflict}
                        top={top}
                        height={height}
                        left={`calc(${(lane / laneCount) * 100}% + 2px)`}
                        width={`calc(${100 / laneCount}% - 4px)`}
                        rangeStartMinutes={rangeStartMinutes}
                        rangeEndMinutes={rangeEndMinutes}
                        startsBefore={startsBefore}
                        spillsOver={spillsOver}
                        isDragging={dragPreview?.shiftId === shift.id}
                        onOpenEdit={setEditingShiftId}
                        onDragUpdate={setDragPreview}
                        onDragCommit={commitPreview}
                      />
                    );
                  })}
                  {ghost}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingShiftId && (
        <ShiftForm
          isOpen={Boolean(editingShiftId)}
          onClose={() => setEditingShiftId(null)}
          schedule={schedule}
          shiftId={editingShiftId}
        />
      )}
    </div>
  );
}
