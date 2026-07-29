import type { Person, Shift, SummarySortBy } from '../types';
import type { PersonStats } from './totals';
import { timeToMinutes } from './time';

export function sortPeopleAlphabetically(people: Person[]): Person[] {
  return [...people].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
}

export function sortPeopleByOrder(people: Person[]): Person[] {
  return [...people].sort((a, b) => a.order - b.order);
}

export function sortShiftsByStartTime(shifts: Shift[]): Shift[] {
  return [...shifts].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

export function sortPeopleBySummary(
  people: Person[],
  statsByPerson: Map<string, PersonStats>,
  sortBy: SummarySortBy,
): Person[] {
  const list = [...people];
  const stat = (id: string) => statsByPerson.get(id);
  switch (sortBy) {
    case 'name':
      return sortPeopleAlphabetically(list);
    case 'hoursDesc':
      return list.sort((a, b) => (stat(b.id)?.weeklyMinutes ?? 0) - (stat(a.id)?.weeklyMinutes ?? 0));
    case 'hoursAsc':
      return list.sort((a, b) => (stat(a.id)?.weeklyMinutes ?? 0) - (stat(b.id)?.weeklyMinutes ?? 0));
    case 'shiftsDesc':
      return list.sort((a, b) => (stat(b.id)?.shiftCount ?? 0) - (stat(a.id)?.shiftCount ?? 0));
    case 'shiftsAsc':
      return list.sort((a, b) => (stat(a.id)?.shiftCount ?? 0) - (stat(b.id)?.shiftCount ?? 0));
    default:
      return list;
  }
}
