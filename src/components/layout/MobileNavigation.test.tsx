import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSampleAppData } from '../../data/sampleData';
import { useStore } from '../../state/store';
import { MobileNavigation } from './MobileNavigation';

describe('MobileNavigation', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    useStore.setState((state) => ({
      data: createSampleAppData(),
      ui: { ...state.ui, notifications: [] },
    }));
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('mantiene el tab Calendario visible y seleccionable', () => {
    act(() => root.render(<MobileNavigation />));
    const calendarTab = Array.from(host.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Calendario',
    );
    expect(calendarTab).toBeDefined();

    act(() => calendarTab?.click());
    expect(useStore.getState().getActiveSchedule()?.viewSettings.viewMode).toBe('calendar');
    expect(calendarTab?.getAttribute('aria-current')).toBe('page');
  });
});
