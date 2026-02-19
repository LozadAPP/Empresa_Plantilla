/**
 * Componente PenaltyCalculator - Calculadora de penalidades (CHAT 2)
 */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { differenceInDays } from 'date-fns';
import { formatDate } from '../../utils/formatters';
import { useCurrency } from '../../contexts/CurrencyContext';

interface PenaltyCalculatorProps {
  expectedEndDate: Date | string;
  actualEndDate?: Date | string;
  dailyRate: number;
  cleaningRequired?: boolean;
  damageCost?: number;
  lateFeeMultiplier?: number;
  cleaningCost?: number;
}

interface PenaltyBreakdown {
  lateDays: number;
  lateFee: number;
  cleaningFee: number;
  damageFee: number;
  totalPenalties: number;
  isLate: boolean;
}

const PenaltyCalculator: React.FC<PenaltyCalculatorProps> = ({
  expectedEndDate,
  actualEndDate,
  dailyRate,
  cleaningRequired = false,
  damageCost = 0,
  lateFeeMultiplier = 1.5,
  cleaningCost = 50
}) => {
  const { formatCurrency } = useCurrency();
  const [penalties, setPenalties] = useState<PenaltyBreakdown>({
    lateDays: 0,
    lateFee: 0,
    cleaningFee: 0,
    damageFee: 0,
    totalPenalties: 0,
    isLate: false
  });

  useEffect(() => {
    calculatePenalties();
  }, [expectedEndDate, actualEndDate, dailyRate, cleaningRequired, damageCost]);

  const calculatePenalties = () => {
    const expected = new Date(expectedEndDate);
    const actual = actualEndDate ? new Date(actualEndDate) : new Date();

    // Calcular días de retraso
    const lateDays = Math.max(0, differenceInDays(actual, expected));
    const isLate = lateDays > 0;

    // Calcular penalidad por retraso
    const lateFee = lateDays > 0 ? lateDays * dailyRate * lateFeeMultiplier : 0;

    // Calcular cargo por limpieza
    const cleaningFee = cleaningRequired ? cleaningCost : 0;

    // Daños
    const damageFee = damageCost || 0;

    // Total
    const totalPenalties = lateFee + cleaningFee + damageFee;

    setPenalties({
      lateDays,
      lateFee,
      cleaningFee,
      damageFee,
      totalPenalties,
      isLate
    });
  };

  // Formateo de fecha con mes largo para este componente
  const formatDateLong = (date: Date | string) => formatDate(date, { month: 'long' });

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6" fontWeight="600">
            Cálculo de Penalidades
          </Typography>
        </Box>
        {penalties.isLate ? (
          <Chip
            icon={<WarningIcon />}
            label="Devolución Tardía"
            color="warning"
            size="small"
          />
        ) : (
          <Chip
            icon={<CheckIcon />}
            label="A Tiempo"
            color="success"
            size="small"
          />
        )}
      </Box>

      {/* Fecha esperada vs actual */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Fecha de devolución esperada:
          </Typography>
          <Typography variant="body2" fontWeight="500">
            {formatDateLong(expectedEndDate)}
          </Typography>
        </Box>
        {actualEndDate && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Fecha de devolución real:
            </Typography>
            <Typography variant="body2" fontWeight="500">
              {formatDateLong(actualEndDate)}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Desglose de Penalidades */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Retraso */}
        {penalties.isLate && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Penalidad por retraso ({penalties.lateDays} día{penalties.lateDays > 1 ? 's' : ''})
              </Typography>
              <Typography variant="body2" fontWeight="600" color="warning.main">
                {formatCurrency(penalties.lateFee)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(dailyRate)} × {lateFeeMultiplier} × {penalties.lateDays} días
            </Typography>
          </Box>
        )}

        {/* Limpieza */}
        {cleaningRequired && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Cargo por limpieza profunda
            </Typography>
            <Typography variant="body2" fontWeight="600">
              {formatCurrency(penalties.cleaningFee)}
            </Typography>
          </Box>
        )}

        {/* Daños */}
        {damageCost > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Costo de reparación de daños
            </Typography>
            <Typography variant="body2" fontWeight="600" color="error.main">
              {formatCurrency(penalties.damageFee)}
            </Typography>
          </Box>
        )}

        {/* Sin penalidades */}
        {penalties.totalPenalties === 0 && (
          <Alert severity="success" sx={{ mt: 1 }}>
            No hay penalidades. El vehículo fue devuelto en perfectas condiciones y a tiempo.
          </Alert>
        )}
      </Box>

      {/* Total */}
      {penalties.totalPenalties > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'error.lighter',
              p: 2,
              borderRadius: 1
            }}
          >
            <Typography variant="h6" fontWeight="700">
              Total de Penalidades
            </Typography>
            <Typography variant="h5" fontWeight="700" color="error.main">
              {formatCurrency(penalties.totalPenalties)}
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mt: 2 }}>
            Estas penalidades se agregarán automáticamente al balance del cliente y se registrarán como ingreso.
          </Alert>
        </>
      )}
    </Paper>
  );
};

export default PenaltyCalculator;
