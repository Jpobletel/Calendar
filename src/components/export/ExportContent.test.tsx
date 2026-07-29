import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSampleSchedules } from '../../data/sampleData';
import { ExportContent } from './ExportContent';

describe('ExportContent calendar snapshot', () => {
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

  it('renderiza la semana completa con bloques proporcionales y resumen', () => {
    const schedule = createSampleSchedules()[0];
    act(() => {
      root.render(
        <ExportContent
          job={{
            schedule,
            scope: 'calendarSnapshot',
            orientation: 'landscape',
            quality: 'normal',
            background: 'light',
            filenamePrefix: 'calendario',
            filenameSubject: schedule.name,
          }}
        />,
      );
    });

    expect(host.querySelector('[data-export-calendar]')).not.toBeNull();
    expect(host.textContent).toContain('Sáb');
    expect(host.textContent).toContain('Dom');
    expect(host.textContent).toContain('Resumen semanal');

    const blocks = Array.from(host.querySelectorAll<HTMLElement>('[data-export-calendar-block]'));
    expect(blocks.length).toBe(schedule.shifts.length);
    const heights = blocks.map((block) => Number.parseFloat(block.style.height));
    expect(Math.max(...heights)).toBeGreaterThan(Math.min(...heights));
  });
});
