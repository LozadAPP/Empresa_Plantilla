/**
 * Hook centralizado de atajos de teclado usando tinykeys.
 * Ignora shortcuts cuando el foco está en inputs/textareas.
 */
import { useEffect } from 'react';
import { tinykeys } from 'tinykeys';

interface ShortcutHandlers {
  openCommandPalette: () => void;
  openShortcutsDialog: () => void;
  toggleDarkMode: () => void;
  navigate: (path: string) => void;
  closeModals: () => void;
}

/** Definición de atajos para mostrar en el dialog */
export const SHORTCUT_DEFINITIONS = [
  { keys: 'Ctrl + K', description: 'Abrir paleta de comandos' },
  { keys: 'Ctrl + /', description: 'Ver atajos de teclado' },
  { keys: 'Shift + D', description: 'Cambiar tema oscuro/claro' },
  { keys: 'Shift + H', description: 'Ir al Dashboard' },
  { keys: 'Shift + N', description: 'Nueva renta' },
  { keys: 'Shift + C', description: 'Ir a Clientes' },
  { keys: 'Shift + V', description: 'Ir a Inventario' },
  { keys: 'Escape', description: 'Cerrar paleta / diálogos' },
];

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return (document.activeElement as HTMLElement)?.isContentEditable === true;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const withGuard = (fn: () => void) => (e: KeyboardEvent) => {
      if (isInputFocused()) return;
      e.preventDefault();
      fn();
    };

    const unsubscribe = tinykeys(window, {
      '$mod+k': (e: KeyboardEvent) => {
        // Command palette should always open, even from inputs
        e.preventDefault();
        handlers.openCommandPalette();
      },
      '$mod+/': withGuard(handlers.openShortcutsDialog),
      'Shift+D': withGuard(handlers.toggleDarkMode),
      'Shift+H': withGuard(() => handlers.navigate('/dashboard')),
      'Shift+N': withGuard(() => handlers.navigate('/rentals/new')),
      'Shift+C': withGuard(() => handlers.navigate('/customers')),
      'Shift+V': withGuard(() => handlers.navigate('/inventory')),
      'Escape': () => handlers.closeModals(),
    });

    return () => unsubscribe();
  }, [handlers]);
}
