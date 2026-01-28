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
  Button
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
  CreditCard as CreditCardIcon,
  AccountBalance as TransferIcon,
  AttachMoney as CashIcon
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchPayments } from '../store/slices/paymentSlice';
import { PaymentStatus, PaymentType } from '../types/payment';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import TableSkeleton from '../components/common/TableSkeleton';
import { exportToCSV, PAYMENTS_COLUMNS } from '../utils/exportCSV';
import { formatDateTime, formatCurrency } from '../utils/formatters';

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();

  const { payments, loading, error, paymentPagination } = useSelector((state: RootState) => state.payments);

  const [filters, setFilters] = useState({
    status: '' as PaymentStatus | '',
    payment_type: '' as PaymentType | '',
    payment_method: '',
    startDate: '',
    endDate: '',
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

  const handleClearDateFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, startDate: '', endDate: '', page: 1 }));
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  }, []);

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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Pagos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Historial de pagos y transacciones
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/payments/new')}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          Registrar Pago
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        {[
          { id: 'total', label: 'Total Pagos', value: stats.total, color: '#8b5cf6', icon: <PaymentIcon /> },
          { id: 'completed', label: 'Completados', value: stats.completed, color: '#10b981', icon: <CompletedIcon /> },
          { id: 'pending', label: 'Pendientes', value: stats.pending, color: '#f59e0b', icon: <PendingIcon /> },
          { id: 'amount', label: 'Monto Total', value: formatCurrency(stats.totalAmount), color: '#3b82f6', icon: <CashIcon /> }
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

      {/* Filters Row 1 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          id="payments-search"
          placeholder="Buscar por código, cliente, renta, factura..."
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          aria-label="Buscar pagos"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Método</InputLabel>
          <Select
            value={filters.payment_method}
            label="Método"
            onChange={(e) => handleFilterChange('payment_method', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="cash">Efectivo</MenuItem>
            <MenuItem value="credit_card">Tarjeta de Crédito</MenuItem>
            <MenuItem value="debit_card">Tarjeta de Débito</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
            <MenuItem value="check">Cheque</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
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

      {/* Filters Row 2 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tipo de Pago</InputLabel>
          <Select
            value={filters.payment_type}
            label="Tipo de Pago"
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
          label="Fecha Desde"
          type="date"
          size="small"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          id="payments-end-date"
          label="Fecha Hasta"
          type="date"
          size="small"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />

        {(filters.startDate || filters.endDate) && (
          <IconButton
            size="small"
            onClick={handleClearDateFilters}
            sx={{ color: 'text.secondary' }}
            aria-label="Limpiar filtros de fecha"
          >
            <ClearIcon />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={handleExportCSV}
          disabled={payments.length === 0}
          sx={{
            borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            '&:hover': {
              borderColor: '#8b5cf6',
              color: '#8b5cf6'
            }
          }}
        >
          Exportar CSV
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
        <Table>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
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
    </Box>
  );
};

export default Payments;
