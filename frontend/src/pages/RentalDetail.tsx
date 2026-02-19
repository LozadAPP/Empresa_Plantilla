/**
 * Detalle de Renta (CHAT 2)
 * CONVERTIDO A MATERIAL UI - Soporte completo Dark/Light Mode
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Receipt as InvoiceIcon,
  AssignmentReturn as ReturnIcon,
  Payment as PaymentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { rentalService } from '../services/rentalService';
import RentalRejectDialog from '../components/rentals/RentalRejectDialog';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { AppDispatch, RootState } from '../store';
import { fetchRentalById } from '../store/slices/rentalSlice';
import { formatDate, safeNumber } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';
import { getLocationById } from '../constants/locations';
import { FUEL_LEVEL_LABELS } from '../constants/statusColors';

const RentalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();

  const { selectedRental: rental, loading } = useSelector((state: RootState) => state.rentals);
  const { user } = useSelector((state: RootState) => state.auth);
  const { enqueueSnackbar } = useSnackbar();

  // Estado para aprobación
  const [approving, setApproving] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Roles que pueden aprobar
  const canApprove = user?.roles?.some(role =>
    ['admin', 'director_general', 'jefe_ventas'].includes(role)
  ) ?? false;

  // Handler para aprobar renta
  const handleApprove = async () => {
    if (!rental) return;
    setApproving(true);
    try {
      await rentalService.approveRental(rental.id);
      enqueueSnackbar('Renta aprobada exitosamente', { variant: 'success' });
      // Recargar la renta
      dispatch(fetchRentalById(rental.id));
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al aprobar la renta', { variant: 'error' });
    } finally {
      setApproving(false);
    }
  };

  // Handler para rechazar renta
  const handleReject = async (reason: string) => {
    if (!rental) return;
    setApproving(true);
    try {
      await rentalService.rejectRental(rental.id, reason);
      enqueueSnackbar('Renta rechazada', { variant: 'warning' });
      setShowRejectDialog(false);
      // Recargar la renta
      dispatch(fetchRentalById(rental.id));
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al rechazar la renta', { variant: 'error' });
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
    const numericId = Number(id);
    if (id && !Number.isNaN(numericId) && numericId > 0) {
      dispatch(fetchRentalById(numericId));
    } else if (id) {
      navigate('/rentals');
    }
  }, [dispatch, id, navigate]);

  const getFuelLevelLabel = (level: string) => FUEL_LEVEL_LABELS[level] || level;

  const paperStyles = {
    p: 3,
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: 2,
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  if (loading || !rental) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: isDarkMode ? '#a78bfa' : '#8b5cf6' }} />
      </Box>
    );
  }

  const canRegisterReturn = rental.status === 'active';
  const pickupLocation = getLocationById(rental.location_id);
  const returnLocation = getLocationById(rental.return_location_id || rental.location_id);
  const hasReturn = rental.status === 'completed' || rental.return !== undefined;

  const paidAmount = (rental.payments || []).reduce((sum, payment) => sum + safeNumber(payment.amount), 0);
  const balance = safeNumber(rental.total_amount) - paidAmount;

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    pending_approval: { bg: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', color: isDarkMode ? '#fbbf24' : '#d97706' },
    active: { bg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5', color: isDarkMode ? '#34d399' : '#059669' },
    completed: { bg: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#e5e7eb', color: isDarkMode ? '#9ca3af' : '#4b5563' },
    cancelled: { bg: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', color: isDarkMode ? '#f87171' : '#dc2626' },
    overdue: { bg: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', color: isDarkMode ? '#fbbf24' : '#d97706' }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
            {rental.rental_code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detalle de la renta
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/rentals')}
            sx={{
              borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
            }}
          >
            Volver
          </Button>
          {!rental.invoice && (
            <Button
              variant="contained"
              startIcon={<InvoiceIcon />}
              onClick={() => navigate(`/invoices/new?rental=${rental.id}`)}
              sx={{ bgcolor: isDarkMode ? '#a78bfa' : '#8b5cf6', '&:hover': { bgcolor: isDarkMode ? '#8b5cf6' : '#7c3aed' } }}
            >
              Generar Factura
            </Button>
          )}
          {canRegisterReturn && (
            <Button
              variant="contained"
              startIcon={<ReturnIcon />}
              onClick={() => navigate(`/returns/new?rental=${rental.id}`)}
              sx={{ bgcolor: isDarkMode ? '#34d399' : '#10b981', '&:hover': { bgcolor: isDarkMode ? '#10b981' : '#059669' } }}
            >
              Registrar Devolución
            </Button>
          )}
        </Box>
      </Box>

      {/* Banner de Aprobación Pendiente */}
      {rental.status === 'pending_approval' && (
        <Paper
          sx={{
            mb: 3,
            p: 2,
            bgcolor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
            border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fbbf24'}`,
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PendingIcon sx={{ color: isDarkMode ? '#fbbf24' : '#d97706', fontSize: 28 }} />
              <Box>
                <Typography variant="h6" sx={{ color: isDarkMode ? '#fbbf24' : '#d97706', fontWeight: 600 }}>
                  Pendiente de Aprobación
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta renta requiere aprobación de un supervisor antes de activarse.
                </Typography>
              </Box>
            </Box>
            {canApprove && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={handleApprove}
                  disabled={approving}
                >
                  {approving ? 'Procesando...' : 'Aprobar'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => setShowRejectDialog(true)}
                  disabled={approving}
                >
                  Rechazar
                </Button>
              </Box>
            )}
            {!canApprove && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Solo jefes de ventas, directores o administradores pueden aprobar.
              </Typography>
            )}
          </Box>
        </Paper>
      )}

      {/* Alerta de Rechazo (si fue rechazada) */}
      {rental.rejection_reason && rental.status === 'cancelled' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Renta Rechazada</AlertTitle>
          <Typography variant="body2">
            <strong>Razón:</strong> {rental.rejection_reason}
          </Typography>
          {rental.approved_at && (
            <Typography variant="caption" color="text.secondary">
              Rechazada el {formatDate(rental.approved_at)}
            </Typography>
          )}
        </Alert>
      )}

      {/* Info Cards */}
      <Grid container spacing={3}>
        {/* Cliente */}
        <Grid item xs={12} md={4}>
          <Paper sx={paperStyles}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Cliente</Typography>
            {rental.customer && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Nombre</Typography>
                  <Typography variant="body1" fontWeight={500}>{rental.customer.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1" fontWeight={500}>{rental.customer.email || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                  <Typography variant="body1" fontWeight={500}>{rental.customer.phone || 'N/A'}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Vehículo */}
        <Grid item xs={12} md={4}>
          <Paper sx={paperStyles}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Vehículo</Typography>
            {rental.vehicle && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Vehículo</Typography>
                  <Typography variant="body1" fontWeight={500}>{rental.vehicle.make} {rental.vehicle.model}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Placa</Typography>
                  <Typography variant="body1" fontWeight={500}>{rental.vehicle.license_plate}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Año</Typography>
                  <Typography variant="body1" fontWeight={500}>{rental.vehicle.year}</Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Estado */}
        <Grid item xs={12} md={4}>
          <Paper sx={paperStyles}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Estado</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Estado actual</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={rental.status}
                    size="small"
                    sx={{
                      bgcolor: STATUS_COLORS[rental.status]?.bg || STATUS_COLORS.active.bg,
                      color: STATUS_COLORS[rental.status]?.color || STATUS_COLORS.active.color,
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Creado</Typography>
                <Typography variant="body1" fontWeight={500}>{rental.created_at && formatDate(rental.created_at)}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Ubicaciones */}
      <Paper sx={{ ...paperStyles, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>📍 Ubicaciones</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">Recogida en:</Typography>
            <Typography variant="body1" fontWeight={600}>{pickupLocation?.name || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary">{pickupLocation?.address}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">Devolución en:</Typography>
            <Typography variant="body1" fontWeight={600}>{returnLocation?.name || 'Misma sucursal'}</Typography>
            {returnLocation && rental.return_location_id !== rental.location_id && (
              <>
                <Typography variant="body2" color="text.secondary">{returnLocation.address}</Typography>
                <Chip label="One-way rental" size="small" sx={{ mt: 1, bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', color: '#3b82f6' }} />
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Detalles de la Renta */}
      <Paper sx={{ ...paperStyles, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Detalles de la Renta</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Fecha de Inicio</Typography>
            <Typography variant="body1" fontWeight={500}>{formatDate(rental.start_date)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Fecha de Fin</Typography>
            <Typography variant="body1" fontWeight={500}>{formatDate(rental.end_date)}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Días</Typography>
            <Typography variant="body1" fontWeight={500}>{rental.days} días</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Condiciones Iniciales */}
      <Paper sx={{ ...paperStyles, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>🚗 Condiciones Iniciales</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Kilometraje Inicial</Typography>
            <Typography variant="h5" fontWeight={700}>
              {rental.start_mileage !== null && rental.start_mileage !== undefined ? `${rental.start_mileage} km` : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Combustible Inicial</Typography>
            <Typography variant="h5" fontWeight={700}>{getFuelLevelLabel(rental.fuel_level_start || 'full')}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" color="text.secondary">Depósito de Garantía</Typography>
            <Typography variant="h5" fontWeight={700}>{rental.deposit_amount ? formatCurrency(rental.deposit_amount) : 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Montos */}
      <Paper sx={{ ...paperStyles, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Montos</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Tarifa diaria</Typography>
            <Typography fontWeight={500}>{formatCurrency(rental.daily_rate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Subtotal ({rental.days} días)</Typography>
            <Typography fontWeight={500}>{formatCurrency(rental.subtotal)}</Typography>
          </Box>
          {rental.insurance_amount && rental.insurance_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Seguro</Typography>
              <Typography fontWeight={500}>{formatCurrency(rental.insurance_amount)}</Typography>
            </Box>
          )}
          {rental.discount_amount && rental.discount_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
              <Typography>Descuento ({rental.discount_percentage}%)</Typography>
              <Typography fontWeight={500}>-{formatCurrency(rental.discount_amount)}</Typography>
            </Box>
          )}
          {rental.extras_amount && rental.extras_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Servicios adicionales</Typography>
              <Typography fontWeight={500}>{formatCurrency(rental.extras_amount)}</Typography>
            </Box>
          )}
          {rental.shipping_cost && Number(rental.shipping_cost) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Costo de envío</Typography>
              <Typography fontWeight={500}>{formatCurrency(rental.shipping_cost)}</Typography>
            </Box>
          )}
          {rental.price_adjustment && Number(rental.price_adjustment) !== 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: Number(rental.price_adjustment) > 0 ? '#ef4444' : '#10b981' }}>
              <Typography>Ajuste de precio</Typography>
              <Typography fontWeight={500}>
                {Number(rental.price_adjustment) > 0 ? '+' : ''}{formatCurrency(rental.price_adjustment)}
              </Typography>
            </Box>
          )}
          {rental.adjustment_reason && (
            <Box sx={{ mt: 1, p: 1.5, bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Razón del ajuste:</Typography>
              <Typography variant="body2">{rental.adjustment_reason}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">IVA ({rental.tax_percentage}%)</Typography>
            <Typography fontWeight={500}>{formatCurrency(rental.tax_amount)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={600}>Total</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: isDarkMode ? '#60a5fa' : '#3b82f6' }}>{formatCurrency(rental.total_amount)}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Estado de Pagos */}
      <Paper sx={{ ...paperStyles, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>💳 Estado de Pagos</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Total de renta:</Typography>
            <Typography fontWeight={500}>{formatCurrency(rental.total_amount)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Pagado:</Typography>
            <Typography fontWeight={500} sx={{ color: '#10b981' }}>{formatCurrency(paidAmount)}</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight={600}>Saldo Pendiente:</Typography>
            <Typography fontWeight={700} sx={{ color: balance > 0 ? '#ef4444' : '#10b981' }}>
              {formatCurrency(balance)}
            </Typography>
          </Box>
          {rental.deposit_amount && rental.deposit_amount > 0 && (
            <Paper sx={{ p: 2, mt: 1, bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Depósito:</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: paidAmount >= rental.deposit_amount ? '#10b981' : '#f59e0b' }}>
                  {paidAmount >= rental.deposit_amount ? '✅ Pagado' : '⚠️ Pendiente'} - {formatCurrency(rental.deposit_amount)}
                </Typography>
              </Box>
            </Paper>
          )}
          {balance > 0 && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => navigate(`/payments/new?rental=${rental.id}`)}
              sx={{ mt: 2, bgcolor: isDarkMode ? '#60a5fa' : '#3b82f6', '&:hover': { bgcolor: isDarkMode ? '#3b82f6' : '#2563eb' } }}
            >
              Registrar Pago
            </Button>
          )}
        </Box>
      </Paper>

      {/* Historial de Pagos */}
      {rental.payments && rental.payments.length > 0 && (
        <Paper sx={{ ...paperStyles, mt: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>💳 Historial de Pagos</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Método</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rental.payments.map((payment: any) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.payment_code}</TableCell>
                    <TableCell>{payment.transaction_date && formatDate(payment.transaction_date)}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {payment.payment_method === 'cash' && '💵 Efectivo'}
                      {payment.payment_method === 'card' && '💳 Tarjeta'}
                      {payment.payment_method === 'bank_transfer' && '🏦 Transferencia'}
                      {payment.payment_method === 'check' && '📝 Cheque'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          payment.payment_type === 'full' ? 'Completo' :
                          payment.payment_type === 'partial' ? 'Parcial' :
                          payment.payment_type === 'deposit' ? 'Depósito' :
                          payment.payment_type === 'balance' ? 'Saldo' : payment.payment_type
                        }
                        size="small"
                        sx={{
                          bgcolor: payment.payment_type === 'full' ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5') :
                                   payment.payment_type === 'deposit' ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe') :
                                   (isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#e5e7eb'),
                          color: payment.payment_type === 'full' ? '#10b981' :
                                 payment.payment_type === 'deposit' ? '#3b82f6' : '#6b7280'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} sx={{ color: '#10b981' }}>{formatCurrency(payment.amount)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell colSpan={4} align="right"><strong>Total Pagado:</strong></TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} sx={{ color: '#10b981' }}>
                      {formatCurrency(rental.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Información de Devolución */}
      {hasReturn && rental.return && (
        <Paper sx={{ ...paperStyles, mt: 3, border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.3)'}` }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>✅ Información de Devolución</Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Fecha de Devolución</Typography>
              <Typography variant="h6" fontWeight={600}>{rental.return.return_date && formatDate(rental.return.return_date)}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: rental.return.is_on_time ? '#10b981' : '#ef4444' }}>
                {rental.return.is_on_time ? '✅ A tiempo' : `⚠️ ${rental.return.days_late} día(s) tarde`}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Kilometraje Final</Typography>
              <Typography variant="h6" fontWeight={600} sx={{ color: '#3b82f6' }}>
                {rental.return.end_mileage ? `${rental.return.end_mileage} km` : 'N/A'}
              </Typography>
              {rental.start_mileage && rental.return.end_mileage && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Recorridos: {rental.return.end_mileage - rental.start_mileage} km
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="caption" color="text.secondary">Condición del Vehículo</Typography>
              <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{rental.return.vehicle_condition || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Combustible: {getFuelLevelLabel(rental.return.fuel_level || 'full')}
              </Typography>
            </Grid>
          </Grid>

          {/* Penalizaciones */}
          {(rental.return.total_penalty && rental.return.total_penalty > 0) && (
            <Paper sx={{ mt: 3, p: 2, bgcolor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)', border: `1px solid ${isDarkMode ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.2)'}` }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: isDarkMode ? '#fcd34d' : '#92400e' }}>
                💰 Penalizaciones Aplicadas
              </Typography>
              <Grid container spacing={2}>
                {rental.return.late_fee && rental.return.late_fee > 0 && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Retraso:</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#ef4444' }}>{formatCurrency(rental.return.late_fee)}</Typography>
                  </Grid>
                )}
                {rental.return.cleaning_cost && rental.return.cleaning_cost > 0 && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Limpieza:</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#f59e0b' }}>{formatCurrency(rental.return.cleaning_cost)}</Typography>
                  </Grid>
                )}
                {rental.return.damage_cost && rental.return.damage_cost > 0 && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">Daños:</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: '#ef4444' }}>{formatCurrency(rental.return.damage_cost)}</Typography>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.2)' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={600}>Total Penalizaciones:</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#ef4444' }}>{formatCurrency(rental.return.total_penalty)}</Typography>
              </Box>
            </Paper>
          )}

          {/* Daños */}
          {rental.return.damage_description && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}` }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: isDarkMode ? '#f87171' : '#dc2626' }}>🔧 Daños Reportados</Typography>
              <Typography variant="body2">{rental.return.damage_description}</Typography>
            </Paper>
          )}

          {/* Notas de Inspección */}
          {rental.return.inspection_notes && (
            <Paper sx={{ mt: 2, p: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>📝 Notas de Inspección</Typography>
              <Typography variant="body2">{rental.return.inspection_notes}</Typography>
            </Paper>
          )}
        </Paper>
      )}

      {/* Notas de la Renta */}
      {rental.notes && (
        <Paper sx={{ ...paperStyles, mt: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Notas</Typography>
          <Typography variant="body1">{rental.notes}</Typography>
        </Paper>
      )}

      {/* Diálogo de Rechazo */}
      <RentalRejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        rentalCode={rental.rental_code}
        loading={approving}
      />
    </Box>
  );
};

export default RentalDetail;
