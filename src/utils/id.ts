/** Genera un identificador único, independiente del nombre o contenido de la entidad. */
export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2, 11);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${random}`;
}
