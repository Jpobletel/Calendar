import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('se monta en una capa global y bloquea el scroll de fondo', () => {
    act(() => {
      root.render(
        <Modal isOpen onClose={() => undefined} title="Acciones">
          <button type="button">Editar</button>
        </Modal>,
      );
    });

    const layer = document.body.querySelector('[data-modal-layer]');
    expect(layer).not.toBeNull();
    expect(host.querySelector('[data-modal-layer]')).toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('Escape cierra solamente el diálogo superior', () => {
    const closeFirst = vi.fn();
    const closeSecond = vi.fn();
    act(() => {
      root.render(
        <>
          <Modal isOpen onClose={closeFirst} title="Primero">
            Primero
          </Modal>
          <Modal isOpen onClose={closeSecond} title="Segundo">
            Segundo
          </Modal>
        </>,
      );
    });

    act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(closeFirst).not.toHaveBeenCalled();
    expect(closeSecond).toHaveBeenCalledOnce();
  });
});
