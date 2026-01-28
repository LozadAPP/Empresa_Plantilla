import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  alpha
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Done as DoneIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSeverityColor, getSeverityLabel } from '../../utils/alertUtils';
import { AlertListItem } from '../../types/alert';

interface AlertCardProps {
  alert: AlertListItem;
  onMarkAsRead?: (id: number) => void;
  onResolve?: (id: number) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onMarkAsRead, onResolve }) => {
  const getSeverityConfig = (severity: string) => {
    const color = getSeverityColor(severity);
    const icons: Record<string, JSX.Element> = {
      critical: <ErrorIcon />,
      warning: <WarningIcon />,
      info: <InfoIcon />
    };
    return {
      color,
      bgcolor: alpha(color, 0.1),
      icon: icons[severity] || icons.info,
      label: getSeverityLabel(severity)
    };
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: any = {
      rental_expiring: 'Renta Próxima a Vencer',
      rental_overdue: 'Renta Vencida',
      payment_pending: 'Pago Pendiente',
      maintenance_due: 'Mantenimiento Programado',
      insurance_expiring: 'Seguro por Vencer',
      low_inventory: 'Inventario Bajo',
      system: 'Sistema',
      custom: 'Personalizada'
    };
    return labels[type] || type;
  };

  const severityConfig = getSeverityConfig(alert.severity);

  return (
    <Card
      sx={{
        borderLeft: `4px solid ${severityConfig.color}`,
        bgcolor: alert.isRead ? 'transparent' : severityConfig.bgcolor,
        opacity: alert.isResolved ? 0.6 : 1,
        transition: 'background-color 0.2s ease, opacity 0.2s ease'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
            <Box sx={{ color: severityConfig.color, mt: 0.5 }}>
              {severityConfig.icon}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" fontWeight="600">
                  {alert.title}
                </Typography>
                {!alert.isRead && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#3b82f6'
                    }}
                  />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {alert.message}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={getAlertTypeLabel(alert.alertType)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={severityConfig.label}
                  size="small"
                  sx={{
                    bgcolor: severityConfig.bgcolor,
                    color: severityConfig.color,
                    border: 'none'
                  }}
                />
                <Chip
                  label={format(new Date(alert.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {!alert.isRead && onMarkAsRead && (
              <IconButton
                size="small"
                onClick={() => onMarkAsRead(alert.id)}
                title="Marcar como leída"
              >
                <DoneIcon fontSize="small" />
              </IconButton>
            )}

            {!alert.isResolved && onResolve && (
              <IconButton
                size="small"
                onClick={() => onResolve(alert.id)}
                title="Resolver alerta"
                sx={{ color: '#10b981' }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AlertCard;
