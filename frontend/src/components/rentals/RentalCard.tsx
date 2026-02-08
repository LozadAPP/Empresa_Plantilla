/**
 * Componente RentalCard - Tarjeta de renta (CHAT 2)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  IconButton,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  DirectionsCar as VehicleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import RentalStatusChip from './RentalStatusChip';
import { Rental } from '../../types/rental';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface RentalCardProps {
  rental: Rental;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>, rental: Rental) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ rental, onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        },
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/rentals/${rental.id}`)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 0.5 }}>
              {rental.rental_code}
            </Typography>
            <RentalStatusChip status={rental.status} />
          </Box>
          {onMenuClick && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick(e, rental);
              }}
            >
              <MoreIcon />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Cliente */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <PersonIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2" fontWeight="500">
              {rental.customer?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rental.customer?.email}
            </Typography>
          </Box>
        </Box>

        {/* Vehículo */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <VehicleIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2" fontWeight="500">
              {rental.vehicle?.make} {rental.vehicle?.model}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rental.vehicle?.license_plate}
            </Typography>
          </Box>
        </Box>

        {/* Fechas */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <CalendarIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body2">
              {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rental.days} días
            </Typography>
          </Box>
        </Box>

        {/* Total */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MoneyIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
          <Box>
            <Typography variant="body1" fontWeight="600" color="primary">
              {formatCurrency(rental.total_amount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(rental.daily_rate)} / día
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 2, py: 1.5 }}>
        <Button
          size="small"
          startIcon={<ViewIcon />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/rentals/${rental.id}`);
          }}
        >
          Ver Detalles
        </Button>
      </CardActions>
    </Card>
  );
};

export default RentalCard;
