import type { Schedule } from '../../types';

export type ExportScope = 'calendarSnapshot' | 'combined' | 'person' | 'allPeople' | 'day' | 'summary';
export type ExportOrientation = 'portrait' | 'landscape';
export type ExportQuality = 'normal' | 'high';
export type ExportBackground = 'light' | 'dark';

export interface ExportJob {
  schedule: Schedule;
  scope: ExportScope;
  personId?: string;
  day?: number;
  orientation: ExportOrientation;
  quality: ExportQuality;
  background: ExportBackground;
  filenamePrefix: string;
  filenameSubject: string;
}
