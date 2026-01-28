/**
 * Componente RentalStatusChip - Chip de estado de renta (CHAT 2)
 */
import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Schedule as ReservedIcon,
  Cancel as CancelledIcon,
  PlayArrow as ActiveIcon,
  Warning as OverdueIcon
} from '@mui/icons-material';
import { RentalStatus } from '../../types/rental';

interface RentalStatusChipProps {
  status: RentalStatus;
  size?: 'small' | 'medium';
}

const RentalStatusChip: React.FC<RentalStatusChipProps> = ({ status, size = 'small' }) => {
  const statusConfig = {
    active: {
      label: 'Activa',
      color: 'success' as const,
      icon: <ActiveIcon sx={{ fontSize: 16 }} />
    },
    reserved: {
      label: 'Reservada',
      color: 'info' as const,
      icon: <ReservedIcon sx={{ fontSize: 16 }} />
    },
    completed: {
      label: 'Completada',
      color: 'default' as const,
      icon: <CompletedIcon sx={{ fontSize: 16 }} />
    },
    cancelled: {
      label: 'Cancelada',
      color: 'error' as const,
      icon: <CancelledIcon sx={{ fontSize: 16 }} />
    },
    overdue: {
      label: 'Vencida',
      color: 'warning' as const,
      icon: <OverdueIcon sx={{ fontSize: 16 }} />
    }
  };

  const config = statusConfig[status] || statusConfig.active;

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      icon={config.icon}
      sx={{ fontWeight: 500 }}
    />
  );
};

export default RentalStatusChip;
