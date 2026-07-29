import { describe, expect, it } from 'vitest';
import { createSampleAppData } from '../data/sampleData';
import { validateAppData } from './validation';

describe('validateAppData', () => {
  it('acepta los datos generados por la aplicación', () => {
    expect(validateAppData(createSampleAppData()).valid).toBe(true);
  });

  it('rechaza referencias rotas y valores de vista desconocidos', () => {
    const brokenReference = createSampleAppData();
    brokenReference.schedules[0].viewSettings.activePersonId = 'persona-inexistente';
    const referenceResult = validateAppData(brokenReference);

    const unknownView = createSampleAppData();
    unknownView.schedules[0].viewSettings.viewMode =
      'vista-inexistente' as typeof unknownView.schedules[0]['viewSettings']['viewMode'];
    const viewResult = validateAppData(unknownView);

    expect(referenceResult.valid).toBe(false);
    expect(referenceResult.errors.some((error) => error.includes('activePersonId'))).toBe(true);
    expect(viewResult.valid).toBe(false);
    expect(viewResult.errors.some((error) => error.includes('viewMode'))).toBe(true);
  });

  it('rechaza turnos de duración cero', () => {
    const data = createSampleAppData();
    data.schedules[0].shifts[0].endTime = data.schedules[0].shifts[0].startTime;
    expect(validateAppData(data).valid).toBe(false);
  });
});
