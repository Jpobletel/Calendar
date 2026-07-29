import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSampleSchedules } from '../../data/sampleData';
import { ExportProvider } from '../export/ExportProvider';
import { AppHeader } from './AppHeader';

describe('AppHeader mobile actions', () => {
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

  it('distingue entre guardar cambios y guardar una foto', () => {
    const schedule = createSampleSchedules()[0];
    act(() => {
      root.render(
        <ExportProvider>
          <AppHeader schedule={schedule} onOpenMenu={() => undefined} />
        </ExportProvider>,
      );
    });

    const moreButton = host.querySelector<HTMLButtonElement>('[aria-label="Más acciones"]');
    act(() => moreButton?.click());

    expect(document.body.textContent).toContain('Guardar cambios');
    expect(document.body.textContent).toContain('Guardar foto del calendario');
  });
});
