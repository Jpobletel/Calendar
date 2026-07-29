import { create } from 'zustand';
import type {
  AppData,
  AppNotification,
  AppSettings,
  NewShiftInput,
  NotificationType,
  Person,
  Schedule,
  ScheduleViewSettings,
  Shift,
  ThemeMode,
} from '../types';
import {
  createEmptySchedule,
  createPerson,
  createSampleAppData,
  createSampleSchedules,
  createShift,
} from '../data/sampleData';
import {
  backupCorruptData,
  clearCorruptBackup,
  getCorruptBackup,
  loadAppData,
  resetAppData,
  saveAppData,
} from '../storage/storageService';
import { generateId } from '../utils/id';
import { downloadBlob, generateFilename } from '../utils/files';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UIState {
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  saveError: string | null;
  notifications: AppNotification[];
  corruptDataRaw: string | null;
  corruptDataErrors: string[];
  storageUnavailable: boolean;
}

interface StoreState {
  data: AppData;
  ui: UIState;

  getActiveSchedule: () => Schedule | undefined;
  setActiveSchedule: (id: string) => void;
  createSchedule: (name: string, opts?: { fromCurrent?: boolean }) => string;
  renameSchedule: (id: string, name: string) => void;
  duplicateSchedule: (id: string) => string;
  deleteSchedule: (id: string) => void;
  updateScheduleViewSettings: (id: string, patch: Partial<ScheduleViewSettings>) => void;
  addSampleSchedule: () => string;

  addPerson: (scheduleId: string, name: string, color: string) => string;
  updatePerson: (scheduleId: string, personId: string, patch: Partial<Pick<Person, 'name' | 'color'>>) => void;
  deletePerson: (scheduleId: string, personId: string) => void;
  togglePersonVisibility: (scheduleId: string, personId: string) => void;
  setPeopleVisibility: (scheduleId: string, personIds: string[], visible: boolean) => void;
  reorderPerson: (scheduleId: string, personId: string, direction: 'up' | 'down') => void;
  duplicatePerson: (scheduleId: string, personId: string) => string;
  copyPersonShiftsTo: (scheduleId: string, sourcePersonId: string, targetPersonId: string) => void;
  setActivePerson: (scheduleId: string, personId: string | null) => void;

  addShift: (scheduleId: string, input: NewShiftInput) => string;
  updateShift: (scheduleId: string, shiftId: string, patch: Partial<Shift>) => void;
  deleteShift: (scheduleId: string, shiftId: string) => void;
  duplicateShift: (scheduleId: string, shiftId: string) => string;
  repeatShift: (scheduleId: string, shiftId: string, targets: { days?: number[]; personIds?: string[] }) => number;

  replaceAllData: (data: AppData) => void;
  mergeSchedules: (schedules: Schedule[]) => void;

  pushNotification: (
    type: NotificationType,
    message: string,
    opts?: { persistent?: boolean; undo?: { label: string; onUndo: () => void } },
  ) => void;
  dismissNotification: (id: string) => void;

  setTheme: (theme: ThemeMode) => void;

  saveNow: () => void;
  dismissCorruptData: () => void;
  downloadCorruptBackup: () => void;
  hardReset: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

function withSchedule(data: AppData, scheduleId: string, updater: (s: Schedule) => Schedule): AppData {
  return {
    ...data,
    schedules: data.schedules.map((s) => (s.id === scheduleId ? { ...updater(s), updatedAt: nowIso() } : s)),
  };
}

/** Clona un horario completo generando IDs nuevos para el horario, sus personas y turnos. */
function cloneScheduleWithNewIds(schedule: Schedule, newName: string): Schedule {
  const timestamp = nowIso();
  const idMap = new Map<string, string>();
  const people = schedule.people.map((p) => {
    const newId = generateId('person');
    idMap.set(p.id, newId);
    return { ...p, id: newId };
  });
  const shifts = schedule.shifts.map((sh) => ({
    ...sh,
    id: generateId('shift'),
    personId: idMap.get(sh.personId) ?? sh.personId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  return {
    id: generateId('schedule'),
    name: newName,
    people,
    shifts,
    viewSettings: { ...schedule.viewSettings, selectedPersonIds: people.map((p) => p.id) },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function initUIState(): UIState {
  return {
    saveStatus: 'idle',
    lastSavedAt: null,
    saveError: null,
    notifications: [],
    corruptDataRaw: null,
    corruptDataErrors: [],
    storageUnavailable: false,
  };
}

function initAppData(): { data: AppData; ui: UIState } {
  const ui = initUIState();
  const result = loadAppData();
  if (result.status === 'ok') {
    return { data: result.data, ui };
  }
  if (result.status === 'empty') {
    return { data: createSampleAppData(), ui };
  }
  if (result.status === 'corrupted') {
    backupCorruptData(result.raw);
    return {
      data: createSampleAppData(),
      ui: { ...ui, corruptDataRaw: result.raw, corruptDataErrors: result.errors },
    };
  }
  // unavailable
  return { data: createSampleAppData(), ui: { ...ui, storageUnavailable: true } };
}

const { data: initialData, ui: initialUi } = initAppData();

export const useStore = create<StoreState>()((set, get) => ({
  data: initialData,
  ui: initialUi,

  getActiveSchedule: () => {
    const { data } = get();
    return data.schedules.find((s) => s.id === data.settings.lastScheduleId) ?? data.schedules[0];
  },

  setActiveSchedule: (id) => {
    set((s) => ({ data: { ...s.data, settings: { ...s.data.settings, lastScheduleId: id } } }));
  },

  createSchedule: (name, opts) => {
    const active = get().getActiveSchedule();
    const schedule = opts?.fromCurrent && active ? cloneScheduleWithNewIds(active, name) : createEmptySchedule(name);
    set((s) => ({
      data: {
        ...s.data,
        schedules: [...s.data.schedules, schedule],
        settings: { ...s.data.settings, lastScheduleId: schedule.id },
      },
    }));
    get().pushNotification('success', `Horario "${name}" creado.`);
    return schedule.id;
  },

  renameSchedule: (id, name) => {
    set((s) => ({ data: withSchedule(s.data, id, (sch) => ({ ...sch, name })) }));
    get().pushNotification('success', 'Horario renombrado.');
  },

  duplicateSchedule: (id) => {
    const schedule = get().data.schedules.find((s) => s.id === id);
    if (!schedule) return '';
    const clone = cloneScheduleWithNewIds(schedule, `${schedule.name} (copia)`);
    set((s) => ({
      data: {
        ...s.data,
        schedules: [...s.data.schedules, clone],
        settings: { ...s.data.settings, lastScheduleId: clone.id },
      },
    }));
    get().pushNotification('success', 'Horario duplicado.');
    return clone.id;
  },

  deleteSchedule: (id) => {
    const deleted = get().data.schedules.find((s) => s.id === id);
    set((s) => {
      const remaining = s.data.schedules.filter((sch) => sch.id !== id);
      let schedules = remaining;
      let lastScheduleId = s.data.settings.lastScheduleId;
      if (schedules.length === 0) {
        const empty = createEmptySchedule('Nuevo horario');
        schedules = [empty];
        lastScheduleId = empty.id;
      } else if (lastScheduleId === id) {
        lastScheduleId = schedules[0].id;
      }
      return { data: { ...s.data, schedules, settings: { ...s.data.settings, lastScheduleId } } };
    });
    get().pushNotification('success', `Horario "${deleted?.name ?? ''}" eliminado.`);
  },

  updateScheduleViewSettings: (id, patch) => {
    set((s) => ({
      data: withSchedule(s.data, id, (sch) => ({ ...sch, viewSettings: { ...sch.viewSettings, ...patch } })),
    }));
  },

  addSampleSchedule: () => {
    const samples = createSampleSchedules();
    set((s) => ({
      data: {
        ...s.data,
        schedules: [...s.data.schedules, ...samples],
        settings: { ...s.data.settings, lastScheduleId: samples[0].id },
      },
    }));
    get().pushNotification('success', `Se agregaron ${samples.length} horarios de ejemplo.`);
    return samples[0].id;
  },

  addPerson: (scheduleId, name, color) => {
    const person = createPerson(name, color, 0);
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        people: [...sch.people, { ...person, order: sch.people.length }],
        viewSettings: { ...sch.viewSettings, selectedPersonIds: [...sch.viewSettings.selectedPersonIds, person.id] },
      })),
    }));
    get().pushNotification('success', `Persona "${name}" creada.`);
    return person.id;
  },

  updatePerson: (scheduleId, personId, patch) => {
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        people: sch.people.map((p) => (p.id === personId ? { ...p, ...patch } : p)),
      })),
    }));
    get().pushNotification('success', 'Persona actualizada.');
  },

  deletePerson: (scheduleId, personId) => {
    const schedule = get().data.schedules.find((s) => s.id === scheduleId);
    const person = schedule?.people.find((p) => p.id === personId);
    const removedShifts = schedule?.shifts.filter((sh) => sh.personId === personId) ?? [];
    if (!schedule || !person) return;
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        people: sch.people.filter((p) => p.id !== personId),
        shifts: sch.shifts.filter((sh) => sh.personId !== personId),
        viewSettings: {
          ...sch.viewSettings,
          selectedPersonIds: sch.viewSettings.selectedPersonIds.filter((id) => id !== personId),
        },
      })),
    }));
    get().pushNotification('success', `Persona "${person.name}" eliminada.`, {
      undo: {
        label: 'Deshacer',
        onUndo: () => {
          set((s) => ({
            data: withSchedule(s.data, scheduleId, (sch) => ({
              ...sch,
              people: [...sch.people, person],
              shifts: [...sch.shifts, ...removedShifts],
              viewSettings: {
                ...sch.viewSettings,
                selectedPersonIds: [...sch.viewSettings.selectedPersonIds, personId],
              },
            })),
          }));
        },
      },
    });
  },

  togglePersonVisibility: (scheduleId, personId) => {
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        people: sch.people.map((p) => (p.id === personId ? { ...p, visible: !p.visible } : p)),
      })),
    }));
  },

  setPeopleVisibility: (scheduleId, personIds, visible) => {
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        people: sch.people.map((p) => (personIds.includes(p.id) ? { ...p, visible } : p)),
      })),
    }));
  },

  reorderPerson: (scheduleId, personId, direction) => {
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => {
        const sorted = [...sch.people].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((p) => p.id === personId);
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return sch;
        const a = sorted[idx];
        const b = sorted[swapIdx];
        const people = sch.people.map((p) => {
          if (p.id === a.id) return { ...p, order: b.order };
          if (p.id === b.id) return { ...p, order: a.order };
          return p;
        });
        return { ...sch, people };
      }),
    }));
  },

  duplicatePerson: (scheduleId, personId) => {
    const schedule = get().data.schedules.find((s) => s.id === scheduleId);
    const person = schedule?.people.find((p) => p.id === personId);
    if (!schedule || !person) return '';
    const newPerson = createPerson(`${person.name} (copia)`, person.color, schedule.people.length);
    const copiedShifts = schedule.shifts
      .filter((sh) => sh.personId === personId)
      .map((sh) =>
        createShift({
          personId: newPerson.id,
          day: sh.day,
          startTime: sh.startTime,
          endTime: sh.endTime,
          breakMinutes: sh.breakMinutes,
          note: sh.note,
          location: sh.location,
        }),
      );
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        people: [...sch.people, newPerson],
        shifts: [...sch.shifts, ...copiedShifts],
        viewSettings: { ...sch.viewSettings, selectedPersonIds: [...sch.viewSettings.selectedPersonIds, newPerson.id] },
      })),
    }));
    get().pushNotification('success', `Persona "${newPerson.name}" duplicada con sus turnos.`);
    return newPerson.id;
  },

  copyPersonShiftsTo: (scheduleId, sourcePersonId, targetPersonId) => {
    const schedule = get().data.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;
    const copiedShifts = schedule.shifts
      .filter((sh) => sh.personId === sourcePersonId)
      .map((sh) =>
        createShift({
          personId: targetPersonId,
          day: sh.day,
          startTime: sh.startTime,
          endTime: sh.endTime,
          breakMinutes: sh.breakMinutes,
          note: sh.note,
          location: sh.location,
        }),
      );
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({ ...sch, shifts: [...sch.shifts, ...copiedShifts] })),
    }));
    get().pushNotification('success', `${copiedShifts.length} turno(s) copiado(s).`);
  },

  setActivePerson: (scheduleId, personId) => {
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        viewSettings: { ...sch.viewSettings, activePersonId: personId },
      })),
    }));
  },

  addShift: (scheduleId, input) => {
    const shift = createShift(input);
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({ ...sch, shifts: [...sch.shifts, shift] })),
    }));
    get().pushNotification('success', 'Turno creado.');
    return shift.id;
  },

  updateShift: (scheduleId, shiftId, patch) => {
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({
        ...sch,
        shifts: sch.shifts.map((sh) => (sh.id === shiftId ? { ...sh, ...patch, updatedAt: nowIso() } : sh)),
      })),
    }));
    get().pushNotification('success', 'Turno actualizado.');
  },

  deleteShift: (scheduleId, shiftId) => {
    const schedule = get().data.schedules.find((s) => s.id === scheduleId);
    const shift = schedule?.shifts.find((sh) => sh.id === shiftId);
    if (!schedule || !shift) return;
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({ ...sch, shifts: sch.shifts.filter((sh) => sh.id !== shiftId) })),
    }));
    get().pushNotification('success', 'Turno eliminado.', {
      undo: {
        label: 'Deshacer',
        onUndo: () => {
          set((s) => ({
            data: withSchedule(s.data, scheduleId, (sch) => ({ ...sch, shifts: [...sch.shifts, shift] })),
          }));
        },
      },
    });
  },

  duplicateShift: (scheduleId, shiftId) => {
    const schedule = get().data.schedules.find((s) => s.id === scheduleId);
    const original = schedule?.shifts.find((sh) => sh.id === shiftId);
    if (!original) return '';
    const copy = createShift({
      personId: original.personId,
      day: original.day,
      startTime: original.startTime,
      endTime: original.endTime,
      breakMinutes: original.breakMinutes,
      note: original.note,
      location: original.location,
    });
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({ ...sch, shifts: [...sch.shifts, copy] })),
    }));
    get().pushNotification('success', 'Turno duplicado.');
    return copy.id;
  },

  repeatShift: (scheduleId, shiftId, targets) => {
    const schedule = get().data.schedules.find((s) => s.id === scheduleId);
    const original = schedule?.shifts.find((sh) => sh.id === shiftId);
    if (!schedule || !original) return 0;
    const days = targets.days && targets.days.length > 0 ? targets.days : [original.day];
    const personIds = targets.personIds && targets.personIds.length > 0 ? targets.personIds : [original.personId];
    const newShifts: Shift[] = [];
    for (const day of days) {
      for (const personId of personIds) {
        if (day === original.day && personId === original.personId) continue;
        newShifts.push(
          createShift({
            personId,
            day,
            startTime: original.startTime,
            endTime: original.endTime,
            breakMinutes: original.breakMinutes,
            note: original.note,
            location: original.location,
          }),
        );
      }
    }
    if (newShifts.length === 0) return 0;
    set((s) => ({
      data: withSchedule(s.data, scheduleId, (sch) => ({ ...sch, shifts: [...sch.shifts, ...newShifts] })),
    }));
    get().pushNotification(
      'success',
      `Turno repetido: se crearon ${newShifts.length} ${newShifts.length === 1 ? 'turno nuevo' : 'turnos nuevos'}.`,
    );
    return newShifts.length;
  },

  replaceAllData: (newData) => {
    set(() => ({ data: newData }));
    get().pushNotification('success', 'Datos reemplazados correctamente.');
  },

  mergeSchedules: (incoming) => {
    set((s) => {
      const existingNames = new Set(s.data.schedules.map((sch) => sch.name));
      const cloned = incoming.map((sch) => {
        let name = sch.name;
        if (existingNames.has(name)) name = `${name} (importado)`;
        existingNames.add(name);
        return cloneScheduleWithNewIds(sch, name);
      });
      return { data: { ...s.data, schedules: [...s.data.schedules, ...cloned] } };
    });
    get().pushNotification('success', `${incoming.length} horario(s) importado(s) correctamente.`);
  },

  pushNotification: (type, message, opts) => {
    const notification: AppNotification = {
      id: generateId('toast'),
      type,
      message,
      persistent: opts?.persistent ?? type === 'error',
      createdAt: Date.now(),
      undo: opts?.undo,
    };
    set((s) => ({ ui: { ...s.ui, notifications: [...s.ui.notifications, notification] } }));
  },

  dismissNotification: (id) => {
    set((s) => ({ ui: { ...s.ui, notifications: s.ui.notifications.filter((n) => n.id !== id) } }));
  },

  setTheme: (theme) => {
    set((s) => ({ data: { ...s.data, settings: { ...s.data.settings, theme } } }));
  },

  saveNow: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    set((s) => ({ ui: { ...s.ui, saveStatus: 'saving' } }));
    const result = saveAppData(get().data);
    if (result.success) {
      set((s) => ({ ui: { ...s.ui, saveStatus: 'saved', lastSavedAt: nowIso(), saveError: null } }));
      get().pushNotification('success', 'Cambios guardados.');
    } else {
      set((s) => ({ ui: { ...s.ui, saveStatus: 'error', saveError: result.error } }));
      get().pushNotification('error', result.error, { persistent: true });
    }
  },

  dismissCorruptData: () => {
    clearCorruptBackup();
    set((s) => ({ ui: { ...s.ui, corruptDataRaw: null, corruptDataErrors: [] } }));
  },

  downloadCorruptBackup: () => {
    const raw = get().ui.corruptDataRaw ?? getCorruptBackup();
    if (!raw) return;
    downloadBlob(new Blob([raw], { type: 'application/json' }), generateFilename('respaldo-datos-dañados', 'horarios', 'json'));
  },

  hardReset: () => {
    resetAppData();
    clearCorruptBackup();
    const fresh = createSampleAppData();
    set(() => ({ data: fresh, ui: initUIState() }));
    get().pushNotification('success', 'Los datos se restablecieron correctamente.');
  },
}));

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

useStore.subscribe((state, prevState) => {
  if (state.data === prevState.data) return;
  if (state.ui.saveStatus !== 'saving') {
    useStore.setState((s) => ({ ui: { ...s.ui, saveStatus: 'saving' } }));
  }
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const result = saveAppData(useStore.getState().data);
    if (result.success) {
      useStore.setState((s) => ({ ui: { ...s.ui, saveStatus: 'saved', lastSavedAt: nowIso(), saveError: null } }));
    } else {
      useStore.setState((s) => ({ ui: { ...s.ui, saveStatus: 'error', saveError: result.error } }));
      useStore.getState().pushNotification('error', result.error, { persistent: true });
    }
  }, 500);
});

export function useAppSettings(): AppSettings {
  return useStore((s) => s.data.settings);
}
