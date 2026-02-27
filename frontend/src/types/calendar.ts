/**
 * Tipos para el módulo de Calendario
 * Unifica eventos de 5 entidades: Rentas, Mantenimiento, Cotizaciones, Alertas Vehículos, Devoluciones
 */

export type CalendarEventType = 'rental' | 'maintenance' | 'quote' | 'vehicle_alert' | 'return' | 'lead_follow_up';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  color: string;
  textColor: string;
  borderColor?: string;
  type: CalendarEventType;
  entityId: number;
  entityPath: string;
  metadata: Record<string, any>;
}

export interface CalendarFilters {
  rental: boolean;
  maintenance: boolean;
  quote: boolean;
  vehicleAlert: boolean;
  return: boolean;
  leadFollowUp: boolean;
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  rental: true,
  maintenance: true,
  quote: true,
  vehicleAlert: true,
  return: true,
  leadFollowUp: true,
};

export const CALENDAR_COLORS = {
  rental: {
    active: '#10b981',
    reserved: '#3b82f6',
    overdue: '#ef4444',
    pending_approval: '#f59e0b',
    completed: '#6b7280',
    cancelled: '#9ca3af',
  },
  maintenance: {
    scheduled: '#8b5cf6',
    in_progress: '#f59e0b',
    completed: '#6b7280',
    cancelled: '#9ca3af',
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#8b5cf6',
  },
  quote: {
    draft: '#9ca3af',
    sent: '#f59e0b',
    accepted: '#10b981',
    rejected: '#ef4444',
    expired: '#ef4444',
    converted: '#6b7280',
  },
  vehicleAlert: {
    insurance: '#ef4444',
    maintenance: '#f97316',
  },
  return: {
    due: '#06b6d4',
    overdue: '#ef4444',
  },
  leadFollowUp: {
    new: '#ec4899',
    contacted: '#8b5cf6',
    qualified: '#10b981',
    proposal: '#f59e0b',
    negotiation: '#f97316',
  },
} as const;

export const CALENDAR_TYPE_LABELS: Record<CalendarEventType, string> = {
  rental: 'Rentas',
  maintenance: 'Mantenimiento',
  quote: 'Cotizaciones',
  vehicle_alert: 'Vehículos',
  return: 'Devoluciones',
  lead_follow_up: 'Seguimientos CRM',
};
