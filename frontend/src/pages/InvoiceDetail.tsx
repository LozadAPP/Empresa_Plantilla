/**
 * Detalle de Factura (CHAT 2) - Convertido a Material UI con Dark Mode
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Notes as NotesIcon,
  CheckCircle as PaidIcon,
  Warning as OverdueIcon,
  Schedule as SentIcon,
  Description as DraftIcon,
  Cancel as CancelledIcon,
  Send as SendIcon,
  Verified as StampIcon,
  Code as XmlIcon,
  Block as CancelCfdiIcon,
  QrCode2 as QrIcon,
  ListAlt as LineItemsIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { useSnackbar } from 'notistack';
import { invoiceService } from '../services/invoiceService';
import cfdiService from '../services/cfdiService';
import { AppDispatch, RootState } from '../store';
import { fetchInvoiceById } from '../store/slices/paymentSlice';
import { InvoiceStatus, CfdiStatus } from '../types/invoice';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { formatDate } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();

  const { enqueueSnackbar } = useSnackbar();
  const { selectedInvoice: invoice, loading } = useSelector((state: RootState) => state.payments);
  const [resending, setResending] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('02');

  const handleStampCfdi = async () => {
    if (!invoice) return;
    setStamping(true);
    try {
      const result = await cfdiService.stampInvoice(invoice.id);
      enqueueSnackbar(result.message || 'CFDI timbrado exitosamente', { variant: 'success' });
      dispatch(fetchInvoiceById(invoice.id));
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al timbrar CFDI', { variant: 'error' });
    } finally {
      setStamping(false);
    }
  };

  const handleCancelCfdi = async () => {
    if (!invoice) return;
    setCancelling(true);
    try {
      const result = await cfdiService.cancelCfdi(invoice.id, cancelReason);
      enqueueSnackbar(result.message || 'CFDI cancelado', { variant: 'success' });
      setShowCancelDialog(false);
      dispatch(fetchInvoiceById(invoice.id));
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cancelar CFDI', { variant: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadXML = async () => {
    if (!invoice) return;
    try {
      await cfdiService.downloadXML(invoice.id);
      enqueueSnackbar('XML descargado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al descargar XML', { variant: 'error' });
    }
  };

  const CFDI_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pending_stamp: { label: 'Pendiente de Timbrado', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    stamped: { label: 'Timbrada', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
    cancelled: { label: 'CFDI Cancelado', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    error: { label: 'Error', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
  };

  const handleResendEmail = async () => {
    if (!invoice) return;
    setResending(true);
    try {
      await invoiceService.resend(invoice.id);
      enqueueSnackbar('Factura reenviada por email exitosamente', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al reenviar factura', { variant: 'error' });
    } finally {
      setResending(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const response = await invoiceService.downloadPDF(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoice.invoice_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('PDF descargado exitosamente', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al descargar PDF', { variant: 'error' });
    }
  };

  useEffect(() => {
    const numericId = Number(id);
    if (id && !Number.isNaN(numericId) && numericId > 0) {
      dispatch(fetchInvoiceById(numericId));
    } else if (id) {
      navigate('/invoices');
    }
  }, [dispatch, id, navigate]);

  // Status configuration
  const STATUS_CONFIGS = useMemo(() => ({
    draft: { label: 'Borrador', color: 'default' as const, Icon: DraftIcon },
    sent: { label: 'Enviada', color: 'info' as const, Icon: SentIcon },
    paid: { label: 'Pagada', color: 'success' as const, Icon: PaidIcon },
    overdue: { label: 'Vencida', color: 'error' as const, Icon: OverdueIcon },
    cancelled: { label: 'Cancelada', color: 'warning' as const, Icon: CancelledIcon }
  }), []);

  const getStatusChip = (status: InvoiceStatus) => {
    const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.draft;
    const IconComponent = config.Icon;
    return (
      <Chip
        label={config.label}
        color={config.color}
        icon={<IconComponent sx={{ fontSize: 18 }} />}
        sx={{ fontWeight: 600 }}
      />
    );
  };

  // Payment method labels
  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Efectivo',
    credit_card: 'Tarjeta de Crédito',
    debit_card: 'Tarjeta de Débito',
    transfer: 'Transferencia',
    check: 'Cheque'
  };

  if (loading || !invoice) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#8b5cf6' }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Cargando factura...
        </Typography>
      </Box>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.balance > 0;
  const isPaid = invoice.balance === 0;
  const daysOverdue = isOverdue
    ? Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            {invoice.invoice_code}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detalle de la factura
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/invoices')}
            sx={{
              borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
            }}
          >
            Volver
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={handleResendEmail}
            disabled={resending}
            sx={{
              borderColor: '#10b981',
              color: '#10b981',
              '&:hover': { borderColor: '#059669', bgcolor: 'rgba(16,185,129,0.08)' }
            }}
          >
            {resending ? 'Enviando...' : 'Reenviar Email'}
          </Button>
          <Button
            variant="contained"
            startIcon={<PdfIcon />}
            onClick={handleDownloadPDF}
            sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
          >
            Descargar PDF
          </Button>
          {invoice.balance > 0 && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={() => navigate(`/payments/new?invoice=${invoice.id}`)}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              Registrar Pago
            </Button>
          )}
          {/* CFDI Actions */}
          {invoice.cfdi_status !== 'stamped' && invoice.cfdi_status !== 'cancelled' && (
            <Button
              variant="contained"
              startIcon={stamping ? <CircularProgress size={18} color="inherit" /> : <StampIcon />}
              onClick={handleStampCfdi}
              disabled={stamping}
              sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
            >
              {stamping ? 'Timbrando...' : 'Timbrar CFDI'}
            </Button>
          )}
          {invoice.cfdi_status === 'stamped' && (
            <>
              <Button
                variant="outlined"
                startIcon={<XmlIcon />}
                onClick={handleDownloadXML}
                sx={{ borderColor: '#6366f1', color: '#6366f1', '&:hover': { borderColor: '#4f46e5', bgcolor: 'rgba(99,102,241,0.08)' } }}
              >
                XML
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelCfdiIcon />}
                onClick={() => setShowCancelDialog(true)}
                sx={{ borderColor: '#ef4444', color: '#ef4444', '&:hover': { borderColor: '#dc2626', bgcolor: 'rgba(239,68,68,0.08)' } }}
              >
                Cancelar CFDI
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Cancel CFDI Dialog */}
      {showCancelDialog && (
        <Paper sx={{
          p: 3, mb: 3,
          background: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 2,
        }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#ef4444' }}>
            Cancelar CFDI
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Motivo de Cancelación</InputLabel>
            <Select value={cancelReason} label="Motivo de Cancelación" onChange={(e) => setCancelReason(e.target.value)}>
              <MenuItem value="01">01 - Comprobante con errores (con relación)</MenuItem>
              <MenuItem value="02">02 - Comprobante con errores (sin relación)</MenuItem>
              <MenuItem value="03">03 - No se llevó a cabo la operación</MenuItem>
              <MenuItem value="04">04 - Operación nominativa en factura global</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowCancelDialog(false)} sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
              No, volver
            </Button>
            <Button
              variant="contained"
              onClick={handleCancelCfdi}
              disabled={cancelling}
              sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
            >
              {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Status and Dates Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Status */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Estado
            </Typography>
            {getStatusChip(invoice.status)}
            {isOverdue && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                Factura vencida
              </Typography>
            )}
            {isPaid && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                Pagada completamente
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Issue Date */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Fecha de Emisión
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatDate(invoice.issue_date)}
            </Typography>
          </Paper>
        </Grid>

        {/* Due Date */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Fecha de Vencimiento
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: isOverdue ? '#ef4444' : 'inherit' }}
            >
              {formatDate(invoice.due_date)}
            </Typography>
            {isOverdue && (
              <Typography variant="caption" color="error">
                Vencida hace {daysOverdue} días
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Customer Information */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          borderRadius: 2,
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PersonIcon sx={{ color: '#8b5cf6' }} />
          <Typography variant="h6" fontWeight="600">
            Cliente
          </Typography>
        </Box>
        {invoice.customer && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Nombre</Typography>
              <Typography
                fontWeight="500"
                onClick={() => navigate(`/customers/${invoice.customer?.id}`)}
                sx={{ cursor: 'pointer', color: '#8b5cf6', '&:hover': { textDecoration: 'underline' } }}
              >
                {invoice.customer.name}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography fontWeight="500">{invoice.customer.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Teléfono</Typography>
              <Typography fontWeight="500">{invoice.customer.phone}</Typography>
            </Grid>
            {invoice.customer.address && (
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Dirección</Typography>
                <Typography fontWeight="500">{invoice.customer.address}</Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>

      {/* Associated Rental */}
      {invoice.rental && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CarIcon sx={{ color: '#3b82f6' }} />
            <Typography variant="h6" fontWeight="600">
              Renta Asociada
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Código de Renta</Typography>
              <Typography fontWeight="500">{invoice.rental.rental_code}</Typography>
            </Grid>
            {invoice.rental.vehicle && (
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary">Vehículo</Typography>
                <Typography fontWeight="500">
                  {invoice.rental.vehicle.make} {invoice.rental.vehicle.model}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <Button
                size="small"
                onClick={() => navigate(`/rentals/${invoice.rental_id}`)}
                sx={{ color: '#3b82f6' }}
              >
                Ver Detalle de Renta →
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* CFDI Status Card */}
      {invoice.cfdi_status && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: isDarkMode ? CFDI_STATUS_CONFIG[invoice.cfdi_status]?.bgColor || 'rgba(255,255,255,0.05)' : CFDI_STATUS_CONFIG[invoice.cfdi_status]?.bgColor || '#fff',
            borderRadius: 2,
            border: `1px solid ${CFDI_STATUS_CONFIG[invoice.cfdi_status]?.color || '#8b5cf6'}40`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <QrIcon sx={{ color: CFDI_STATUS_CONFIG[invoice.cfdi_status]?.color || '#8b5cf6' }} />
            <Typography variant="h6" fontWeight="600">
              CFDI 4.0
            </Typography>
            <Chip
              label={CFDI_STATUS_CONFIG[invoice.cfdi_status]?.label || invoice.cfdi_status}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: CFDI_STATUS_CONFIG[invoice.cfdi_status]?.bgColor,
                color: CFDI_STATUS_CONFIG[invoice.cfdi_status]?.color,
                border: `1px solid ${CFDI_STATUS_CONFIG[invoice.cfdi_status]?.color}40`,
              }}
            />
          </Box>
          <Grid container spacing={2}>
            {invoice.uuid && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">UUID</Typography>
                <Typography fontWeight="500" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {invoice.uuid}
                </Typography>
              </Grid>
            )}
            {invoice.serie && (
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Serie / Folio</Typography>
                <Typography fontWeight="500">{invoice.serie} {invoice.folio}</Typography>
              </Grid>
            )}
            {invoice.stamp_date && (
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Fecha Timbrado</Typography>
                <Typography fontWeight="500">{formatDate(invoice.stamp_date)}</Typography>
              </Grid>
            )}
            {invoice.uso_cfdi && (
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Uso CFDI</Typography>
                <Typography fontWeight="500">{invoice.uso_cfdi}</Typography>
              </Grid>
            )}
            {invoice.payment_method_code && (
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Método Pago</Typography>
                <Typography fontWeight="500">{invoice.payment_method_code}</Typography>
              </Grid>
            )}
            {invoice.currency_code && (
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Moneda</Typography>
                <Typography fontWeight="500">{invoice.currency_code}</Typography>
              </Grid>
            )}
            {invoice.cancel_date && (
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Cancelado</Typography>
                <Typography fontWeight="500" color="error">{formatDate(invoice.cancel_date)}</Typography>
              </Grid>
            )}
          </Grid>

          {/* QR Code */}
          {invoice.qr_data && invoice.cfdi_status === 'stamped' && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <QRCodeSVG value={invoice.qr_data} size={100} />
              <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 300 }}>
                Escanea para verificar en el portal del SAT. Modo simulado — sin validación real.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Line Items */}
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LineItemsIcon sx={{ color: '#6366f1' }} />
            <Typography variant="h6" fontWeight="600">
              Conceptos ({invoice.lineItems.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Clave SAT</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                  <TableCell align="right"><strong>Cant.</strong></TableCell>
                  <TableCell><strong>Unidad</strong></TableCell>
                  <TableCell align="right"><strong>P. Unitario</strong></TableCell>
                  <TableCell align="right"><strong>Desc.</strong></TableCell>
                  <TableCell align="right"><strong>Importe</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.lineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{item.satProductCode}</Typography>
                    </TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{Number(item.quantity).toFixed(2)}</TableCell>
                    <TableCell>{item.unitCode}</TableCell>
                    <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell align="right">{formatCurrency(item.discount)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="500">{formatCurrency(item.subtotal)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Financial Details */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          borderRadius: 2,
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <MoneyIcon sx={{ color: '#10b981' }} />
          <Typography variant="h6" fontWeight="600">
            Detalles Financieros
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography fontWeight="500">{formatCurrency(invoice.subtotal)}</Typography>
          </Box>

          {invoice.tax_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">
                IVA ({((invoice.tax_amount / invoice.subtotal) * 100).toFixed(0)}%)
              </Typography>
              <Typography fontWeight="500">{formatCurrency(invoice.tax_amount)}</Typography>
            </Box>
          )}

          {invoice.discount_amount && invoice.discount_amount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ color: '#10b981' }}>Descuento</Typography>
              <Typography sx={{ color: '#10b981' }}>-{formatCurrency(invoice.discount_amount)}</Typography>
            </Box>
          )}

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">Total</Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#3b82f6' }}>
              {formatCurrency(invoice.total_amount)}
            </Typography>
          </Box>

          {invoice.paid_amount && invoice.paid_amount > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Pagado</Typography>
                <Typography fontWeight="500" sx={{ color: '#10b981' }}>
                  {formatCurrency(invoice.paid_amount)}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight="bold">Saldo Pendiente</Typography>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ color: invoice.balance > 0 ? '#ef4444' : '#10b981' }}
                >
                  {formatCurrency(invoice.balance)}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptIcon sx={{ color: '#f59e0b' }} />
            <Typography variant="h6" fontWeight="600">
              Historial de Pagos
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Código</strong></TableCell>
                  <TableCell><strong>Fecha</strong></TableCell>
                  <TableCell><strong>Método</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.payments.map((payment: any) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {payment.payment_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.transaction_date || payment.payment_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, pt: 2, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <Typography fontWeight="600">
              Total Pagado:{' '}
              <Typography component="span" sx={{ color: '#10b981' }} fontWeight="bold">
                {formatCurrency(invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
              </Typography>
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Paper
          sx={{
            p: 3,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <NotesIcon sx={{ color: '#6b7280' }} />
            <Typography variant="h6" fontWeight="600">
              Notas
            </Typography>
          </Box>
          <Typography color="text.secondary">
            {invoice.notes}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InvoiceDetail;
