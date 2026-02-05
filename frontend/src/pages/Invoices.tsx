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
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  Menu,
  ListItemIcon,
  ListItemText
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
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { AppDispatch, RootState } from '../store';
import { fetchInvoices, resendInvoice } from '../store/slices/paymentSlice';
import { InvoiceStatus } from '../types/invoice';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import TableSkeleton from '../components/common/TableSkeleton';
import { formatDate, formatCurrency } from '../utils/formatters';
import { exportToCSV, formatCurrencyForCSV, formatDateForCSV } from '../utils/exportCSV';

// Invoice CSV columns
const INVOICES_COLUMNS = [
  { key: 'invoice_code', label: 'Código' },
  { key: 'customer.first_name', label: 'Nombre Cliente' },
  { key: 'customer.last_name', label: 'Apellido Cliente' },
  { key: 'customer.email', label: 'Email Cliente' },
  { key: 'issue_date', label: 'Fecha Emisión', formatter: formatDateForCSV },
  { key: 'due_date', label: 'Fecha Vencimiento', formatter: formatDateForCSV },
  { key: 'subtotal', label: 'Subtotal', formatter: formatCurrencyForCSV },
  { key: 'tax_amount', label: 'IVA', formatter: formatCurrencyForCSV },
  { key: 'total_amount', label: 'Total', formatter: formatCurrencyForCSV },
  { key: 'paid_amount', label: 'Pagado', formatter: formatCurrencyForCSV },
  { key: 'balance', label: 'Saldo', formatter: formatCurrencyForCSV },
  { key: 'status', label: 'Estado' }
];

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { invoices, loading, error, invoicePagination } = useSelector((state: RootState) => state.payments);

  // Mobile menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof invoices[0] | null>(null);

  // Get default date range (last 30 days to today)
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();

  const [filters, setFilters] = useState({
    status: '' as InvoiceStatus | '',
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

  const [resending, setResending] = useState<number | null>(null);

  useEffect(() => {
    const apiFilters = {
      ...filters,
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    };
    dispatch(fetchInvoices(apiFilters));
  }, [dispatch, filters, debouncedSearch]);

  const handleFilterChange = useCallback((key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  }, []);

  const handleClearDateFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, startDate: '', endDate: '', page: 1 }));
  }, []);

  const handleExportCSV = useCallback(() => {
    exportToCSV(invoices, INVOICES_COLUMNS, 'facturas');
  }, [invoices]);

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

  // Mobile menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, invoice: typeof invoices[0]) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedInvoice(invoice);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedInvoice(null);
  }, []);

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
      <Box sx={{ p: { xs: 0, sm: 3 } }}>
        {/* Header skeleton */}
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              height: { xs: 24, sm: 32 },
              width: { xs: 100, sm: 140 },
              bgcolor: isDarkMode ? 'grey.700' : 'grey.200',
              borderRadius: 1,
              mb: 1
            }}
            className="animate-pulse"
          />
          <Box
            sx={{
              height: 16,
              width: { xs: 200, sm: 280 },
              bgcolor: isDarkMode ? 'grey.700' : 'grey.200',
              borderRadius: 1,
              display: { xs: 'none', sm: 'block' }
            }}
            className="animate-pulse"
          />
        </Box>

        {/* Stats skeleton */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 },
          mb: { xs: 2, sm: 4 }
        }}>
          {[1, 2, 3, 4].map((i) => (
            <Paper
              key={i}
              sx={{
                p: { xs: 2, sm: 3 },
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                borderRadius: { xs: '12px', sm: 2 },
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <Box sx={{ height: { xs: 12, sm: 16 }, width: { xs: 50, sm: 80 }, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1, mb: { xs: 1, sm: 2 } }} className="animate-pulse" />
              <Box sx={{ height: { xs: 24, sm: 32 }, width: { xs: 40, sm: 60 }, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1 }} className="animate-pulse" />
            </Paper>
          ))}
        </Box>

        {/* Table/Cards skeleton */}
        {isMobile ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Paper
                key={i}
                sx={{
                  p: 2,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#fff',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ height: 16, width: 100, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1 }} className="animate-pulse" />
                  <Box sx={{ height: 24, width: 60, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: '12px' }} className="animate-pulse" />
                </Box>
                <Box sx={{ height: 1, bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)', my: 1.5 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {[1, 2, 3, 4].map((j) => (
                    <Box key={j}>
                      <Box sx={{ height: 10, width: 40, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 0.5, mb: 0.5 }} className="animate-pulse" />
                      <Box sx={{ height: 14, width: 70, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 0.5 }} className="animate-pulse" />
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <TableSkeleton rows={8} columns={8} isDarkMode={isDarkMode} />
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3, md: 4 }
      }}>
        <Box>
          <Typography
            variant="h3"
            fontWeight="700"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              letterSpacing: '-0.02em',
              mb: 0.5
            }}
          >
            Facturas
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Gestión de facturas y cuentas por cobrar
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/invoices/new')}
          fullWidth={isMobile}
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
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3, md: 4 }
      }}>
        {[
          { id: 'total', label: 'Total', fullLabel: 'Total Facturas', value: stats.total, color: '#8b5cf6', icon: <InvoiceIcon /> },
          { id: 'paid', label: 'Pagadas', fullLabel: 'Pagadas', value: stats.paid, color: '#10b981', icon: <PaidIcon /> },
          { id: 'overdue', label: 'Vencidas', fullLabel: 'Vencidas', value: stats.overdue, color: '#ef4444', icon: <OverdueIcon /> },
          { id: 'balance', label: 'Por Cobrar', fullLabel: 'Por Cobrar', value: formatCurrency(stats.totalBalance), color: '#f59e0b', icon: <MoneyIcon /> }
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
            <Box sx={{
              position: 'absolute',
              top: { xs: -5, sm: -10 },
              right: { xs: -5, sm: -10 },
              opacity: 0.1,
              color: stat.color
            }}>
              {React.cloneElement(stat.icon, { sx: { fontSize: { xs: 50, sm: 80 } } })}
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mb: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.7rem', sm: '0.875rem' }
              }}
            >
              {isMobile ? stat.label : stat.fullLabel}
            </Typography>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: stat.color,
                fontSize: stat.id === 'balance'
                  ? { xs: '0.9rem', sm: '1.25rem', md: '1.5rem' }
                  : { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
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

      {/* Filters Row 1 */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: 2,
        flexWrap: 'wrap'
      }}>
        <TextField
          id="invoices-search"
          placeholder={isMobile ? "Buscar..." : "Buscar por código, cliente, email..."}
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{
            flexGrow: 1,
            minWidth: { xs: 'auto', md: 250 },
            width: { xs: '100%', md: 'auto' }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          aria-label="Buscar facturas"
        />

        <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 150 }, width: { xs: '100%', md: 'auto' } }}>
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

      {/* Filters Row 2: Dates and Export */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3 },
        flexWrap: 'wrap',
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <Box sx={{
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' }
        }}>
          <TextField
            id="invoices-start-date"
            label="Fecha Desde"
            type="date"
            size="small"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            sx={{ minWidth: { xs: 0, sm: 160 }, flex: { xs: 1, sm: 'none' } }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            id="invoices-end-date"
            label="Fecha Hasta"
            type="date"
            size="small"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            sx={{ minWidth: { xs: 0, sm: 160 }, flex: { xs: 1, sm: 'none' } }}
            InputLabelProps={{ shrink: true }}
          />

          {(filters.startDate || filters.endDate) && (
            <IconButton
              size="small"
              onClick={handleClearDateFilters}
              sx={{ color: 'text.secondary', minWidth: 40 }}
              aria-label="Limpiar filtros de fecha"
            >
              <ClearIcon />
            </IconButton>
          )}
        </Box>

        {!isMobile && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExportCSV}
              disabled={invoices.length === 0}
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
          </>
        )}

        {isMobile && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={invoices.length === 0}
            fullWidth
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
        )}
      </Box>

      {/* Mobile Card View */}
      {isMobile ? (
        <Box>
          {invoices.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <InvoiceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No hay facturas registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crea una nueva factura para comenzar
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {invoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:active': {
                      transform: 'scale(0.98)',
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header: Code + Status + Menu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#8b5cf6' }}>
                          {invoice.invoice_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.customer?.first_name} {invoice.customer?.last_name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getStatusChip(invoice.status)}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, invoice)}
                          sx={{ ml: 0.5 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }} />

                    {/* Grid 2x2 with main data */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Emisión
                        </Typography>
                        <Typography variant="body2" fontSize="0.8rem">
                          {formatDate(invoice.issue_date)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Vencimiento
                        </Typography>
                        <Typography variant="body2" fontSize="0.8rem">
                          {formatDate(invoice.due_date)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Total
                        </Typography>
                        <Typography variant="body2" fontWeight="600" fontSize="0.8rem">
                          {formatCurrency(invoice.total_amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Saldo
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          fontSize="0.8rem"
                          sx={{ color: invoice.balance > 0 ? '#ef4444' : '#10b981' }}
                        >
                          {formatCurrency(invoice.balance)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* Mobile Pagination */}
          {invoicePagination.pages > 1 && (
            <TablePagination
              component="div"
              count={invoicePagination.total}
              page={filters.page - 1}
              onPageChange={handleChangePage}
              rowsPerPage={filters.limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage=""
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
              sx={{
                '& .MuiTablePagination-selectLabel': { display: 'none' },
                '& .MuiTablePagination-select': { display: 'none' },
                '& .MuiTablePagination-selectIcon': { display: 'none' },
                borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                mt: 2
              }}
            />
          )}

          {/* Mobile Action Menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: isDarkMode ? '#1c1c2e' : '#fff',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
                minWidth: 180
              }
            }}
          >
            <MenuItem
              onClick={() => {
                if (selectedInvoice) navigate(`/invoices/${selectedInvoice.id}`);
                handleMenuClose();
              }}
            >
              <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Ver Detalle</ListItemText>
            </MenuItem>
            {selectedInvoice?.pdf_url && (
              <MenuItem
                onClick={() => {
                  if (selectedInvoice) handleDownloadPDF(selectedInvoice);
                  handleMenuClose();
                }}
              >
                <ListItemIcon><PdfIcon fontSize="small" sx={{ color: '#3b82f6' }} /></ListItemIcon>
                <ListItemText>Descargar PDF</ListItemText>
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                if (selectedInvoice) handleResendInvoice(selectedInvoice.id);
                handleMenuClose();
              }}
              disabled={resending === selectedInvoice?.id}
            >
              <ListItemIcon>
                {resending === selectedInvoice?.id
                  ? <CircularProgress size={18} />
                  : <SendIcon fontSize="small" sx={{ color: '#10b981' }} />
                }
              </ListItemIcon>
              <ListItemText>Reenviar</ListItemText>
            </MenuItem>
            {selectedInvoice && selectedInvoice.balance > 0 && (
              <MenuItem
                onClick={() => {
                  if (selectedInvoice) navigate(`/payments/new?invoice=${selectedInvoice.id}`);
                  handleMenuClose();
                }}
              >
                <ListItemIcon><PayIcon fontSize="small" sx={{ color: '#8b5cf6' }} /></ListItemIcon>
                <ListItemText>Registrar Pago</ListItemText>
              </MenuItem>
            )}
          </Menu>
        </Box>
      ) : (
        /* Desktop Table View */
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
                  <TableRow
                    key={invoice.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600" sx={{ color: '#8b5cf6' }}>
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
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${invoice.id}`);
                          }}
                          sx={{
                            color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                            minWidth: 'auto',
                            px: 1
                          }}
                        >
                          Ver
                        </Button>
                        {invoice.pdf_url && (
                          <Button
                            size="small"
                            startIcon={<PdfIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(invoice);
                            }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResendInvoice(invoice.id);
                          }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/payments/new?invoice=${invoice.id}`);
                            }}
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

          {/* Desktop Pagination */}
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
      )}
    </Box>
  );
};

export default Invoices;
