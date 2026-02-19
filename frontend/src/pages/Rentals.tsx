/**
 * Página de Listado de Rentas (CHAT 2)
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Divider,
  Collapse
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  CheckCircle as CompletedIcon,
  Schedule as ReservedIcon,
  Cancel as CancelledIcon,
  PlayArrow as ActiveIcon,
  Warning as OverdueIcon,
  Assignment as RentalsIcon,
  FileDownload as ExportIcon,
  Clear as ClearIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchRentals } from '../store/slices/rentalSlice';
import { RentalStatus } from '../types/rental';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import TableSkeleton from '../components/common/TableSkeleton';
import EmptyState from '../components/common/EmptyState';
import { exportToCSV, RENTALS_COLUMNS } from '../utils/exportCSV';
import { formatDate } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';

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

const Rentals: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const themeStyles = useThemeStyles();
  const theme = useTheme();

  // RESPONSIVE: Media queries
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.down('md')); // < 900px

  const { rentals, loading, error, pagination } = useSelector((state: RootState) => state.rentals);

  // Estado para expandir/colapsar filtros en móvil
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const defaultDates = getDefaultDates();
  const [filters, setFilters] = useState({
    status: '' as RentalStatus | '',
    search: '',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    page: 1,
    limit: 20
  });

  // Debounced search para evitar demasiadas llamadas API
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRental, setSelectedRental] = useState<any>(null);

  useEffect(() => {
    const apiFilters = {
      status: filters.status || undefined,
      search: debouncedSearch || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: filters.page,
      limit: filters.limit
    };
    dispatch(fetchRentals(apiFilters));
  }, [dispatch, filters.status, filters.startDate, filters.endDate, filters.page, filters.limit, debouncedSearch]);

  // Handler para restaurar filtros de fecha a valores por defecto
  const handleClearDateFilters = useCallback(() => {
    const defaults = getDefaultDates();
    setFilters(prev => ({ ...prev, startDate: defaults.startDate, endDate: defaults.endDate, page: 1 }));
  }, []);

  // Handler para exportar a CSV
  const handleExportCSV = useCallback(() => {
    exportToCSV(rentals, RENTALS_COLUMNS, 'rentas');
  }, [rentals]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, rental: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedRental(rental);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRental(null);
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  }, []);

  // Configuración de chips de estado (definida fuera para evitar recreación)
  const STATUS_CONFIGS = useMemo(() => ({
    pending_approval: { label: 'Pendiente', color: 'warning' as const, Icon: PendingIcon },
    active: { label: 'Activa', color: 'success' as const, Icon: ActiveIcon },
    reserved: { label: 'Reservada', color: 'info' as const, Icon: ReservedIcon },
    completed: { label: 'Completada', color: 'default' as const, Icon: CompletedIcon },
    cancelled: { label: 'Cancelada', color: 'error' as const, Icon: CancelledIcon },
    overdue: { label: 'Vencida', color: 'warning' as const, Icon: OverdueIcon }
  }), []);

  const getStatusChip = useCallback((status: RentalStatus) => {
    const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.active;
    const IconComponent = config.Icon;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={<IconComponent sx={{ fontSize: 16 }} />}
        sx={{
          fontWeight: 500,
          ...(status === 'active' && {
            '@keyframes chipPulse': {
              '0%, 100%': { boxShadow: '0 0 0 0 rgba(1, 181, 116, 0.3)' },
              '50%': { boxShadow: '0 0 0 4px rgba(1, 181, 116, 0)' },
            },
            animation: 'chipPulse 2s ease-in-out infinite',
          }),
        }}
      />
    );
  }, [STATUS_CONFIGS]);

  // Calculate stats (memoizado para evitar recálculos innecesarios)
  const stats = useMemo(() => ({
    total: rentals.length,
    pending: rentals.filter(r => r.status === 'pending_approval').length,
    active: rentals.filter(r => r.status === 'active').length,
    completed: rentals.filter(r => r.status === 'completed').length,
    overdue: rentals.filter(r => r.status === 'overdue').length
  }), [rentals]);

  if (loading && rentals.length === 0) {
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

        {/* Filters skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Box sx={{ height: 40, flexGrow: 1, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1 }} className="animate-pulse" />
          <Box sx={{ height: 40, width: 150, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1 }} className="animate-pulse" />
          <Box sx={{ height: 40, width: 130, bgcolor: isDarkMode ? 'grey.700' : 'grey.200', borderRadius: 1 }} className="animate-pulse" />
        </Box>

        {/* Table skeleton */}
        <TableSkeleton rows={8} columns={7} isDarkMode={isDarkMode} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, letterSpacing: '-0.02em', mb: 0.5 }}>
          Rentas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Gestiona todas las rentas de vehículos
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        {[
          { id: 'total', label: isMobile ? 'Total' : 'Total Rentas', value: stats.total, color: themeStyles.purple.main, icon: <RentalsIcon /> },
          { id: 'active', label: 'Activas', value: stats.active, color: themeStyles.status.success.main, icon: <ActiveIcon /> },
          { id: 'completed', label: isMobile ? 'Completadas' : 'Completadas', value: stats.completed, color: isDarkMode ? '#9ca3af' : '#6b7280', icon: <CompletedIcon /> },
          { id: 'overdue', label: 'Vencidas', value: stats.overdue, color: themeStyles.status.warning.main, icon: <OverdueIcon /> }
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
            <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
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

      {/* Actions Bar - RESPONSIVE */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: 2
      }}>
        {/* Botón Nueva Renta - Primero en móvil */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/rentals/new')}
          fullWidth={isMobile}
          sx={{
            order: { xs: 0, sm: 3 },
            bgcolor: isDarkMode ? '#a78bfa' : '#8b5cf6',
            color: '#fff',
            minHeight: { xs: 48, sm: 40 },
            '&:hover': { bgcolor: isDarkMode ? '#8b5cf6' : '#7c3aed' }
          }}
        >
          Nueva Renta
        </Button>

        {/* Search */}
        <TextField
          id="rentals-search"
          placeholder="Buscar..."
          size="small"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{
            order: { xs: 1, sm: 0 },
            flexGrow: 1,
            minWidth: { xs: '100%', sm: 200 },
            '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          aria-label="Buscar rentas"
        />

        {/* Status Filter */}
        <FormControl size="small" sx={{
          order: { xs: 2, sm: 1 },
          minWidth: { xs: '100%', sm: 150 },
          '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } }
        }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filters.status}
            label="Estado"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending_approval">Pendientes de Aprobación</MenuItem>
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="reserved">Reservadas</MenuItem>
            <MenuItem value="completed">Completadas</MenuItem>
            <MenuItem value="overdue">Vencidas</MenuItem>
            <MenuItem value="cancelled">Canceladas</MenuItem>
          </Select>
        </FormControl>

        {/* Botón expandir filtros en móvil */}
        {isMobile && (
          <Button
            variant="text"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            endIcon={<ExpandMoreIcon sx={{ transform: filtersExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
            sx={{ order: 3, color: 'text.secondary' }}
          >
            Más filtros
          </Button>
        )}
      </Box>

      {/* Date Filters - Colapsables en móvil */}
      <Collapse in={!isMobile || filtersExpanded}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 2 },
          mb: 3,
          alignItems: { sm: 'center' }
        }}>
          <TextField
            id="rentals-start-date"
            label="Fecha Inicio"
            type="date"
            size="small"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            sx={{
              minWidth: { xs: '100%', sm: 160 },
              '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } }
            }}
            InputLabelProps={{ shrink: true }}
            aria-label="Filtrar por fecha de inicio"
          />

          <TextField
            id="rentals-end-date"
            label="Fecha Fin"
            type="date"
            size="small"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            sx={{
              minWidth: { xs: '100%', sm: 160 },
              '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } }
            }}
            InputLabelProps={{ shrink: true }}
            aria-label="Filtrar por fecha de fin"
          />

          {(filters.startDate || filters.endDate) && (
            <IconButton
              size="small"
              onClick={handleClearDateFilters}
              sx={{ color: 'text.secondary', alignSelf: { xs: 'flex-start', sm: 'center' } }}
              aria-label="Limpiar filtros de fecha"
            >
              <ClearIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />

          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={rentals.length === 0}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 48, sm: 40 },
              borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              '&:hover': { borderColor: isDarkMode ? '#a78bfa' : '#8b5cf6', color: isDarkMode ? '#a78bfa' : '#8b5cf6' }
            }}
          >
            Exportar CSV
          </Button>
        </Box>
      </Collapse>

      {/* RESPONSIVE: Cards en móvil, Tabla en desktop */}
      {isMobile ? (
        /* Vista de Cards para móvil */
        <Box>
          {rentals.length === 0 ? (
            <Paper sx={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <EmptyState
                icon={<RentalsIcon />}
                title="No hay rentas registradas"
                subtitle="Crea una nueva renta para empezar"
              />
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {rentals.map((rental) => (
                <Card
                  key={rental.id}
                  onClick={() => navigate(`/rentals/${rental.id}`)}
                  sx={{
                    cursor: 'pointer',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: 2,
                    transition: 'transform 0.15s, border-color 0.15s',
                    '&:hover': {
                      borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6',
                    },
                    '&:active': { transform: 'scale(0.98)' }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header: Código + Estado + Menú */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="700" sx={{ color: isDarkMode ? '#a78bfa' : '#8b5cf6' }}>
                          {rental.rental_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rental.days} días
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusChip(rental.status)}
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleMenuClick(e, rental); }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

                    {/* Info Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Cliente
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          {rental.customer?.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Vehículo
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          {rental.vehicle?.make} {rental.vehicle?.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rental.vehicle?.license_plate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Fechas
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Total
                        </Typography>
                        <Typography variant="body2" fontWeight="700" sx={{ color: themeStyles.status.success.main }}>
                          {formatCurrency(rental.total_amount)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* Pagination móvil simplificada */}
          {pagination.pages > 1 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <TablePagination
                component="div"
                count={pagination.total}
                page={filters.page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={filters.limit}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50]}
                labelRowsPerPage=""
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{
                  '& .MuiTablePagination-toolbar': { pl: 0, pr: 0 },
                  '& .MuiTablePagination-selectLabel': { display: 'none' },
                  '& .MuiTablePagination-select': { display: 'none' }
                }}
              />
            </Box>
          )}
        </Box>
      ) : (
        /* Vista de Tabla para desktop */
        <TableContainer
          component={Paper}
          sx={{
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            overflowX: 'auto'
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Cliente</strong></TableCell>
                <TableCell><strong>Vehículo</strong></TableCell>
                <TableCell><strong>Fechas</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 0, border: 'none' }}>
                    <EmptyState
                      icon={<RentalsIcon />}
                      title="No hay rentas registradas"
                      subtitle="Crea una nueva renta para empezar"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rentals.map((rental) => (
                  <TableRow
                    key={rental.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/rentals/${rental.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {rental.rental_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {rental.customer?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rental.customer?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {rental.vehicle?.make} {rental.vehicle?.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rental.vehicle?.license_plate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(rental.start_date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(rental.end_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {formatCurrency(rental.total_amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rental.days} días
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(rental.status)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, rental);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <TablePagination
              component="div"
              count={pagination.total}
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

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { navigate(`/rentals/${selectedRental?.id}`); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" /> Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/rentals/${selectedRental?.id}/edit`); handleMenuClose(); }}>
          Editar
        </MenuItem>
        {selectedRental?.status === 'active' && (
          <MenuItem onClick={() => { navigate(`/returns/new?rental=${selectedRental?.id}`); handleMenuClose(); }}>
            Completar Renta
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Rentals;
