// Alert Types
export interface Alert {
  id: number;
  alertType:
    | 'rental_pending_approval'
    | 'rental_approved'
    | 'rental_rejected'
    | 'rental_expiring'
    | 'rental_overdue'
    | 'payment_pending'
    | 'maintenance_due'
    | 'insurance_expiring'
    | 'low_inventory'
    | 'system'
    | 'custom';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  isResolved: boolean;
  assignedTo?: number;
  resolvedBy?: number;
  resolvedAt?: Date;
  expiresAt?: Date;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateAlertDto {
  alertType: Alert['alertType'];
  severity?: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  assignedTo?: number;
  expiresAt?: string | Date;
  metadata?: any;
}

export interface AlertStats {
  total: number;
  unread: number;
  unresolved: number;
  critical: number;
  bySeverity: Array<{
    severity: string;
    count: number;
  }>;
}

/**
 * Simplified Alert type for list views (dates as strings from API)
 */
export interface AlertListItem {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  isResolved?: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}
