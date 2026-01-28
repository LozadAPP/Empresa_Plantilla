/**
 * Hook useDebounce - Debounce reutilizable para valores
 * Evita multiples llamadas a API durante escritura
 */
import { useState, useEffect } from 'react';

/**
 * Hook que retrasa la actualizacion de un valor
 * @param value - Valor a debouncer
 * @param delay - Tiempo de espera en ms (default: 300ms)
 * @returns Valor debounced
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * useEffect(() => {
 *   // Se ejecuta 500ms despues de que el usuario deje de escribir
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
