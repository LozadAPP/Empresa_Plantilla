/**
 * Página de Listado de Facturas (CHAT 2) - Convertido a Material UI
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as InvoiceIcon,
  CheckCircle as PaidIcon,
  Schedule as SentIcon,
  Warning as OverdueIcon,
  Cancel as CancelledIcon,
  Description as DraftIcon,
  PictureAsPdf as PdfIcon,
  Send as SendIcon,
  Payment as PayIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { AppDispatch, RootState } from '../store';
import { fetchInvoices, resendInvoice } from '../store/slices/paymentSlice';
import { InvoiceStatus } from '../types/invoice';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import TableSkeleton from '../components/common/TableSkeleton';
import { formatDate, formatCurrency } from '../utils/formatters';

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();

  const { invoices, loading, error, invoicePagination } = useSelector((state: RootState) => state.payments);

  const [filters, setFilters] = useState({
    status: '' as InvoiceStatus | '',
    page: 1,
    limit: 20
  });

  const [resending, setResending] = useState<number | null>(null);

  useEffect(() => {
    const apiFilters = {
      ...filters,
      status: filters.status || undefined
    };
    dispatch(fetchInvoices(apiFilters));
  }, [dispatch, filters]);

  const handleFilterChange = useCallback((key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  }, []);

  const handleResendInvoice = useCallback(async (invoiceId: number) => {
    setResending(invoiceId);
    try {
      await dispatch(resendInvoice(invoiceId)).unwrap();
      enqueueSnackbar('Factura reenviada exitosamente', { variant: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      enqueueSnackbar(`Error al reenviar factura: ${message}`, { variant: 'error' });
    } finally {
      setResending(null);
    }
  }, [dispatch, enqueueSnackbar]);

  const handleDownloadPDF = useCallback((invoice: { pdf_url?: string; invoice_code: string }) => {
    if (invoice.pdf_url) {
      window.open(invoice.pdf_url, '_blank');
    } else {
      enqueueSnackbar('PDF no disponible para esta factura', { variant: 'warning' });
    }
  }, [enqueueSnackbar]);

  // Status chip configuration
  const STATUS_CONFIGS = useMemo(() => ({
    draft: { label: 'Borrador', color: 'default' as const, Icon: DraftIcon },
    sent: { label: 'Enviada', color: 'info' as const, Icon: SentIcon },
    paid: { label: 'Pagada', color: 'success' as const, Icon: PaidIcon },
    overdue: { label: 'Vencida', color: 'error' as const, Icon: OverdueIcon },
    cancelled: { label: 'Cancelada', color: 'warning' as const, Icon: CancelledIcon }
  }), []);

  const getStatusChip = useCallback((status: InvoiceStatus) => {
    const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.draft;
    const IconComponent = config.Icon;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={<IconComponent sx={{ fontSize: 16 }} />}
        sx={{ fontWeight: 500 }}
      />
    );
  }, [STATUS_CONFIGS]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
    return {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      totalBalance
    };
  }, [invoices]);

  if (loading && invoices.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header skeleton */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              height: 32,
              width: 140,
              bgcolor: isDarkMode ? 'grey.700' : 'grey.200',
              borderRadius: 1,
              mb: 1
            }}
            className="animate-pulse"
          />
          <Box
            sx={{
              height: 16,
              width: 280,
              bgcolor: isDarkMode ? 'grey.700' : 'grey.200',
              borderRadius: 1
            }}
            className="animate-pulse"
          />
        </Box>

        {/* Stats skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Paper
              key={i}
              sx={{
                p: 3,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <Box sx={{ height: 16, width: 80, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1, mb: 2 }} className="animate-pulse" />
              <Box sx={{ height: 32, width: 60, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1 }} className="animate-pulse" />
            </Paper>
          ))}
        </Box>

        {/* Table skeleton */}
        <TableSkeleton rows={8} columns={8} isDarkMode={isDarkMode} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Facturas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Gestión de facturas y cuentas por cobrar
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/invoices/new')}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          Nueva Factura
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        {[
          { id: 'total', label: 'Total Facturas', value: stats.total, color: '#8b5cf6', icon: <InvoiceIcon /> },
          { id: 'paid', label: 'Pagadas', value: stats.paid, color: '#10b981', icon: <PaidIcon /> },
          { id: 'overdue', label: 'Vencidas', value: stats.overdue, color: '#ef4444', icon: <OverdueIcon /> },
          { id: 'balance', label: 'Por Cobrar', value: formatCurrency(stats.totalBalance), color: '#f59e0b', icon: <MoneyIcon /> }
        ].map((stat) => (
          <Paper
            key={stat.id}
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, color: stat.color }}>
              {React.cloneElement(stat.icon, { sx: { fontSize: 80 } })}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {stat.label}
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: stat.color,
                fontSize: stat.id === 'balance' ? '1.5rem' : '2rem'
              }}
            >
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Error Alert */}
      {error && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee',
            border: `1px solid ${isDarkMode ? '#f87171' : '#fca5a5'}`,
            color: isDarkMode ? '#fca5a5' : '#dc2626'
          }}
        >
          <Typography variant="body2">{error}</Typography>
        </Paper>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filters.status}
            label="Estado"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="draft">Borrador</MenuItem>
            <MenuItem value="sent">Enviada</MenuItem>
            <MenuItem value="paid">Pagada</MenuItem>
            <MenuItem value="overdue">Vencida</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          borderRadius: 2,
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Código</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Fecha Emisión</strong></TableCell>
              <TableCell><strong>Vencimiento</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Saldo</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <InvoiceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay facturas registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea una nueva factura para comenzar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {invoice.invoice_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.customer?.first_name} {invoice.customer?.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {invoice.customer?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(invoice.issue_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(invoice.due_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrency(invoice.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      sx={{ color: invoice.balance > 0 ? '#ef4444' : '#10b981' }}
                    >
                      {formatCurrency(invoice.balance)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(invoice.status)}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {invoice.pdf_url && (
                        <Button
                          size="small"
                          startIcon={<PdfIcon />}
                          onClick={() => handleDownloadPDF(invoice)}
                          sx={{
                            color: '#3b82f6',
                            minWidth: 'auto',
                            px: 1
                          }}
                        >
                          PDF
                        </Button>
                      )}
                      <Button
                        size="small"
                        startIcon={resending === invoice.id ? <CircularProgress size={14} /> : <SendIcon />}
                        onClick={() => handleResendInvoice(invoice.id)}
                        disabled={resending === invoice.id}
                        sx={{
                          color: '#10b981',
                          minWidth: 'auto',
                          px: 1
                        }}
                      >
                        Enviar
                      </Button>
                      {invoice.balance > 0 && (
                        <Button
                          size="small"
                          startIcon={<PayIcon />}
                          onClick={() => navigate(`/payments/new?invoice=${invoice.id}`)}
                          sx={{
                            color: '#8b5cf6',
                            minWidth: 'auto',
                            px: 1
                          }}
                        >
                          Pagar
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {invoicePagination.pages > 1 && (
          <TablePagination
            component="div"
            count={invoicePagination.total}
            page={filters.page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={filters.limit}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>
    </Box>
  );
};

export default Invoices;
