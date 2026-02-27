/**
 * Página de Listado de Cotizaciones
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
  Menu,
  MenuItem,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  CheckCircle as AcceptedIcon,
  Cancel as RejectedIcon,
  Schedule as DraftIcon,
  SwapHoriz as ConvertedIcon,
  TimerOff as ExpiredIcon,
  RequestQuote as QuotesIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { FileDownload as ExportIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import TableSkeleton from '../components/common/TableSkeleton';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';
import { exportToCSV, QUOTES_COLUMNS } from '../utils/exportCSV';
import { Quote, QuoteStatus, QuoteFilters } from '../types/quote';
import quoteService from '../services/quoteService';

const getStatusConfig = (status: QuoteStatus) => {
  const configs: Record<QuoteStatus, { label: string; color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'; icon: React.ReactElement }> = {
    [QuoteStatus.DRAFT]: { label: 'Borrador', color: 'default', icon: <DraftIcon sx={{ fontSize: 16 }} /> },
    [QuoteStatus.SENT]: { label: 'Enviada', color: 'info', icon: <SendIcon sx={{ fontSize: 16 }} /> },
    [QuoteStatus.ACCEPTED]: { label: 'Aceptada', color: 'success', icon: <AcceptedIcon sx={{ fontSize: 16 }} /> },
    [QuoteStatus.REJECTED]: { label: 'Rechazada', color: 'error', icon: <RejectedIcon sx={{ fontSize: 16 }} /> },
    [QuoteStatus.EXPIRED]: { label: 'Expirada', color: 'warning', icon: <ExpiredIcon sx={{ fontSize: 16 }} /> },
    [QuoteStatus.CONVERTED]: { label: 'Convertida', color: 'primary', icon: <ConvertedIcon sx={{ fontSize: 16 }} /> }
  };
  return configs[status] || configs[QuoteStatus.DRAFT];
};

const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch quotes
  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const filters: QuoteFilters = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter as QuoteStatus;

      const response = await quoteService.getAll(filters);
      if (response.success) {
        setQuotes(response.data.quotes);
        setTotalCount(response.data.pagination.total);
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar cotizaciones', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, enqueueSnackbar]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quote: Quote) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuote(quote);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuote(null);
  };

  const handleSend = async (quote: Quote) => {
    try {
      await quoteService.send(quote.id);
      enqueueSnackbar('Cotización enviada exitosamente', { variant: 'success' });
      fetchQuotes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al enviar cotización', { variant: 'error' });
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedQuote) return;
    try {
      await quoteService.delete(selectedQuote.id);
      enqueueSnackbar('Cotización eliminada', { variant: 'success' });
      fetchQuotes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al eliminar', { variant: 'error' });
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(0);
  };

  const handleExportCSV = () => {
    if (quotes.length === 0) {
      enqueueSnackbar('No hay datos para exportar', { variant: 'warning' });
      return;
    }
    exportToCSV(quotes, QUOTES_COLUMNS, 'cotizaciones');
    enqueueSnackbar('CSV exportado exitosamente', { variant: 'success' });
  };

  // Mobile card view
  const renderMobileCard = (quote: Quote) => {
    const statusConfig = getStatusConfig(quote.status);
    return (
      <Card
        key={quote.id}
        sx={{
          mb: 1.5,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          borderRadius: '12px',
          cursor: 'pointer',
          '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb' }
        }}
        onClick={() => navigate(`/quotes/${quote.id}`)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
              {quote.quote_code}
            </Typography>
            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              size="small"
              icon={statusConfig.icon}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {quote.customer?.name || 'Sin cliente'}
          </Typography>
          <Stack direction="row" justifyContent="space-between" mt={1}>
            <Typography variant="body2" color="text.secondary">
              {formatDate(quote.created_at)}
            </Typography>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#0075ff' }}>
              {formatCurrency(quote.total_amount)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
            Cotizaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount} cotización{totalCount !== 1 ? 'es' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={quotes.length === 0}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/quotes/new')}
            sx={{
              background: 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { background: 'linear-gradient(90deg, #0060cc 0%, #1ab8e0 100%)' }
            }}
          >
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por código..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="draft">Borrador</MenuItem>
              <MenuItem value="sent">Enviada</MenuItem>
              <MenuItem value="accepted">Aceptada</MenuItem>
              <MenuItem value="rejected">Rechazada</MenuItem>
              <MenuItem value="expired">Expirada</MenuItem>
              <MenuItem value="converted">Convertida</MenuItem>
            </Select>
          </FormControl>
          {(search || statusFilter) && (
            <IconButton onClick={clearFilters} size="small" title="Limpiar filtros">
              <ClearIcon />
            </IconButton>
          )}
        </Stack>
      </Paper>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={<QuotesIcon sx={{ fontSize: 48 }} />}
          title="No hay cotizaciones"
          subtitle={search || statusFilter ? 'No se encontraron cotizaciones con los filtros aplicados' : 'Crea tu primera cotización para empezar'}
        />
      ) : isMobile ? (
        // Mobile view
        <Box>
          {quotes.map(renderMobileCard)}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            labelRowsPerPage="Por página"
          />
        </Box>
      ) : (
        // Desktop table
        <Paper
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(0,117,255,0.08)' : '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Válida hasta</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.map((quote) => {
                  const statusConfig = getStatusConfig(quote.status);
                  return (
                    <TableRow
                      key={quote.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isDarkMode ? 'rgba(0,117,255,0.06)' : '#f0f7ff' }
                      }}
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#0075ff' }}>
                          {quote.quote_code}
                        </Typography>
                      </TableCell>
                      <TableCell>{quote.customer?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {quote.vehicle
                          ? `${quote.vehicle.make} ${quote.vehicle.model} (${quote.vehicle.license_plate})`
                          : 'Sin vehículo'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(quote.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          icon={statusConfig.icon}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(quote.valid_until)}</TableCell>
                      <TableCell>{formatDate(quote.created_at)}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, quote)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            labelRowsPerPage="Por página"
          />
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: isDarkMode ? '#1c1c2e' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`
          }
        }}
      >
        <MenuItem onClick={() => { navigate(`/quotes/${selectedQuote?.id}`); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1.5, fontSize: 20 }} /> Ver detalle
        </MenuItem>
        {selectedQuote?.status === 'draft' && (
          <MenuItem onClick={() => { navigate(`/quotes/${selectedQuote?.id}/edit`); handleMenuClose(); }}>
            <EditIcon sx={{ mr: 1.5, fontSize: 20 }} /> Editar
          </MenuItem>
        )}
        {selectedQuote?.status === 'draft' && (
          <MenuItem onClick={() => selectedQuote && handleSend(selectedQuote)}>
            <SendIcon sx={{ mr: 1.5, fontSize: 20, color: '#3b82f6' }} /> Enviar
          </MenuItem>
        )}
        {selectedQuote?.status === 'draft' && (
          <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: '#ef4444' }}>
            <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} /> Eliminar
          </MenuItem>
        )}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar cotización</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar la cotización {selectedQuote?.quote_code}? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Quotes;
