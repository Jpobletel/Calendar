import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSampleSchedules } from '../../data/sampleData';
import { MobileCalendarView } from './MobileCalendarView';

describe('MobileCalendarView', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('muestra días, persona activa y turnos en una agenda de una sola columna', () => {
    const schedule = createSampleSchedules()[0];
    schedule.viewSettings.selectedDay = 0;
    const person = schedule.people[0];
    act(() => {
      root.render(
        <MobileCalendarView
          schedule={schedule}
          visiblePeople={schedule.people}
          days={[0, 1, 2, 3, 4]}
          activePerson={person}
          startHour={8}
          endHour={20}
          conflicts={[]}
          onSelectDay={() => undefined}
          onSetActivePerson={() => undefined}
          onCreateShift={() => undefined}
          onEditShift={() => undefined}
          onMissingActivePerson={() => undefined}
        />,
      );
    });

    expect(host.textContent).toContain('Crear turnos para');
    expect(host.textContent).toContain(person.name);
    expect(host.textContent).toContain('Lunes');
    expect(host.querySelectorAll('[data-mobile-shift]').length).toBeGreaterThan(0);
  });

  it('permite crear tocando un espacio y editar tocando un turno', () => {
    const schedule = createSampleSchedules()[0];
    schedule.viewSettings.selectedDay = 0;
    const person = schedule.people[0];
    const onCreateShift = vi.fn();
    const onEditShift = vi.fn();
    act(() => {
      root.render(
        <MobileCalendarView
          schedule={schedule}
          visiblePeople={schedule.people}
          days={[0, 1, 2, 3, 4]}
          activePerson={person}
          startHour={8}
          endHour={20}
          conflicts={[]}
          onSelectDay={() => undefined}
          onSetActivePerson={() => undefined}
          onCreateShift={onCreateShift}
          onEditShift={onEditShift}
          onMissingActivePerson={() => undefined}
        />,
      );
    });

    const timeline = host.querySelector<HTMLElement>('[aria-label="Calendario del Lunes"]');
    act(() => timeline?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientY: 120 })));
    expect(onCreateShift).toHaveBeenCalledOnce();

    const shift = host.querySelector<HTMLElement>('[data-mobile-shift]');
    act(() => shift?.click());
    expect(onEditShift).toHaveBeenCalledOnce();
  });
});
