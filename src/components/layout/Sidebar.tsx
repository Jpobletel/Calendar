import { X } from 'lucide-react';
import { PeoplePanel } from '../people/PeoplePanel';
import type { Schedule } from '../../types';

interface SidebarProps {
  schedule: Schedule;
  isOpen: boolean;
  onClose: () => void;
}

/** Panel de personas: barra lateral fija en escritorio, panel deslizable en móvil. */
export function Sidebar({ schedule, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-[45] bg-slate-900/50 md:hidden" onClick={onClose} aria-hidden="true" />}
      {/*
        Nota: la animación de apertura usa la propiedad `left`, NO `transform` (nada de
        translate-x). Un `transform` (incluso translateX(0)) en un ancestro crea un
        "containing block" para los elementos `position:fixed` que haya dentro (los
        modales de PeoplePanel), y los recortaría al ancho de este panel en vez de cubrir
        toda la pantalla. Ver el mismo comentario en AppHeader.tsx sobre backdrop-blur.
      */}
      <aside
        aria-label="Panel de personas"
        className={`fixed inset-y-0 z-50 flex w-[85%] max-w-xs flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 pb-safe-bottom pt-safe-top shadow-xl transition-[left] duration-200 dark:border-slate-800 dark:bg-slate-900 md:sticky md:left-0 md:top-14 md:z-0 md:h-[calc(100dvh-3.5rem)] md:w-72 md:max-w-none md:border-r md:pt-4 md:shadow-none ${
          isOpen ? 'left-0' : '-left-full'
        }`}
      >
        <div className="mb-2 flex items-center justify-between md:hidden">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Menú</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-touch w-touch items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <PeoplePanel schedule={schedule} />
      </aside>
    </>
  );
}
