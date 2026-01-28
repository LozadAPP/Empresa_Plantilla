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
  Select
} from '@mui/material';
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
  Clear as ClearIcon
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchRentals } from '../store/slices/rentalSlice';
import { RentalStatus } from '../types/rental';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import TableSkeleton from '../components/common/TableSkeleton';
import { exportToCSV, RENTALS_COLUMNS } from '../utils/exportCSV';
import { formatDate, formatCurrency } from '../utils/formatters';

const Rentals: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();

  const { rentals, loading, error, pagination } = useSelector((state: RootState) => state.rentals);

  const [filters, setFilters] = useState({
    status: '' as RentalStatus | '',
    search: '',
    startDate: '',
    endDate: '',
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

  // Handler para limpiar filtros de fecha
  const handleClearDateFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, startDate: '', endDate: '', page: 1 }));
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
        sx={{ fontWeight: 500 }}
      />
    );
  }, [STATUS_CONFIGS]);

  // Calculate stats (memoizado para evitar recálculos innecesarios)
  const stats = useMemo(() => ({
    total: rentals.length,
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
          Rentas
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Gestiona todas las rentas de vehículos
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        {[
          { id: 'total', label: 'Total Rentas', value: stats.total, color: '#8b5cf6', icon: <RentalsIcon /> },
          { id: 'active', label: 'Activas', value: stats.active, color: '#10b981', icon: <ActiveIcon /> },
          { id: 'completed', label: 'Completadas', value: stats.completed, color: '#6b7280', icon: <CompletedIcon /> },
          { id: 'overdue', label: 'Vencidas', value: stats.overdue, color: '#f59e0b', icon: <OverdueIcon /> }
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

      {/* Actions Bar - Row 1: Search and Status */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          id="rentals-search"
          placeholder="Buscar por código, cliente, vehículo..."
          size="small"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ flexGrow: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          aria-label="Buscar rentas por código, cliente o vehículo"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filters.status}
            label="Estado"
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="active">Activas</MenuItem>
            <MenuItem value="reserved">Reservadas</MenuItem>
            <MenuItem value="completed">Completadas</MenuItem>
            <MenuItem value="overdue">Vencidas</MenuItem>
            <MenuItem value="cancelled">Canceladas</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/rentals/new')}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          Nueva Renta
        </Button>
      </Box>

      {/* Actions Bar - Row 2: Date Filters and Export */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          id="rentals-start-date"
          label="Fecha Inicio"
          type="date"
          size="small"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          sx={{ minWidth: 160 }}
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
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
          aria-label="Filtrar por fecha de fin"
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
          disabled={rentals.length === 0}
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
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <RentalsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay rentas registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Crea una nueva renta para empezar
                  </Typography>
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
                      {rental.customer?.first_name} {rental.customer?.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.customer?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {rental.vehicle?.brand} {rental.vehicle?.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rental.vehicle?.plate}
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

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { navigate(`/rentals/${selectedRental?.id}`); handleMenuClose(); }}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" /> Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/rentals/${selectedRental?.id}/edit`); handleMenuClose(); }}>
          Editar
        </MenuItem>
        {selectedRental?.status === 'active' && (
          <MenuItem onClick={handleMenuClose}>
            Completar Renta
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Rentals;
