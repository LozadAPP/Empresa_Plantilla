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
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  Menu
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
  Schedule as LateIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { fetchReturns } from '../store/slices/returnSlice';
import { VehicleCondition } from '../types/return';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import TableSkeleton from '../components/common/TableSkeleton';
import EmptyState from '../components/common/EmptyState';
import { exportToCSV, RETURNS_COLUMNS } from '../utils/exportCSV';
import { formatDateTime } from '../utils/formatters';
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

const Returns: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const themeStyles = useThemeStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { returns, loading, error, pagination } = useSelector((state: RootState) => state.returns);

  // Mobile menu state for actions
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRentalId, setSelectedRentalId] = useState<number | null>(null);

  const defaultDates = getDefaultDates();
  const [filters, setFilters] = useState({
    condition: '' as VehicleCondition | '',
    on_time: '' as 'true' | 'false' | '',
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

  // Mobile menu handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, rentalId: number) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedRentalId(rentalId);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
    setSelectedRentalId(null);
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
      <Box sx={{ p: { xs: 0, sm: 3 } }}>
        {/* Header skeleton */}
        <Box sx={{ mb: { xs: 2, sm: 4 } }}>
          <Box
            sx={{
              height: { xs: 24, sm: 32 },
              width: { xs: 120, sm: 160 },
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
        mb: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 2, sm: 0 }
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
            Devoluciones
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Historial de devoluciones de vehículos
          </Typography>
        </Box>
        {/* Export button in header for mobile */}
        {isMobile && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={returns.length === 0}
            fullWidth
            sx={{
              borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              '&:hover': {
                borderColor: isDarkMode ? '#a78bfa' : '#8b5cf6',
                color: isDarkMode ? '#a78bfa' : '#8b5cf6'
              }
            }}
          >
            Exportar CSV
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3, md: 4 }
      }}>
        {[
          { id: 'total', label: 'Total', fullLabel: 'Total Devoluciones', value: stats.total, color: themeStyles.purple.main, icon: <ReturnsIcon /> },
          { id: 'onTime', label: 'A Tiempo', fullLabel: 'A Tiempo', value: stats.onTime, color: themeStyles.status.success.main, icon: <OnTimeIcon /> },
          { id: 'late', label: 'Tardías', fullLabel: 'Tardías', value: stats.late, color: themeStyles.status.warning.main, icon: <LateIcon /> },
          { id: 'withPenalty', label: 'Penalidad', fullLabel: 'Con Penalidad', value: stats.withPenalty, color: themeStyles.status.error.main, icon: <WarningIcon /> }
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
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
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
          id="returns-search"
          placeholder={isMobile ? "Buscar..." : "Buscar por código, renta, vehículo, placa..."}
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
          aria-label="Buscar devoluciones"
        />

        <Box sx={{
          display: 'flex',
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', md: 'auto' }
        }}>
          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 150 }, flex: { xs: 1, md: 'none' } }}>
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

          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 140 }, flex: { xs: 1, md: 'none' } }}>
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
      </Box>

      {/* Filters Row 2: Date filters and Export */}
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
            id="returns-start-date"
            label="Fecha Desde"
            type="date"
            size="small"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            sx={{ minWidth: { xs: 0, sm: 160 }, flex: { xs: 1, sm: 'none' } }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            id="returns-end-date"
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
              disabled={returns.length === 0}
              sx={{
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                '&:hover': {
                  borderColor: isDarkMode ? '#a78bfa' : '#8b5cf6',
                  color: isDarkMode ? '#a78bfa' : '#8b5cf6'
                }
              }}
            >
              Exportar CSV
            </Button>
          </>
        )}
      </Box>

      {/* Mobile Card View */}
      {isMobile ? (
        <Box>
          {returns.length === 0 ? (
            <EmptyState
              icon={<ReturnsIcon />}
              title="No hay devoluciones registradas"
              subtitle="Las devoluciones aparecerán aquí cuando se completen rentas"
            />
          ) : (
            <Stack spacing={1.5}>
              {returns.map((returnRecord) => (
                <Card
                  key={returnRecord.id}
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
                  onClick={() => navigate(`/rentals/${returnRecord.rental_id}`)}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header: Code + Status + Menu */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#8b5cf6' }}>
                          {returnRecord.return_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Renta: {returnRecord.rental?.rental_code || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {returnRecord.is_on_time ? (
                          <Chip
                            label="A tiempo"
                            color="success"
                            size="small"
                            icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                            sx={{ height: 24, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                          />
                        ) : (
                          <Chip
                            label={`${returnRecord.days_late}d tarde`}
                            color="error"
                            size="small"
                            icon={<CancelIcon sx={{ fontSize: 14 }} />}
                            sx={{
                              height: 24,
                              '& .MuiChip-label': { px: 1, fontSize: '0.7rem' },
                              '@keyframes chipPulse': {
                                '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.3)' },
                                '50%': { boxShadow: '0 0 0 4px rgba(239, 68, 68, 0)' },
                              },
                              animation: 'chipPulse 2s ease-in-out infinite',
                            }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, returnRecord.rental_id)}
                          sx={{ ml: 0.5 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }} />

                    {/* Vehicle Info */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="body2" fontWeight="500">
                        {returnRecord.vehicle?.brand} {returnRecord.vehicle?.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {returnRecord.vehicle?.plate}
                      </Typography>
                    </Box>

                    {/* Grid 2x2 with main data */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Fecha
                        </Typography>
                        <Typography variant="body2" fontSize="0.8rem">
                          {formatDateTime(returnRecord.return_date)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Condición
                        </Typography>
                        {getConditionChip(returnRecord.vehicle_condition)}
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                          Penalidades
                        </Typography>
                        <Typography variant="body2" fontWeight="600" fontSize="0.8rem">
                          {formatCurrency(returnRecord.total_penalty || 0)}
                        </Typography>
                      </Box>
                      {returnRecord.total_penalty && returnRecord.total_penalty > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                            Detalle
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {returnRecord.late_fee && returnRecord.late_fee > 0 && `Retraso: ${formatCurrency(returnRecord.late_fee)}`}
                            {returnRecord.late_fee && returnRecord.late_fee > 0 && returnRecord.damage_cost && returnRecord.damage_cost > 0 && ' | '}
                            {returnRecord.damage_cost && returnRecord.damage_cost > 0 && `Daños: ${formatCurrency(returnRecord.damage_cost)}`}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* Mobile Pagination */}
          {pagination.pages > 1 && (
            <TablePagination
              component="div"
              count={pagination.total}
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
                if (selectedRentalId) {
                  navigate(`/rentals/${selectedRentalId}`);
                }
                handleMenuClose();
              }}
              sx={{ gap: 1.5 }}
            >
              <ViewIcon fontSize="small" />
              Ver Renta
            </MenuItem>
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
                  <TableCell colSpan={8} align="center" sx={{ py: 0 }}>
                    <EmptyState
                      icon={<ReturnsIcon />}
                      title="No hay devoluciones registradas"
                      subtitle="Las devoluciones aparecerán aquí cuando se completen rentas"
                    />
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
                          sx={{
                            '@keyframes chipPulse': {
                              '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.3)' },
                              '50%': { boxShadow: '0 0 0 4px rgba(239, 68, 68, 0)' },
                            },
                            animation: 'chipPulse 2s ease-in-out infinite',
                          }}
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

          {/* Desktop Pagination */}
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
    </Box>
  );
};

export default Returns;
