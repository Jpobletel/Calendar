import { APP_DATA_VERSION } from '../types';

/**
 * Cada migración recibe los datos en su versión `n` y retorna los datos en la versión `n + 1`.
 * Registra aquí futuras migraciones cuando el modelo de datos cambie de forma incompatible.
 * Ejemplo:
 *   1: (data) => ({ ...data, version: 2, settings: { ...data.settings, nuevoCampo: valor } }),
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (data: any) => any;

const migrations: Record<number, Migration> = {};

/** Aplica migraciones sucesivas hasta alcanzar la versión actual de la aplicación. */
export function runMigrations(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object') return raw;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data = raw as any;
  let version: number = typeof data.version === 'number' ? data.version : 0;

  while (version < APP_DATA_VERSION && typeof migrations[version] === 'function') {
    data = migrations[version](data);
    version = typeof data.version === 'number' ? data.version : version + 1;
  }
  return data;
}
