/**
 * Página de Listado de Devoluciones (CHAT 2) - Convertido a Material UI
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
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  AssignmentReturn as ReturnsIcon,
  AccessTime as OnTimeIcon,
  Schedule as LateIcon
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchReturns } from '../store/slices/returnSlice';
import { VehicleCondition } from '../types/return';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import TableSkeleton from '../components/common/TableSkeleton';
import { exportToCSV, RETURNS_COLUMNS } from '../utils/exportCSV';
import { formatDateTime, formatCurrency } from '../utils/formatters';

const Returns: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();

  const { returns, loading, error, pagination } = useSelector((state: RootState) => state.returns);

  const [filters, setFilters] = useState({
    condition: '' as VehicleCondition | '',
    on_time: '' as 'true' | 'false' | '',
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
      condition: filters.condition || undefined,
      on_time: filters.on_time || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    };
    dispatch(fetchReturns(apiFilters));
  }, [dispatch, filters, debouncedSearch]);

  const handleFilterChange = useCallback((key: string, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleExportCSV = useCallback(() => {
    exportToCSV(returns, RETURNS_COLUMNS, 'devoluciones');
  }, [returns]);

  const handleClearDateFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, startDate: '', endDate: '', page: 1 }));
  }, []);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  }, []);

  // Condition chip configuration
  const CONDITION_CONFIGS = useMemo(() => ({
    excellent: { label: 'Excelente', color: 'success' as const },
    good: { label: 'Bueno', color: 'info' as const },
    fair: { label: 'Regular', color: 'warning' as const },
    poor: { label: 'Malo', color: 'error' as const },
    damaged: { label: 'Dañado', color: 'error' as const }
  }), []);

  const getConditionChip = useCallback((condition: VehicleCondition) => {
    const config = CONDITION_CONFIGS[condition] || { label: condition, color: 'default' as const };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  }, [CONDITION_CONFIGS]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: returns.length,
    onTime: returns.filter(r => r.is_on_time).length,
    late: returns.filter(r => !r.is_on_time).length,
    withPenalty: returns.filter(r => (r.total_penalty || 0) > 0).length
  }), [returns]);

  if (loading && returns.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header skeleton */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              height: 32,
              width: 160,
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
          Devoluciones
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Historial de devoluciones de vehículos
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        {[
          { id: 'total', label: 'Total Devoluciones', value: stats.total, color: '#8b5cf6', icon: <ReturnsIcon /> },
          { id: 'onTime', label: 'A Tiempo', value: stats.onTime, color: '#10b981', icon: <OnTimeIcon /> },
          { id: 'late', label: 'Tardías', value: stats.late, color: '#f59e0b', icon: <LateIcon /> },
          { id: 'withPenalty', label: 'Con Penalidad', value: stats.withPenalty, color: '#ef4444', icon: <WarningIcon /> }
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

      {/* Filters Row 1 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          id="returns-search"
          placeholder="Buscar por código, renta, vehículo, placa..."
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
          aria-label="Buscar devoluciones"
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Condición</InputLabel>
          <Select
            value={filters.condition}
            label="Condición"
            onChange={(e) => handleFilterChange('condition', e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="excellent">Excelente</MenuItem>
            <MenuItem value="good">Bueno</MenuItem>
            <MenuItem value="fair">Regular</MenuItem>
            <MenuItem value="poor">Malo</MenuItem>
            <MenuItem value="damaged">Dañado</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={filters.on_time}
            label="Estado"
            onChange={(e) => handleFilterChange('on_time', e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="true">A tiempo</MenuItem>
            <MenuItem value="false">Tardías</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Filters Row 2: Date filters and Export */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          id="returns-start-date"
          label="Fecha Desde"
          type="date"
          size="small"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          id="returns-end-date"
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
          disabled={returns.length === 0}
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
              <TableCell><strong>Renta</strong></TableCell>
              <TableCell><strong>Vehículo</strong></TableCell>
              <TableCell><strong>Fecha Devolución</strong></TableCell>
              <TableCell><strong>Condición</strong></TableCell>
              <TableCell><strong>A Tiempo</strong></TableCell>
              <TableCell><strong>Penalidades</strong></TableCell>
              <TableCell align="right"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <ReturnsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay devoluciones registradas
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Las devoluciones aparecerán aquí cuando se completen rentas
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              returns.map((returnRecord) => (
                <TableRow
                  key={returnRecord.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/rentals/${returnRecord.rental_id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {returnRecord.return_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {returnRecord.rental?.rental_code || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {returnRecord.vehicle?.brand} {returnRecord.vehicle?.model}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {returnRecord.vehicle?.plate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateTime(returnRecord.return_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getConditionChip(returnRecord.vehicle_condition)}
                  </TableCell>
                  <TableCell>
                    {returnRecord.is_on_time ? (
                      <Chip
                        label="Sí"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      />
                    ) : (
                      <Chip
                        label={`No (${returnRecord.days_late} días)`}
                        color="error"
                        size="small"
                        icon={<CancelIcon sx={{ fontSize: 16 }} />}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {formatCurrency(returnRecord.total_penalty || 0)}
                    </Typography>
                    {returnRecord.total_penalty && returnRecord.total_penalty > 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {returnRecord.late_fee && returnRecord.late_fee > 0 && `Retraso: ${formatCurrency(returnRecord.late_fee)}`}
                        {returnRecord.damage_cost && returnRecord.damage_cost > 0 && ` Daños: ${formatCurrency(returnRecord.damage_cost)}`}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/rentals/${returnRecord.rental_id}`);
                      }}
                      sx={{ color: '#8b5cf6' }}
                    >
                      Ver Renta
                    </Button>
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
    </Box>
  );
};

export default Returns;
