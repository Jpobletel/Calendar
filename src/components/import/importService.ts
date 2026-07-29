import type { ExportedData } from '../../types';
import { validateExportedData } from '../../storage/validation';

export interface ImportParseResult {
  valid: boolean;
  errors: string[];
  data?: ExportedData;
}

/** Analiza y valida el texto de un archivo importado. Nunca modifica los datos actuales por sí mismo. */
export function parseImportFile(text: string): ImportParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { valid: false, errors: ['El archivo no contiene JSON válido. Verifica que sea un respaldo exportado desde esta aplicación.'] };
  }
  return validateExportedData(json);
}
