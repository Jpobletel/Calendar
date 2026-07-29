import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { Person, Shift } from '../../types';
import { formatMinutesAsHours, getShiftDurationMinutes, getWorkedMinutes, isOvernightShift, timeToMinutes } from '../../utils/time';
import {
  HANDLE_HEIGHT,
  MIN_DURATION_MINUTES,
  MOVE_THRESHOLD_PX,
  clampMinutes,
  minutesFromClientY,
  resolveColumnAtPoint,
  snapMinutes,
  type DragPreview,
} from './dragUtils';

interface MoveDragState {
  pointerId: number;
  grabOffsetMinutes: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
  durationMinutes: number;
  currentDay: number;
  currentStart: number;
}

interface ResizeDragState {
  pointerId: number;
  edge: 'start' | 'end';
  columnTop: number;
  startClientY: number;
  moved: boolean;
  fixedMinutes: number;
  currentValue: number;
}

interface CalendarShiftBlockProps {
  shift: Shift;
  person: Person | undefined;
  hasConflict: boolean;
  top: number;
  height: number;
  left: string;
  width: string;
  rangeStartMinutes: number;
  rangeEndMinutes: number;
  startsBefore: boolean;
  spillsOver: boolean;
  isDragging: boolean;
  onOpenEdit: (shiftId: string) => void;
  onDragUpdate: (preview: DragPreview | null) => void;
  onDragCommit: (preview: DragPreview) => void;
}

/**
 * Bloque de turno posicionado en la vista Calendario. Un toque simple (sin arrastrar) abre
 * el formulario de edición, igual que antes. Arrastrar el cuerpo mueve el turno de día/hora;
 * arrastrar los bordes superior o inferior cambia la hora de inicio o de término.
 */
export function CalendarShiftBlock({
  shift,
  person,
  hasConflict,
  top,
  height,
  left,
  width,
  rangeStartMinutes,
  rangeEndMinutes,
  startsBefore,
  spillsOver,
  isDragging,
  onOpenEdit,
  onDragUpdate,
  onDragCommit,
}: CalendarShiftBlockProps) {
  const moveRef = useRef<MoveDragState | null>(null);
  const resizeRef = useRef<ResizeDragState | null>(null);

  const overnight = isOvernightShift(shift.startTime, shift.endTime);
  const worked = getWorkedMinutes(shift.startTime, shift.endTime, shift.breakMinutes);
  const shiftStartMinutes = timeToMinutes(shift.startTime);
  const durationMinutes = getShiftDurationMinutes(shift.startTime, shift.endTime);
  const shiftEndMinutes = shiftStartMinutes + durationMinutes;

  function handleBodyPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const resolved = resolveColumnAtPoint(event.clientX, event.clientY);
    const columnTop = resolved?.rect.top ?? 0;
    const pointerMinutes = minutesFromClientY(event.clientY, columnTop, rangeStartMinutes);
    moveRef.current = {
      pointerId: event.pointerId,
      grabOffsetMinutes: pointerMinutes - shiftStartMinutes,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
      durationMinutes,
      currentDay: shift.day,
      currentStart: shiftStartMinutes,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBodyPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = moveRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startClientX;
    const dy = event.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) {
      drag.moved = true;
    }
    if (!drag.moved) return;

    const resolved = resolveColumnAtPoint(event.clientX, event.clientY);
    if (!resolved) return;

    const rawStart = minutesFromClientY(event.clientY, resolved.rect.top, rangeStartMinutes) - drag.grabOffsetMinutes;
    const snapped = snapMinutes(rawStart);
    const latestStart = Math.max(rangeStartMinutes, rangeEndMinutes - drag.durationMinutes);
    const clampedStart = clampMinutes(snapped, rangeStartMinutes, latestStart);

    drag.currentDay = resolved.day;
    drag.currentStart = clampedStart;

    onDragUpdate({
      kind: 'move',
      day: resolved.day,
      startMinutes: clampedStart,
      endMinutes: clampedStart + drag.durationMinutes,
      personId: shift.personId,
      shiftId: shift.id,
    });
  }

  function handleBodyPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = moveRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveRef.current = null;
    onDragUpdate(null);
    if (!drag.moved) {
      onOpenEdit(shift.id);
      return;
    }
    onDragCommit({
      kind: 'move',
      day: drag.currentDay,
      startMinutes: drag.currentStart,
      endMinutes: drag.currentStart + drag.durationMinutes,
      personId: shift.personId,
      shiftId: shift.id,
    });
  }

  function handleBodyPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = moveRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveRef.current = null;
    onDragUpdate(null);
  }

  function handleResizePointerDown(edge: 'start' | 'end') {
    return (event: ReactPointerEvent<HTMLDivElement>) => {
      event.stopPropagation();
      const resolved = resolveColumnAtPoint(event.clientX, event.clientY);
      const columnTop = resolved?.rect.top ?? 0;
      resizeRef.current = {
        pointerId: event.pointerId,
        edge,
        columnTop,
        startClientY: event.clientY,
        moved: false,
        fixedMinutes: edge === 'start' ? shiftEndMinutes : shiftStartMinutes,
        currentValue: edge === 'start' ? shiftStartMinutes : shiftEndMinutes,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = resizeRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.abs(event.clientY - drag.startClientY) > MOVE_THRESHOLD_PX) {
      drag.moved = true;
    }
    if (!drag.moved) return;
    const raw = minutesFromClientY(event.clientY, drag.columnTop, rangeStartMinutes);
    const snapped = snapMinutes(raw);
    const value =
      drag.edge === 'start'
        ? clampMinutes(snapped, rangeStartMinutes, drag.fixedMinutes - MIN_DURATION_MINUTES)
        : clampMinutes(snapped, drag.fixedMinutes + MIN_DURATION_MINUTES, rangeEndMinutes);
    drag.currentValue = value;

    onDragUpdate({
      kind: drag.edge === 'start' ? 'resize-start' : 'resize-end',
      day: shift.day,
      startMinutes: drag.edge === 'start' ? value : drag.fixedMinutes,
      endMinutes: drag.edge === 'start' ? drag.fixedMinutes : value,
      personId: shift.personId,
      shiftId: shift.id,
    });
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = resizeRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    onDragUpdate(null);
    if (!drag.moved) {
      onOpenEdit(shift.id);
      return;
    }
    onDragCommit({
      kind: drag.edge === 'start' ? 'resize-start' : 'resize-end',
      day: shift.day,
      startMinutes: drag.edge === 'start' ? drag.currentValue : drag.fixedMinutes,
      endMinutes: drag.edge === 'start' ? drag.fixedMinutes : drag.currentValue,
      personId: shift.personId,
      shiftId: shift.id,
    });
  }

  function handleResizePointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = resizeRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    resizeRef.current = null;
    onDragUpdate(null);
  }

  return (
    <button
      type="button"
      onPointerDown={handleBodyPointerDown}
      onPointerMove={handleBodyPointerMove}
      onPointerUp={handleBodyPointerUp}
      onPointerCancel={handleBodyPointerCancel}
      className={`absolute touch-none overflow-hidden rounded-lg border px-1.5 py-1 text-left text-[11px] leading-tight text-white shadow-sm transition-[opacity,box-shadow,transform] duration-150 hover:z-10 hover:shadow-md focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${
        hasConflict ? 'ring-2 ring-amber-400' : 'border-white/40'
      } ${isDragging ? 'opacity-40' : 'opacity-100'} cursor-grab active:cursor-grabbing`}
      style={{ top, height, left, width, backgroundColor: person?.color ?? '#94a3b8' }}
      title={`${person?.name ?? ''}: ${shift.startTime}-${shift.endTime}. Arrastra para mover, toca los bordes para cambiar la duración.`}
    >
      {!startsBefore && (
        <div
          onPointerDown={handleResizePointerDown('start')}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerCancel}
          className="absolute inset-x-0 top-0 touch-none cursor-ns-resize"
          style={{ height: HANDLE_HEIGHT }}
          aria-hidden="true"
        />
      )}
      <span className="block truncate font-semibold">{person?.name}</span>
      <span className="block truncate">
        {shift.startTime}–{shift.endTime}
        {overnight ? ' (+1 día)' : ''}
      </span>
      <span className="block truncate opacity-90">{formatMinutesAsHours(worked)}</span>
      {startsBefore && <span className="block truncate font-semibold">↳ comenzó antes</span>}
      {spillsOver && <span className="block truncate font-semibold">↴ continúa mañana</span>}
      {!spillsOver && (
        <div
          onPointerDown={handleResizePointerDown('end')}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerCancel}
          className="absolute inset-x-0 bottom-0 touch-none cursor-ns-resize"
          style={{ height: HANDLE_HEIGHT }}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
