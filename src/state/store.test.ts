import { beforeEach, describe, expect, it } from 'vitest';
import { createSampleAppData } from '../data/sampleData';
import { useStore } from './store';

describe('store invariants', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useStore.setState((state) => ({
      data: createSampleAppData(),
      ui: { ...state.ui, notifications: [] },
    }));
  });

  it('remapea la persona activa al duplicar un horario', () => {
    const original = useStore.getState().getActiveSchedule();
    expect(original?.viewSettings.activePersonId).toBeTruthy();

    const duplicateId = useStore.getState().duplicateSchedule(original!.id);
    const duplicate = useStore.getState().data.schedules.find((schedule) => schedule.id === duplicateId);

    expect(duplicate?.viewSettings.activePersonId).not.toBe(original?.viewSettings.activePersonId);
    expect(duplicate?.people.some((person) => person.id === duplicate?.viewSettings.activePersonId)).toBe(true);
  });

  it('mantiene siempre válida la persona activa al ocultarla o eliminarla', () => {
    const schedule = useStore.getState().getActiveSchedule()!;
    const activeId = schedule.viewSettings.activePersonId!;

    useStore.getState().togglePersonVisibility(schedule.id, activeId);
    expect(useStore.getState().getActiveSchedule()?.viewSettings.activePersonId).toBeNull();

    useStore.getState().togglePersonVisibility(schedule.id, activeId);
    useStore.getState().setActivePerson(schedule.id, activeId);
    useStore.getState().deletePerson(schedule.id, activeId);
    const updated = useStore.getState().getActiveSchedule()!;
    expect(updated.people.some((person) => person.id === updated.viewSettings.activePersonId)).toBe(
      updated.viewSettings.activePersonId !== null,
    );
  });

  it('no anuncia una actualización para un turno inexistente', () => {
    const schedule = useStore.getState().getActiveSchedule()!;
    useStore.getState().updateShift(schedule.id, 'turno-inexistente', { startTime: '10:00' });
    expect(useStore.getState().ui.notifications).toHaveLength(0);
  });
});
