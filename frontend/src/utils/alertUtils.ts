import { alpha } from '@mui/material';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface SeverityConfig {
  color: string;
  bgcolor: string;
  label: string;
}

/**
 * Severity configuration map for alerts
 * Color palette based on tailwind colors
 */
export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
};

export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: 'Crítica',
  warning: 'Advertencia',
  info: 'Informativa'
};

/**
 * Get color for a given severity level
 */
export const getSeverityColor = (severity: string): string => {
  return SEVERITY_COLORS[severity as AlertSeverity] || SEVERITY_COLORS.info;
};

/**
 * Get label for a given severity level
 */
export const getSeverityLabel = (severity: string): string => {
  return SEVERITY_LABELS[severity as AlertSeverity] || SEVERITY_LABELS.info;
};

/**
 * Get full severity configuration including background color with alpha
 */
export const getSeverityConfig = (severity: string, alphaValue: number = 0.1): SeverityConfig => {
  const color = getSeverityColor(severity);
  return {
    color,
    bgcolor: alpha(color, alphaValue),
    label: getSeverityLabel(severity)
  };
};

/**
 * Format relative time from date string
 * Returns strings like "Ahora", "Hace 5 min", "Hace 2h", "Hace 3d"
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
};
