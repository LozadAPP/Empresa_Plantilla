/**
 * Colores de estado para badges y chips
 * Centraliza los colores de estado para consistencia
 */

// Colores para estados de renta
export const RENTAL_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  reserved: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  overdue: 'bg-orange-100 text-orange-800'
};

// Colores para estados de pago
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

// Colores para tipos de pago
export const PAYMENT_TYPE_COLORS: Record<string, string> = {
  deposit: 'bg-blue-100 text-blue-800',
  rental_payment: 'bg-green-100 text-green-800',
  penalty: 'bg-red-100 text-red-800',
  refund: 'bg-gray-100 text-gray-800'
};

// Colores para estados de factura
export const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

/**
 * Etiquetas en espanol para estados de factura
 */
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada'
};

// Colores para condición de vehículo
export const VEHICLE_CONDITION_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
  damaged: 'bg-red-100 text-red-800'
};

/**
 * Obtiene el color de estado de forma segura
 */
export const getStatusColor = (
  status: string | undefined,
  colorMap: Record<string, string>
): string => {
  if (!status) return 'bg-gray-100 text-gray-800';
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Etiquetas en español para estados de renta
 */
export const RENTAL_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  reserved: 'Reservada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  overdue: 'Vencida'
};

/**
 * Etiquetas en español para estados de pago
 */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completado',
  failed: 'Fallido',
  refunded: 'Reembolsado'
};

/**
 * Etiquetas en español para tipos de pago
 */
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  deposit: 'Depósito',
  rental_payment: 'Pago de Renta',
  penalty: 'Penalidad',
  refund: 'Reembolso',
  full: 'Completo',
  partial: 'Parcial',
  balance: 'Saldo'
};

/**
 * Etiquetas en español para métodos de pago
 */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  bank_transfer: 'Transferencia Bancaria',
  transfer: 'Transferencia',
  check: 'Cheque'
};

/**
 * Etiquetas en español para niveles de combustible
 */
export const FUEL_LEVEL_LABELS: Record<string, string> = {
  empty: 'Vacío',
  quarter: '1/4',
  half: '1/2',
  three_quarters: '3/4',
  full: 'Lleno'
};

/**
 * Etiquetas en español para condición de vehículo
 */
export const VEHICLE_CONDITION_LABELS: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Regular',
  poor: 'Malo',
  damaged: 'Dañado'
};
