/**
 * Componente ReturnConfirmModal - Modal de confirmacion de devolucion
 * Muestra resumen completo antes de procesar la devolucion
 * Convertido a Material-UI para consistencia con el resto del proyecto
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  LocalGasStation as FuelIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useCurrency } from '../../contexts/CurrencyContext';
import { CreateReturnDTO } from '../../types/return';
import { PenaltyCalculation } from '../../hooks/useReturnForm';
import { FUEL_LEVEL_LABELS } from '../../constants/statusColors';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  loading: boolean;
  rental: any;
  formData: CreateReturnDTO;
  penaltyCalculation: PenaltyCalculation;
  isDarkMode: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ReturnConfirmModal: React.FC<ReturnConfirmModalProps> = ({
  isOpen,
  loading,
  rental,
  formData,
  penaltyCalculation,
  isDarkMode,
  onConfirm,
  onClose
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { formatCurrency } = useCurrency();

  if (!isOpen) return null;

  const getFuelLevelLabel = (level: string) => FUEL_LEVEL_LABELS[level] || level;

  // Info row component for consistent styling
  const InfoRow = ({ label, value, color }: { label: string; value: string | React.ReactNode; color?: string }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          color: color || 'text.primary',
          fontSize: { xs: '0.8rem', sm: '0.875rem' }
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={isOpen}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '16px',
          bgcolor: isDarkMode ? '#1c1c2e' : '#ffffff',
          m: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100%' : '90vh',
        }
      }}
    >
      {/* Header con gradiente */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0075ff 0%, #8b5cf6 100%)',
          color: '#fff',
          textAlign: 'center',
          py: { xs: 2, sm: 3 },
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Confirmar Devolución
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          Revisa cuidadosamente los datos antes de proceder
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
        {/* Información de Renta */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '12px',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CarIcon sx={{ color: '#0075ff', fontSize: { xs: 18, sm: 20 } }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Información de Renta
            </Typography>
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <InfoRow label="Código:" value={rental.rental_code} />
            </Grid>
            <Grid item xs={6}>
              <InfoRow label="Placa:" value={rental.vehicle?.plate} />
            </Grid>
            <Grid item xs={6}>
              <InfoRow label="Vehículo:" value={`${rental.vehicle?.brand} ${rental.vehicle?.model}`} />
            </Grid>
            <Grid item xs={6}>
              <InfoRow label="Cliente:" value={`${rental.customer?.first_name} ${rental.customer?.last_name}`} />
            </Grid>
          </Grid>
        </Paper>

        {/* Condiciones del Vehículo */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '12px',
            bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.1)' : '#eff6ff',
            border: `1px solid ${isDarkMode ? 'rgba(0, 117, 255, 0.3)' : '#bfdbfe'}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <SpeedIcon sx={{ color: '#0075ff', fontSize: { xs: 18, sm: 20 } }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Condiciones del Vehículo
            </Typography>
          </Box>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Kilometraje:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {rental.start_mileage} → {formData.end_mileage} km
                </Typography>
                <Chip
                  label={`+${formData.end_mileage - (rental.start_mileage || 0)} km`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.2)' : '#dbeafe',
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6} sm={6}>
              <InfoRow
                label="Combustible:"
                value={`${getFuelLevelLabel(rental.fuel_level_start || 'full')} → ${getFuelLevelLabel(formData.fuel_level)}`}
              />
            </Grid>
            <Grid item xs={6}>
              <InfoRow label="Condición:" value={formData.vehicle_condition} />
            </Grid>
            <Grid item xs={6}>
              <InfoRow
                label="Limpieza:"
                value={formData.cleaning_required ? 'Requerida' : 'OK'}
                color={formData.cleaning_required ? '#f59e0b' : '#10b981'}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Daños (si hay) */}
        {formData.damage_cost && formData.damage_cost > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
              border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <WarningIcon sx={{ color: '#ef4444', fontSize: { xs: 18, sm: 20 } }} />
              <Typography variant="subtitle1" fontWeight={600} color="error" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Daños Reportados
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#7f1d1d' }}>
              {formData.damage_description}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="error">
              Costo de reparación: {formatCurrency(formData.damage_cost)}
            </Typography>
            {formData.photos && formData.photos.length > 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {formData.photos.length} foto(s) adjunta(s)
              </Typography>
            )}
          </Paper>
        )}

        {/* Estado de Tiempo */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '12px',
            bgcolor: penaltyCalculation.isOnTime
              ? (isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5')
              : (isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb'),
            border: `1px solid ${penaltyCalculation.isOnTime
              ? (isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0')
              : (isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fde68a')}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {penaltyCalculation.isOnTime ? (
              <CheckIcon sx={{ color: '#10b981', fontSize: { xs: 18, sm: 20 } }} />
            ) : (
              <WarningIcon sx={{ color: '#f59e0b', fontSize: { xs: 18, sm: 20 } }} />
            )}
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                color: penaltyCalculation.isOnTime ? '#10b981' : '#f59e0b',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {penaltyCalculation.isOnTime ? 'Devolución a Tiempo' : 'Devolución Tardía'}
            </Typography>
          </Box>
          {!penaltyCalculation.isOnTime && (
            <Typography variant="body2" sx={{ mt: 1, color: isDarkMode ? '#fcd34d' : '#92400e' }}>
              <strong>{penaltyCalculation.daysLate}</strong> día(s) de retraso -
              Penalización: <strong>{formatCurrency(penaltyCalculation.lateFee)}</strong>
            </Typography>
          )}
        </Paper>

        {/* Resumen Financiero */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: formData.inspection_notes ? 2 : 0,
            borderRadius: '12px',
            bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%)',
            border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : '#e9d5ff'}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Resumen Financiero
          </Typography>

          {penaltyCalculation.lateFee > 0 && (
            <InfoRow label="Penalidad por retraso:" value={`+${formatCurrency(penaltyCalculation.lateFee)}`} color="#ef4444" />
          )}
          {penaltyCalculation.cleaningCost > 0 && (
            <InfoRow label="Limpieza profunda:" value={`+${formatCurrency(penaltyCalculation.cleaningCost)}`} color="#f59e0b" />
          )}
          {penaltyCalculation.damageCost > 0 && (
            <InfoRow label="Reparación de daños:" value={`+${formatCurrency(penaltyCalculation.damageCost)}`} color="#ef4444" />
          )}

          <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body1" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Total Penalidades:
            </Typography>
            <Typography variant="body1" fontWeight={700} color="error" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {formatCurrency(penaltyCalculation.totalPenalty)}
            </Typography>
          </Box>

          {penaltyCalculation.depositAmount > 0 && (
            <>
              <InfoRow label="Depósito original:" value={formatCurrency(penaltyCalculation.depositAmount)} />
              <Divider sx={{ my: 1, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" fontWeight={700} sx={{ color: '#10b981', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  Reembolso al cliente:
                </Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: '#10b981', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  {formatCurrency(penaltyCalculation.depositRefund)}
                </Typography>
              </Box>
            </>
          )}

          {penaltyCalculation.totalPenalty > penaltyCalculation.depositAmount && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
              }}
            >
              <Typography variant="body2" color="error" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                El cliente debe pagar {formatCurrency(penaltyCalculation.totalPenalty - penaltyCalculation.depositAmount)} adicional
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Notas de Inspección */}
        {formData.inspection_notes && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Notas de Inspección
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              {formData.inspection_notes}
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
          gap: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'}`,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          variant="outlined"
          fullWidth={isMobile}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            minHeight: { xs: 48, sm: 44 },
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db',
            color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151',
            '&:hover': {
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6',
            }
          }}
        >
          Revisar Datos
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          fullWidth={isMobile}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            minHeight: { xs: 48, sm: 44 },
            bgcolor: '#10b981',
            '&:hover': {
              bgcolor: '#059669',
            },
            '&:disabled': {
              bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
            }
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              Procesando...
            </Box>
          ) : (
            'Confirmar Devolución'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnConfirmModal;
