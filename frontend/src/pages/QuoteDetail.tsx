/**
 * Vista de detalle de Cotización
 * Muestra información completa y acciones (enviar, aceptar, rechazar, convertir)
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Send as SendIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  SwapHoriz as ConvertIcon,
  Schedule as DraftIcon,
  TimerOff as ExpiredIcon,
  Person as PersonIcon,
  DirectionsCar as VehicleIcon,
  CalendarMonth as CalendarIcon,
  RequestQuote as QuoteIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { formatDate } from '../utils/formatters';
import { Quote, QuoteStatus } from '../types/quote';
import quoteService from '../services/quoteService';

const getStatusConfig = (status: QuoteStatus) => {
  const configs: Record<QuoteStatus, { label: string; color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' }> = {
    [QuoteStatus.DRAFT]: { label: 'Borrador', color: 'default' },
    [QuoteStatus.SENT]: { label: 'Enviada', color: 'info' },
    [QuoteStatus.ACCEPTED]: { label: 'Aceptada', color: 'success' },
    [QuoteStatus.REJECTED]: { label: 'Rechazada', color: 'error' },
    [QuoteStatus.EXPIRED]: { label: 'Expirada', color: 'warning' },
    [QuoteStatus.CONVERTED]: { label: 'Convertida a Renta', color: 'primary' }
  };
  return configs[status] || configs[QuoteStatus.DRAFT];
};

const QuoteDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { enqueueSnackbar } = useSnackbar();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadQuote = async () => {
    try {
      const response = await quoteService.getById(Number(id));
      if (response.success) {
        setQuote(response.data);
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar cotización', { variant: 'error' });
      navigate('/quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadQuote();
  }, [id]);

  const handleSend = async () => {
    setActionLoading(true);
    try {
      await quoteService.send(Number(id));
      enqueueSnackbar('Cotización enviada exitosamente', { variant: 'success' });
      loadQuote();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al enviar', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await quoteService.accept(Number(id));
      enqueueSnackbar('Cotización aceptada', { variant: 'success' });
      loadQuote();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al aceptar', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await quoteService.reject(Number(id), rejectReason);
      enqueueSnackbar('Cotización rechazada', { variant: 'info' });
      setRejectDialogOpen(false);
      loadQuote();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al rechazar', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await quoteService.downloadPDF(Number(id));
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cotizacion-${quote?.quote_code || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('PDF descargado exitosamente', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al descargar PDF', { variant: 'error' });
    }
  };

  const handleConvert = async () => {
    setActionLoading(true);
    try {
      const response = await quoteService.convert(Number(id));
      enqueueSnackbar(response.message || 'Convertida a renta exitosamente', { variant: 'success' });
      setConvertDialogOpen(false);
      // Navigate to the new rental
      if (response.data?.rental?.id) {
        navigate(`/rentals/${response.data.rental.id}`);
      } else {
        loadQuote();
      }
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al convertir', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const paperSx = {
    p: 3,
    borderRadius: '16px',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!quote) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Cotización no encontrada</Typography>
        <Button onClick={() => navigate('/quotes')} sx={{ mt: 2 }}>Volver a cotizaciones</Button>
      </Box>
    );
  }

  const statusConfig = getStatusConfig(quote.status);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/quotes')}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Volver
          </Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
                {quote.quote_code}
              </Typography>
              <Chip
                label={statusConfig.label}
                color={statusConfig.color}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Creada el {formatDate(quote.created_at)} {quote.creator && `por ${quote.creator.first_name} ${quote.creator.last_name}`}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quote.status !== 'draft' && (
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={handleDownloadPDF}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                borderColor: '#3b82f6',
                color: '#3b82f6',
                '&:hover': { borderColor: '#2563eb', bgcolor: 'rgba(59,130,246,0.08)' }
              }}
            >
              Descargar PDF
            </Button>
          )}
          {quote.status === 'draft' && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/quotes/${quote.id}/edit`)}
                sx={{ borderRadius: '12px', textTransform: 'none' }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSend}
                disabled={actionLoading}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  '&:hover': { background: 'linear-gradient(90deg, #2563eb, #3b82f6)' }
                }}
              >
                Enviar al Cliente
              </Button>
            </>
          )}
          {quote.status === 'sent' && (
            <>
              <Button
                variant="contained"
                startIcon={<AcceptIcon />}
                onClick={handleAccept}
                disabled={actionLoading}
                color="success"
                sx={{ borderRadius: '12px', textTransform: 'none' }}
              >
                Aceptar
              </Button>
              <Button
                variant="outlined"
                startIcon={<RejectIcon />}
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
                color="error"
                sx={{ borderRadius: '12px', textTransform: 'none' }}
              >
                Rechazar
              </Button>
            </>
          )}
          {quote.status === 'accepted' && (
            <Button
              variant="contained"
              startIcon={<ConvertIcon />}
              onClick={() => setConvertDialogOpen(true)}
              disabled={actionLoading}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(90deg, #0075ff, #21d4fd)',
                '&:hover': { background: 'linear-gradient(90deg, #0060cc, #1ab8e0)' }
              }}
            >
              Convertir a Renta
            </Button>
          )}
          {quote.status === 'converted' && quote.converted_rental_id && (
            <Button
              variant="outlined"
              onClick={() => navigate(`/rentals/${quote.converted_rental_id}`)}
              sx={{ borderRadius: '12px', textTransform: 'none' }}
            >
              Ver Renta #{quote.convertedRental?.rental_code || quote.converted_rental_id}
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left - Details */}
        <Grid item xs={12} md={8}>
          {/* Customer & Vehicle */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 20, color: '#0075ff' }} />
                  <Typography variant="subtitle2" fontWeight={600}>Cliente</Typography>
                </Box>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  onClick={() => navigate(`/customers/${quote.customer?.id}`)}
                  sx={{ cursor: 'pointer', color: '#8b5cf6', '&:hover': { textDecoration: 'underline' } }}
                >
                  {quote.customer?.name || 'N/A'}
                </Typography>
                {quote.customer?.email && (
                  <Typography variant="body2" color="text.secondary">{quote.customer.email}</Typography>
                )}
                {quote.customer?.phone && (
                  <Typography variant="body2" color="text.secondary">{quote.customer.phone}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VehicleIcon sx={{ fontSize: 20, color: '#0075ff' }} />
                  <Typography variant="subtitle2" fontWeight={600}>Vehículo</Typography>
                </Box>
                {quote.vehicle ? (
                  <>
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      onClick={() => navigate(`/inventory/${quote.vehicle?.id}`)}
                      sx={{ cursor: 'pointer', color: '#8b5cf6', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {quote.vehicle.make} {quote.vehicle.model} ({quote.vehicle.year})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Placas: {quote.vehicle.license_plate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tarifa: {formatCurrency(quote.vehicle.daily_rate)}/día
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Sin vehículo asignado
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Dates */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarIcon sx={{ fontSize: 20, color: '#0075ff' }} />
              <Typography variant="subtitle2" fontWeight={600}>Periodo de Renta</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Inicio</Typography>
                <Typography variant="body1" fontWeight={600}>{formatDate(quote.start_date) || 'No definida'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Fin</Typography>
                <Typography variant="body1" fontWeight={600}>{formatDate(quote.end_date) || 'No definida'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">Días</Typography>
                <Typography variant="body1" fontWeight={600}>{quote.days || 'N/A'}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          {(quote.notes || quote.customer_notes) && (
            <Paper sx={paperSx}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Notas</Typography>
              {quote.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {quote.notes}
                </Typography>
              )}
              {quote.customer_notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={0.5} sx={{ color: '#ef4444' }}>
                    Razón de rechazo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quote.customer_notes}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Grid>

        {/* Right - Financial Summary */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...paperSx, position: { md: 'sticky' }, top: { md: 100 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <QuoteIcon sx={{ fontSize: 20, color: '#0075ff' }} />
              <Typography variant="subtitle1" fontWeight={700}>Resumen Financiero</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Tarifa diaria:</Typography>
                <Typography variant="body2">{formatCurrency(quote.daily_rate)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                <Typography variant="body2">{formatCurrency(quote.subtotal)}</Typography>
              </Box>
              {Number(quote.discount_amount) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Descuento ({quote.discount_percentage}%):</Typography>
                  <Typography variant="body2" sx={{ color: '#10b981' }}>-{formatCurrency(quote.discount_amount)}</Typography>
                </Box>
              )}
              {Number(quote.insurance_amount) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Seguro:</Typography>
                  <Typography variant="body2">+{formatCurrency(quote.insurance_amount)}</Typography>
                </Box>
              )}
              {Number(quote.extras_amount) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Extras:</Typography>
                  <Typography variant="body2">+{formatCurrency(quote.extras_amount)}</Typography>
                </Box>
              )}
              {Number(quote.shipping_cost) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Envío:</Typography>
                  <Typography variant="body2">+{formatCurrency(quote.shipping_cost)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">IVA ({quote.tax_percentage}%):</Typography>
                <Typography variant="body2">{formatCurrency(quote.tax_amount)}</Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={700}>Total:</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#0075ff' }}>
                  {formatCurrency(quote.total_amount)}
                </Typography>
              </Box>

              {Number(quote.deposit_amount) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Depósito:</Typography>
                  <Typography variant="body2">{formatCurrency(quote.deposit_amount)}</Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Validity */}
            <Box sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(0,117,255,0.08)' : '#f0f7ff',
              border: `1px solid ${isDarkMode ? 'rgba(0,117,255,0.2)' : '#dbeafe'}`
            }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Válida hasta
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatDate(quote.valid_until)}
              </Typography>
              {new Date(quote.valid_until) < new Date() && quote.status !== 'expired' && quote.status !== 'converted' && (
                <Typography variant="caption" sx={{ color: '#ef4444' }}>
                  Esta cotización ha expirado
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Cotización</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            ¿Estás seguro de rechazar la cotización {quote.quote_code}?
          </DialogContentText>
          <TextField
            label="Razón del rechazo (opcional)"
            multiline
            rows={3}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={actionLoading}>
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onClose={() => setConvertDialogOpen(false)}>
        <DialogTitle>Convertir a Renta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esto creará una renta activa con los datos de esta cotización. El vehículo será marcado como rentado y se ejecutarán los procesos automáticos (contrato, notificaciones, etc.).
          </DialogContentText>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,117,255,0.05)', borderRadius: '12px' }}>
            <Typography variant="body2" fontWeight={600}>Resumen:</Typography>
            <Typography variant="body2" color="text.secondary">
              Cliente: {quote.customer?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vehículo: {quote.vehicle ? `${quote.vehicle.make} ${quote.vehicle.model}` : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {formatCurrency(quote.total_amount)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleConvert}
            variant="contained"
            disabled={actionLoading}
            sx={{
              background: 'linear-gradient(90deg, #0075ff, #21d4fd)',
              '&:hover': { background: 'linear-gradient(90deg, #0060cc, #1ab8e0)' }
            }}
          >
            {actionLoading ? 'Convirtiendo...' : 'Convertir a Renta'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuoteDetail;
