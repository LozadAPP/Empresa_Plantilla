/**
 * Página de Listado de Pagos (CHAT 2) - Convertido a Material UI
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
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  Payment as PaymentIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Cancel as FailedIcon,
  Replay as RefundIcon,
  AttachMoney as CashIcon,
  ThumbUp as ConfirmIcon,
  ThumbDown as RejectIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { AppDispatch, RootState } from '../store';
import { fetchPayments } from '../store/slices/paymentSlice';
import { PaymentStatus, PaymentType } from '../types/payment';
import paymentService from '../services/paymentService';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import TableSkeleton from '../components/common/TableSkeleton';
import { exportToCSV, PAYMENTS_COLUMNS } from '../utils/exportCSV';
import { formatDateTime, formatCurrency } from '../utils/formatters';

// Función para calcular fechas por defecto (últimos 30 días)
const getDefaultDates = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  return {
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
};

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { enqueueSnackbar } = useSnackbar();
  const { isDarkMode } = useCustomTheme();
  const themeStyles = useThemeStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Estado para diálogo de rechazo
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { payments, loading, error, paymentPagination } = useSelector((state: RootState) => state.payments);

  const defaultDates = getDefaultDates();
  const [filters, setFilters] = useState({
    status: '' as PaymentStatus | '',
    payment_type: '' as PaymentType | '',
    payment_method: '',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    page: 1,
    limit: 20
  });

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch when filters or search change
  useEffect(() => {
    const apiFilters = {
      ...filters,
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      payment_type: filters.payment_type || undefined,
      payment_method: filters.payment_method || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    };
    dispatch(fetchPayments(apiFilters));
  }, [dispatch, filters, debouncedSearch]);

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleExportCSV = useCallback(() => {
    exportToCSV(payments, PAYMENTS_COLUMNS, 'pagos');
  }, [payments]);

  // Handler para restaurar filtros de fecha a valores por defecto
  const handleClearDateFilters = useCallback(() => {
    const defaults = getDefaultDates();
    setFilters(prev => ({ ...prev, startDate: defaults.startDate, endDate: defaults.endDate, page: 1 }));
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  }, []);

  // Confirmar pago pendiente
  const handleConfirmPayment = useCallback(async (paymentId: number) => {
    setActionLoading(true);
    try {
      await paymentService.confirmPayment(paymentId);
      enqueueSnackbar('Pago confirmado exitosamente', { variant: 'success' });
      dispatch(fetchPayments(filters));
    } catch {
      enqueueSnackbar('Error al confirmar pago', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [dispatch, enqueueSnackbar, filters]);

  // Abrir diálogo de rechazo
  const handleOpenRejectDialog = useCallback((paymentId: number) => {
    setRejectPaymentId(paymentId);
    setRejectReason('');
    setRejectDialogOpen(true);
  }, []);

  // Rechazar pago pendiente
  const handleRejectPayment = useCallback(async () => {
    if (!rejectPaymentId) return;
    setActionLoading(true);
    try {
      await paymentService.failPayment(rejectPaymentId, rejectReason);
      enqueueSnackbar('Pago rechazado', { variant: 'warning' });
      setRejectDialogOpen(false);
      dispatch(fetchPayments(filters));
    } catch {
      enqueueSnackbar('Error al rechazar pago', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  }, [rejectPaymentId, rejectReason, dispatch, enqueueSnackbar, filters]);

  // Status chip configuration
  const STATUS_CONFIGS = useMemo(() => ({
    pending: { label: 'Pendiente', color: 'warning' as const, Icon: PendingIcon },
    completed: { label: 'Completado', color: 'success' as const, Icon: CompletedIcon },
    failed: { label: 'Fallido', color: 'error' as const, Icon: FailedIcon },
    refunded: { label: 'Reembolsado', color: 'info' as const, Icon: RefundIcon }
  }), []);

  const getStatusChip = useCallback((status: PaymentStatus) => {
    const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.pending;
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

  // Type chip configuration
  const TYPE_CONFIGS = useMemo(() => ({
    rental_payment: { label: 'Pago de Renta', color: 'primary' as const },
    deposit: { label: 'Depósito', color: 'info' as const },
    penalty: { label: 'Penalidad', color: 'warning' as const },
    refund: { label: 'Reembolso', color: 'secondary' as const }
  }), []);

  const getTypeChip = useCallback((type: PaymentType) => {
    const config = TYPE_CONFIGS[type] || { label: type, color: 'default' as const };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  }, [TYPE_CONFIGS]);

  // Method display
  const METHOD_LABELS: Record<string, string> = {
    cash: 'Efectivo',
    credit_card: 'Tarjeta de Crédito',
    debit_card: 'Tarjeta de Débito',
    transfer: 'Transferencia',
    check: 'Cheque'
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      totalAmount
    };
  }, [payments]);

  if (loading && payments.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header skeleton */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              height: 32,
              width: 120,
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
      {/* Header - Responsive */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 3, sm: 4 }
      }}>
        <Box>
          <Typography
            variant="h3"
            fontWeight="700"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, letterSpacing: '-0.02em', mb: 0.5 }}
          >
            Pagos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', display: { xs: 'none', sm: 'block' } }}>
            Historial de pagos y transacciones
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/payments/new')}
          fullWidth={isMobile}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            py: { xs: 1.25, sm: 1 },
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          {isMobile ? 'Registrar' : 'Registrar Pago'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        {[
          { id: 'total', label: isMobile ? 'Total' : 'Total Pagos', value: stats.total, color: themeStyles.purple.main, icon: <PaymentIcon /> },
          { id: 'completed', label: isMobile ? 'Completos' : 'Completados', value: stats.completed, color: themeStyles.status.success.main, icon: <CompletedIcon /> },
          { id: 'pending', label: 'Pendientes', value: stats.pending, color: themeStyles.status.warning.main, icon: <PendingIcon /> },
          { id: 'amount', label: isMobile ? 'Monto' : 'Monto Total', value: formatCurrency(stats.totalAmount), color: themeStyles.status.info.main, icon: <CashIcon /> }
        ].map((stat) => (
          <Paper
            key={stat.id}
            sx={{
              p: { xs: 2, sm: 3 },
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: { xs: '12px', sm: 2 },
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
            <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color, fontSize: stat.id === 'amount' ? '1.5rem' : '2rem' }}>
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

      {/* Filters - Responsive */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: 2,
        alignItems: { xs: 'stretch', md: 'center' }
      }}>
        <TextField
          id="payments-search"
          placeholder={isMobile ? "Buscar..." : "Buscar por código, cliente, renta, factura..."}
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1, minWidth: { xs: 'auto', md: 250 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          aria-label="Buscar pagos"
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 130 }, flex: { xs: 1, sm: 'none' } }}>
            <InputLabel>Método</InputLabel>
            <Select
              value={filters.payment_method}
              label="Método"
              onChange={(e) => handleFilterChange('payment_method', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="cash">Efectivo</MenuItem>
              <MenuItem value="credit_card">T. Crédito</MenuItem>
              <MenuItem value="debit_card">T. Débito</MenuItem>
              <MenuItem value="transfer">Transferencia</MenuItem>
              <MenuItem value="check">Cheque</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 120 }, flex: { xs: 1, sm: 'none' } }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.status}
              label="Estado"
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="completed">Completado</MenuItem>
              <MenuItem value="failed">Fallido</MenuItem>
              <MenuItem value="refunded">Reembolsado</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Filters Row 2 - Responsive */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: 3,
        alignItems: { xs: 'stretch', md: 'center' }
      }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 140 }, flex: { xs: 1, sm: 'none' } }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filters.payment_type}
              label="Tipo"
              onChange={(e) => handleFilterChange('payment_type', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="rental_payment">Pago de Renta</MenuItem>
              <MenuItem value="deposit">Depósito</MenuItem>
              <MenuItem value="penalty">Penalidad</MenuItem>
              <MenuItem value="refund">Reembolso</MenuItem>
            </Select>
          </FormControl>

          <TextField
            id="payments-start-date"
            label="Desde"
            type="date"
            size="small"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 140 }, flex: { xs: 1, sm: 'none' } }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            id="payments-end-date"
            label="Hasta"
            type="date"
            size="small"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 140 }, flex: { xs: 1, sm: 'none' } }}
            InputLabelProps={{ shrink: true }}
          />

          {(filters.startDate || filters.endDate) && (
            <IconButton
              size="small"
              onClick={handleClearDateFilters}
              sx={{ color: 'text.secondary', alignSelf: 'center' }}
              aria-label="Limpiar filtros de fecha"
            >
              <ClearIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />

        <Button
          variant="outlined"
          startIcon={!isMobile && <ExportIcon />}
          onClick={handleExportCSV}
          disabled={payments.length === 0}
          fullWidth={isMobile}
          sx={{
            borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            '&:hover': {
              borderColor: '#8b5cf6',
              color: '#8b5cf6'
            }
          }}
        >
          {isMobile ? <ExportIcon /> : 'Exportar CSV'}
        </Button>
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
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell><strong>Código</strong></TableCell>
              <TableCell><strong>Cliente</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Método</strong></TableCell>
              <TableCell><strong>Monto</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Referencia</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                  <PaymentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay pagos registrados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Registra un nuevo pago para comenzar
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {payment.payment_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.customer?.first_name} {payment.customer?.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {payment.customer?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getTypeChip(payment.payment_type)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {METHOD_LABELS[payment.payment_method] || payment.payment_method}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateTime(payment.transaction_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(payment.status)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {payment.reference_number || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {payment.status === 'pending' ? (
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Confirmar pago">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={(e) => { e.stopPropagation(); handleConfirmPayment(payment.id); }}
                            disabled={actionLoading}
                          >
                            <ConfirmIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Rechazar pago">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); handleOpenRejectDialog(payment.id); }}
                            disabled={actionLoading}
                          >
                            <RejectIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {paymentPagination.pages > 1 && (
          <TablePagination
            component="div"
            count={paymentPagination.total}
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

      {/* Diálogo de Rechazo */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Pago</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa el motivo por el cual se rechaza este pago.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Motivo del rechazo"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleRejectPayment}
            color="error"
            variant="contained"
            disabled={actionLoading || !rejectReason.trim()}
          >
            Rechazar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;
