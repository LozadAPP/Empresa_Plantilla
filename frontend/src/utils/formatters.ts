/**
 * Utilidades de formateo para el módulo MOVICAR
 * Centraliza funciones de formateo para evitar duplicación
 */

/**
 * Formatea una fecha en formato localizado español (México)
 */
export const formatDate = (
  date: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return 'N/A';

  try {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha con hora
 */
export const formatDateTime = (
  date: string | Date | undefined | null
): string => {
  if (!date) return 'N/A';

  try {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Fecha inválida';
  }
};

/**
 * @deprecated Use useCurrency().formatCurrency del CurrencyContext para soporte global de moneda.
 * Esta función se mantiene como fallback y siempre formatea en MXN.
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00 MXN';
  }

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount) + ' MXN';
};

/**
 * Obtiene el mensaje de error de forma segura
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.message === 'string') return data.message;
      }
    }
  }
  return 'Error desconocido';
};

/**
 * Realiza división segura (evita división por cero)
 */
export const safeDivide = (numerator: number, denominator: number, fallback: number = 0): number => {
  if (!denominator || denominator === 0) return fallback;
  return numerator / denominator;
};

/**
 * Obtiene un valor numérico seguro
 */
export const safeNumber = (value: number | undefined | null, fallback: number = 0): number => {
  if (value === undefined || value === null || isNaN(value)) return fallback;
  return value;
};
