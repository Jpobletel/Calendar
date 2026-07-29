import { useMemo, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { SegmentedControl } from '../common/SegmentedControl';
import { PersonForm } from './PersonForm';
import { PersonListItem } from './PersonListItem';
import { useStore } from '../../state/store';
import type { Schedule } from '../../types';
import { sortPeopleAlphabetically, sortPeopleByOrder } from '../../utils/sort';

interface PeoplePanelProps {
  schedule: Schedule;
}

type SortMode = 'manual' | 'alphabetical';

export function PeoplePanel({ schedule }: PeoplePanelProps) {
  const addPerson = useStore((s) => s.addPerson);
  const setPeopleVisibility = useStore((s) => s.setPeopleVisibility);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = schedule.people.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
    return sortMode === 'alphabetical' ? sortPeopleAlphabetically(list) : sortPeopleByOrder(list);
  }, [schedule.people, query, sortMode]);

  const shiftCountByPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const shift of schedule.shifts) map.set(shift.personId, (map.get(shift.personId) ?? 0) + 1);
    return map;
  }, [schedule.shifts]);

  const allIds = schedule.people.map((p) => p.id);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Personas</h2>
        <Button icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setCreateOpen(true)}>
          Agregar
        </Button>
      </div>

      {schedule.people.length > 0 && (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar persona por nombre"
              aria-label="Buscar persona por nombre"
              className="min-h-touch w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl<SortMode>
              ariaLabel="Orden de la lista de personas"
              value={sortMode}
              onChange={setSortMode}
              options={[
                { value: 'manual', label: 'Manual' },
                { value: 'alphabetical', label: 'A-Z' },
              ]}
            />
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPeopleVisibility(schedule.id, allIds, true)}
                className="min-h-touch rounded-lg px-2 font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950"
              >
                Mostrar todas
              </button>
              <button
                type="button"
                onClick={() => setPeopleVisibility(schedule.id, allIds, false)}
                className="min-h-touch rounded-lg px-2 font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Ocultar todas
              </button>
            </div>
          </div>
        </>
      )}

      {schedule.people.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Todavía no hay personas."
          description="Crea la primera persona para comenzar a organizar el horario."
          action={
            <Button onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Crear persona
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No se encontraron personas con ese nombre.</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {filtered.map((person, index) => (
            <PersonListItem
              key={person.id}
              schedule={schedule}
              person={person}
              shiftCount={shiftCountByPerson.get(person.id) ?? 0}
              manualOrder={sortMode === 'manual'}
              isFirst={index === 0}
              isLast={index === filtered.length - 1}
            />
          ))}
        </ul>
      )}

      <PersonForm
        isOpen={createOpen}
        title="Nueva persona"
        confirmLabel="Crear"
        onClose={() => setCreateOpen(false)}
        onConfirm={(name, color) => {
          addPerson(schedule.id, name, color);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
