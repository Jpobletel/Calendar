import type { CSSProperties } from 'react';
import type { ExportJob } from './types';
import type { Person, Schedule } from '../../types';
import { DAY_LABELS, DAY_LABELS_SHORT } from '../../types';
import { getCalendarVisibleRange } from '../../utils/calendarLayout';
import { detectConflicts, isShiftInConflict } from '../../utils/conflicts';
import { getOrderedDayIndices } from '../../utils/days';
import { assignOverlapLanes } from '../../utils/layout';
import { calculateAllStats, calculateDailyTotal, calculateWeeklyTotal } from '../../utils/totals';
import {
  formatMinutesAsHours,
  getShiftDurationMinutes,
  getWorkedMinutes,
  isOvernightShift,
  timeToMinutes,
} from '../../utils/time';
import { sortPeopleByOrder, sortShiftsByStartTime } from '../../utils/sort';

interface Palette {
  bg: string;
  cardBg: string;
  text: string;
  subtext: string;
  border: string;
}

function getPalette(background: 'light' | 'dark'): Palette {
  return background === 'dark'
    ? { bg: '#0f172a', cardBg: '#1e293b', text: '#f1f5f9', subtext: '#94a3b8', border: '#334155' }
    : { bg: '#ffffff', cardBg: '#f8fafc', text: '#0f172a', subtext: '#64748b', border: '#e2e8f0' };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Dot({ color, name, palette }: { color: string; name: string; palette: Palette }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: palette.text }}>
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 9999,
          backgroundColor: color,
          color: '#fff',
          fontSize: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
        }}
      >
        {initials(name)}
      </span>
      {name}
    </span>
  );
}

function Header({ schedule, people, palette, subtitle }: { schedule: Schedule; people: Person[]; palette: Palette; subtitle: string }) {
  const dateStr = new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' });
  return (
    <header style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${palette.border}` }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: palette.text, margin: 0 }}>{schedule.name}</h1>
      <p style={{ fontSize: 13, color: palette.subtext, margin: '4px 0 0' }}>
        {subtitle} · Generado el {dateStr}
      </p>
      {people.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {people.map((p) => (
            <Dot key={p.id} color={p.color} name={p.name} palette={palette} />
          ))}
        </div>
      )}
    </header>
  );
}

function cellStyle(palette: Palette): CSSProperties {
  return { border: `1px solid ${palette.border}`, padding: '8px 10px', verticalAlign: 'top', fontSize: 12, color: palette.text };
}

function WeekTable({ schedule, people, days, palette }: { schedule: Schedule; people: Person[]; days: number[]; palette: Palette }) {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>Persona</th>
          {days.map((day) => (
            <th key={day} style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>
              {DAY_LABELS_SHORT[day]}
            </th>
          ))}
          <th style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>Total semanal</th>
        </tr>
      </thead>
      <tbody>
        {people.map((person) => (
          <tr key={person.id}>
            <td style={cellStyle(palette)}>
              <Dot color={person.color} name={person.name} palette={palette} />
            </td>
            {days.map((day) => {
              const dayShifts = sortShiftsByStartTime(schedule.shifts.filter((s) => s.personId === person.id && s.day === day));
              return (
                <td key={day} style={cellStyle(palette)}>
                  {dayShifts.length === 0 ? (
                    <span style={{ color: palette.subtext }}>—</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayShifts.map((shift) => {
                        const worked = getWorkedMinutes(shift.startTime, shift.endTime, shift.breakMinutes);
                        const overnight = isOvernightShift(shift.startTime, shift.endTime);
                        return (
                          <div key={shift.id} style={{ borderLeft: `3px solid ${person.color}`, paddingLeft: 6 }}>
                            <div style={{ fontWeight: 600 }}>
                              {shift.startTime}–{shift.endTime}
                              {overnight ? ' (+1 día)' : ''}
                            </div>
                            <div style={{ color: palette.subtext }}>{formatMinutesAsHours(worked)}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              );
            })}
            <td style={{ ...cellStyle(palette), fontWeight: 700 }}>
              {formatMinutesAsHours(calculateWeeklyTotal(schedule.shifts.filter((s) => days.includes(s.day)), person.id))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const EXPORT_HOUR_HEIGHT = 44;

function readableTextColor(color: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return '#ffffff';
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return (red * 299 + green * 587 + blue * 114) / 1000 > 165 ? '#0f172a' : '#ffffff';
}

function CalendarSnapshot({
  schedule,
  people,
  days,
  palette,
}: {
  schedule: Schedule;
  people: Person[];
  days: number[];
  palette: Palette;
}) {
  const visiblePersonIds = new Set(people.map((person) => person.id));
  const { startHour, endHour } = getCalendarVisibleRange(schedule, visiblePersonIds);
  const totalHours = Math.max(1, endHour - startHour);
  const rangeStartMinutes = startHour * 60;
  const rangeEndMinutes = endHour * 60;
  const hourMarks = Array.from({ length: totalHours + 1 }, (_, index) => startHour + index);
  const conflicts = detectConflicts(schedule.shifts);
  const gridHeight = totalHours * EXPORT_HOUR_HEIGHT;

  return (
    <div>
      <div
        data-export-calendar=""
        style={{
          display: 'flex',
          overflow: 'hidden',
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
          backgroundColor: palette.bg,
        }}
      >
        <div style={{ width: 58, flexShrink: 0, borderRight: `1px solid ${palette.border}` }}>
          <div style={{ height: 36, backgroundColor: palette.cardBg, borderBottom: `1px solid ${palette.border}` }} />
          <div style={{ position: 'relative', height: gridHeight }}>
            {hourMarks.map((hour, index) => (
              <span
                key={hour}
                style={{
                  position: 'absolute',
                  top: index * EXPORT_HOUR_HEIGHT,
                  right: 6,
                  transform:
                    index === 0 ? 'translateY(0)' : index === hourMarks.length - 1 ? 'translateY(-100%)' : 'translateY(-50%)',
                  fontSize: 9,
                  fontWeight: 600,
                  color: palette.subtext,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(hour % 24).padStart(2, '0')}:00
              </span>
            ))}
          </div>
        </div>

        {days.map((day) => {
          const dayShifts = schedule.shifts.filter(
            (shift) => shift.day === day && visiblePersonIds.has(shift.personId),
          );
          const laneItems = dayShifts.map((shift) => ({
            id: shift.id,
            start: timeToMinutes(shift.startTime),
            end: timeToMinutes(shift.startTime) + getShiftDurationMinutes(shift.startTime, shift.endTime),
          }));
          const { lanes, laneCount } = assignOverlapLanes(laneItems);

          return (
            <div
              key={day}
              style={{
                minWidth: 0,
                flex: 1,
                borderRight: day === days[days.length - 1] ? undefined : `1px solid ${palette.border}`,
              }}
            >
              <div
                style={{
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: `1px solid ${palette.border}`,
                  backgroundColor: palette.cardBg,
                  color: palette.text,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {DAY_LABELS_SHORT[day]}
              </div>
              <div style={{ position: 'relative', height: gridHeight }}>
                {hourMarks.slice(0, -1).map((hour, index) => (
                  <div
                    key={hour}
                    style={{
                      position: 'absolute',
                      insetInline: 0,
                      top: index * EXPORT_HOUR_HEIGHT,
                      borderTop: `1px solid ${palette.border}`,
                      opacity: 0.65,
                    }}
                  />
                ))}
                {dayShifts.map((shift) => {
                  const person = schedule.people.find((candidate) => candidate.id === shift.personId);
                  const startMinutes = timeToMinutes(shift.startTime);
                  const durationMinutes = getShiftDurationMinutes(shift.startTime, shift.endTime);
                  const endMinutes = startMinutes + durationMinutes;
                  if (endMinutes <= rangeStartMinutes || startMinutes >= rangeEndMinutes) return null;

                  const visibleStart = Math.max(startMinutes, rangeStartMinutes);
                  const visibleEnd = Math.min(endMinutes, rangeEndMinutes);
                  const top = ((visibleStart - rangeStartMinutes) / 60) * EXPORT_HOUR_HEIGHT;
                  const height = Math.max(
                    16,
                    ((visibleEnd - visibleStart) / 60) * EXPORT_HOUR_HEIGHT,
                  );
                  const lane = lanes.get(shift.id) ?? 0;
                  const color = person?.color ?? '#64748b';
                  const compact = height < 34;

                  return (
                    <div
                      key={shift.id}
                      data-export-calendar-block=""
                      style={{
                        position: 'absolute',
                        top,
                        height,
                        left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                        width: `calc(${100 / laneCount}% - 4px)`,
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        borderRadius: 6,
                        border: isShiftInConflict(conflicts, shift.id)
                          ? '2px solid #fbbf24'
                          : '1px solid rgba(255,255,255,0.55)',
                        backgroundColor: color,
                        color: readableTextColor(color),
                        padding: compact ? '2px 4px' : '4px 5px',
                        boxShadow: '0 2px 5px rgba(15,23,42,0.18)',
                        fontSize: compact ? 8 : 9,
                        lineHeight: 1.15,
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 }}>
                        {person?.name}
                      </div>
                      {!compact && (
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 650 }}>
                          {shift.startTime}–{shift.endTime}
                          {isOvernightShift(shift.startTime, shift.endTime) ? ' +1' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ margin: '0 0 10px', color: palette.text, fontSize: 18, fontWeight: 800 }}>
          Resumen semanal
        </h2>
        <SummaryTable schedule={schedule} people={people} days={days} palette={palette} />
      </section>
    </div>
  );
}

function DayList({ schedule, people, day, palette }: { schedule: Schedule; people: Person[]; day: number; palette: Palette }) {
  const dayShifts = sortShiftsByStartTime(schedule.shifts.filter((s) => s.day === day && people.some((p) => p.id === s.personId)));
  const total = people.reduce((sum, p) => sum + calculateDailyTotal(schedule.shifts, p.id, day), 0);
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: palette.text, marginBottom: 12 }}>{DAY_LABELS[day]}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dayShifts.map((shift) => {
          const person = schedule.people.find((p) => p.id === shift.personId);
          const worked = getWorkedMinutes(shift.startTime, shift.endTime, shift.breakMinutes);
          const overnight = isOvernightShift(shift.startTime, shift.endTime);
          return (
            <div
              key={shift.id}
              style={{ borderLeft: `4px solid ${person?.color ?? '#94a3b8'}`, backgroundColor: palette.cardBg, borderRadius: 8, padding: '8px 12px' }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: palette.text }}>{person?.name}</div>
              <div style={{ fontSize: 12, color: palette.subtext }}>
                {shift.startTime}–{shift.endTime}
                {overnight ? ' (+1 día)' : ''} · {formatMinutesAsHours(worked)}
                {shift.location ? ` · ${shift.location}` : ''}
              </div>
              {shift.note && <div style={{ fontSize: 12, fontStyle: 'italic', color: palette.subtext }}>{shift.note}</div>}
            </div>
          );
        })}
      </div>
      <p style={{ marginTop: 16, fontWeight: 700, color: palette.text }}>Total del día: {formatMinutesAsHours(total)}</p>
    </div>
  );
}

function PersonSection({ schedule, person, days, palette }: { schedule: Schedule; person: Person; days: number[]; palette: Palette }) {
  const stats = calculateAllStats(schedule.shifts, [person.id]).get(person.id);
  return (
    <section style={{ marginBottom: 28, breakInside: 'avoid' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Dot color={person.color} name={person.name} palette={palette} />
        <span style={{ fontSize: 12, color: palette.subtext }}>
          {formatMinutesAsHours(stats?.weeklyMinutes ?? 0)} · {stats?.shiftCount ?? 0} turno(s)
        </span>
      </div>
      <WeekTable schedule={schedule} people={[person]} days={days} palette={palette} />
    </section>
  );
}

function SummaryTable({ schedule, people, days, palette }: { schedule: Schedule; people: Person[]; days: number[]; palette: Palette }) {
  const stats = calculateAllStats(schedule.shifts, people.map((p) => p.id));
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>Persona</th>
          {days.map((day) => (
            <th key={day} style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>
              {DAY_LABELS_SHORT[day]}
            </th>
          ))}
          <th style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>Total</th>
          <th style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>Turnos</th>
          <th style={{ ...cellStyle(palette), backgroundColor: palette.cardBg, textAlign: 'left', fontWeight: 700 }}>Promedio/día</th>
        </tr>
      </thead>
      <tbody>
        {people.map((person) => {
          const s = stats.get(person.id);
          return (
            <tr key={person.id}>
              <td style={cellStyle(palette)}>
                <Dot color={person.color} name={person.name} palette={palette} />
              </td>
              {days.map((day) => (
                <td key={day} style={cellStyle(palette)}>{formatMinutesAsHours(s?.dailyMinutes[day] ?? 0)}</td>
              ))}
              <td style={{ ...cellStyle(palette), fontWeight: 700 }}>{formatMinutesAsHours(s?.weeklyMinutes ?? 0)}</td>
              <td style={cellStyle(palette)}>{s?.shiftCount ?? 0}</td>
              <td style={cellStyle(palette)}>{formatMinutesAsHours(s?.avgMinutesPerDayWorked ?? 0)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Contenido estático usado únicamente para generar imágenes/impresión: sin botones, formularios ni menús. */
export function ExportContent({ job }: { job: ExportJob }) {
  const palette = getPalette(job.background);
  const days = getOrderedDayIndices(job.schedule.viewSettings.weekStart);
  const filteredDays =
    job.schedule.viewSettings.dayFilter === 'weekdays' ? days.filter((d) => d <= 4) : days;

  let people: Person[];
  let subtitle: string;
  let body: JSX.Element;

  if (job.scope === 'calendarSnapshot') {
    people = sortPeopleByOrder(job.schedule.people.filter((person) => person.visible));
    const visiblePersonIds = new Set(people.map((person) => person.id));
    const snapshotDays = days.filter(
      (day) =>
        day <= 4 ||
        job.schedule.shifts.some(
          (shift) => shift.day === day && visiblePersonIds.has(shift.personId),
        ),
    );
    subtitle = 'Calendario visual y resumen semanal';
    body = <CalendarSnapshot schedule={job.schedule} people={people} days={snapshotDays} palette={palette} />;
  } else if (job.scope === 'person' && job.personId) {
    const person = job.schedule.people.find((p) => p.id === job.personId);
    people = person ? [person] : [];
    subtitle = `Horario de ${person?.name ?? ''}`;
    body = person ? (
      <PersonSection schedule={job.schedule} person={person} days={filteredDays} palette={palette} />
    ) : (
      <p>Persona no encontrada.</p>
    );
  } else if (job.scope === 'allPeople') {
    people = sortPeopleByOrder(job.schedule.people);
    subtitle = 'Horarios de todas las personas';
    body = (
      <div>
        {people.map((person) => (
          <PersonSection key={person.id} schedule={job.schedule} person={person} days={filteredDays} palette={palette} />
        ))}
      </div>
    );
  } else if (job.scope === 'day' && job.day !== undefined) {
    people = sortPeopleByOrder(job.schedule.people.filter((p) => p.visible));
    subtitle = 'Vista diaria';
    body = <DayList schedule={job.schedule} people={people} day={job.day} palette={palette} />;
  } else if (job.scope === 'summary') {
    people = sortPeopleByOrder(job.schedule.people.filter((p) => p.visible));
    subtitle = 'Resumen de horas';
    body = <SummaryTable schedule={job.schedule} people={people} days={filteredDays} palette={palette} />;
  } else {
    people = sortPeopleByOrder(job.schedule.people.filter((p) => p.visible));
    subtitle = 'Horario combinado — semana completa';
    body = <WeekTable schedule={job.schedule} people={people} days={filteredDays} palette={palette} />;
  }

  return (
    <div style={{ backgroundColor: palette.bg, color: palette.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Header schedule={job.schedule} people={people} palette={palette} subtitle={subtitle} />
      {body}
    </div>
  );
}
