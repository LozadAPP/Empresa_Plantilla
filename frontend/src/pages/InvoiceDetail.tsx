/**
 * Detalle de Factura (CHAT 2) - Convertido a Material UI con Dark Mode
 */
import React, { useEffect, useMemo } from 'react';
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
  CircularProgress
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
  Cancel as CancelledIcon
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchInvoiceById } from '../store/slices/paymentSlice';
import { InvoiceStatus } from '../types/invoice';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { formatDate, formatCurrency } from '../utils/formatters';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();

  const { selectedInvoice: invoice, loading } = useSelector((state: RootState) => state.payments);

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
          {invoice.pdf_url && (
            <Button
              variant="contained"
              startIcon={<PdfIcon />}
              onClick={() => window.open(invoice.pdf_url, '_blank')}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
            >
              Ver PDF
            </Button>
          )}
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
        </Box>
      </Box>

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
              <Typography fontWeight="500">
                {invoice.customer.first_name} {invoice.customer.last_name}
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
                  {invoice.rental.vehicle.brand} {invoice.rental.vehicle.model}
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
