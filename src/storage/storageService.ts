import type { AppData } from '../types';
import { isLocalStorageAvailable } from '../utils/validation';
import { STORAGE_KEY, STORAGE_KEY_CORRUPT_BACKUP } from './storageKeys';
import { runMigrations } from './migrations';
import { validateAppData } from './validation';

export type LoadResult =
  | { status: 'empty' }
  | { status: 'ok'; data: AppData }
  | { status: 'unavailable'; errors: string[] }
  | { status: 'corrupted'; raw: string; errors: string[] };

export type SaveResult = { success: true } | { success: false; error: string };

/** Lee y valida los datos guardados en localStorage, aplicando migraciones si corresponde. */
export function loadAppData(): LoadResult {
  if (!isLocalStorageAvailable()) {
    return {
      status: 'unavailable',
      errors: ['El almacenamiento local no está disponible en este navegador (modo privado, permisos bloqueados o cuota excedida).'],
    };
  }

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    return { status: 'unavailable', errors: [err instanceof Error ? err.message : 'No se pudo leer el almacenamiento local.'] };
  }

  if (raw === null) return { status: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'corrupted', raw, errors: ['El contenido guardado no es JSON válido y podría estar dañado.'] };
  }

  try {
    const migrated = runMigrations(parsed);
    const result = validateAppData(migrated);
    if (!result.valid || !result.data) {
      return { status: 'corrupted', raw, errors: result.errors };
    }
    return { status: 'ok', data: result.data };
  } catch (err) {
    return {
      status: 'corrupted',
      raw,
      errors: [err instanceof Error ? err.message : 'Ocurrió un error inesperado al leer los datos guardados.'],
    };
  }
}

/** Guarda los datos completos de la aplicación en localStorage. */
export function saveAppData(data: AppData): SaveResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: 'El almacenamiento local no está disponible. Los cambios no se pueden guardar en este navegador.' };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true };
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      return {
        success: false,
        error: 'El almacenamiento local está lleno. Exporta un respaldo en JSON y elimina horarios o turnos que no necesites.',
      };
    }
    return {
      success: false,
      error: `No se pudieron guardar los cambios: ${err instanceof Error ? err.message : 'error desconocido'}.`,
    };
  }
}

/** Elimina por completo los datos guardados (usado al restablecer la aplicación). */
export function resetAppData(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort: si falla, el estado en memoria de todas formas se reiniciará.
  }
}

/** Guarda una copia del contenido corrupto para que el usuario pueda descargarlo. */
export function backupCorruptData(raw: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_CORRUPT_BACKUP, raw);
  } catch {
    // Si tampoco se puede guardar el respaldo, igual se ofrece la descarga inmediata en memoria.
  }
}

export function getCorruptBackup(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY_CORRUPT_BACKUP);
  } catch {
    return null;
  }
}

export function clearCorruptBackup(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY_CORRUPT_BACKUP);
  } catch {
    // no-op
  }
}
