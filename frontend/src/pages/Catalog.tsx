/**
 * Catalog — Vista de catálogo de equipos/vehículos para el equipo de ventas.
 * Read-only, orientado a presentación comercial con cards visuales.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TablePagination,
  Stack,
  Chip,
  CircularProgress,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Storefront as CatalogIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  DirectionsCar as CarIcon,
  Category as TypeIcon,
  AttachMoney as MoneyIcon,
  Clear as ClearIcon,
  ArrowUpward as SortAscIcon,
  ArrowDownward as SortDescIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import { StyledKPI } from '../components/styled';
import CatalogCard from '../components/catalog/CatalogCard';
import EmptyState from '../components/common/EmptyState';
import vehicleService from '../services/vehicleService';
import { locationService } from '../services/locationService';
import { Vehicle, VehicleType, VehicleStatus, VehicleCondition } from '../types';

// ── Sort options ──────────────────────────────────
const SORT_OPTIONS = [
  { value: 'daily_rate', label: 'Precio' },
  { value: 'year', label: 'Año' },
  { value: 'mileage', label: 'Kilometraje' },
  { value: 'make', label: 'Marca' },
];

const Catalog: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const styles = useThemeStyles();
  const { formatCurrency } = useCurrency();
  const { selectedLocationId } = useLocationContext();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // ── Data state ────────────────────────────────────
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [stats, setStats] = useState<{ available: number; rented: number; maintenance: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // ── Filter state ──────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState(selectedLocationId ? String(selectedLocationId) : '');
  const [conditionFilter, setConditionFilter] = useState('');
  const [sortBy, setSortBy] = useState('daily_rate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Load reference data once ──────────────────────
  useEffect(() => {
    const loadRef = async () => {
      const [typesRes, locRes, statsRes] = await Promise.allSettled([
        vehicleService.getVehicleTypes(),
        locationService.getLocationsDropdown(),
        vehicleService.getStatistics(),
      ]);
      if (typesRes.status === 'fulfilled') setVehicleTypes(typesRes.value.data || []);
      if (locRes.status === 'fulfilled') setLocations(locRes.value.data || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data || null);
    };
    loadRef();
  }, []);

  // ── Load vehicles ─────────────────────────────────
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vehicleService.getAll({
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        filters: {
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter as VehicleStatus }),
          ...(typeFilter && { vehicle_type_id: Number(typeFilter) }),
          ...(locationFilter && { location_id: Number(locationFilter) }),
          ...(conditionFilter && { condition: conditionFilter as VehicleCondition }),
        },
      });
      setVehicles(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch {
      enqueueSnackbar('Error al cargar vehículos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, search, statusFilter, typeFilter, locationFilter, conditionFilter, enqueueSnackbar]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  // ── Search debounce ───────────────────────────────
  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(0);
    }, 300);
  };

  useEffect(() => {
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, []);

  // ── Sort toggle ───────────────────────────────────
  const handleSortToggle = () => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');

  // ── Clear filters ─────────────────────────────────
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setLocationFilter('');
    setConditionFilter('');
    setSortBy('daily_rate');
    setSortOrder('ASC');
    setPage(0);
  };

  const hasActiveFilters = search || statusFilter || typeFilter || locationFilter || conditionFilter;

  // ── Ficha PDF download ────────────────────────────
  const handleDownloadFicha = async (id: number) => {
    try {
      const blob = await vehicleService.downloadFicha(id);
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      const vehicle = vehicles.find(v => v.id === id);
      link.download = `ficha-tecnica-${vehicle?.license_plate || id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('Ficha técnica descargada', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al descargar ficha técnica', { variant: 'error' });
    }
  };

  // ── Compute avg daily rate from loaded page ───────
  const avgRate = vehicles.length > 0
    ? vehicles.reduce((sum, v) => sum + (v.daily_rate || 0), 0) / vehicles.length
    : 0;

  // ── Render ────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '14px',
            background: `linear-gradient(135deg, ${alpha('#8b5cf6', 0.2)}, ${alpha('#3b82f6', 0.2)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CatalogIcon sx={{ color: '#8b5cf6', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: styles.text.headingStrong }}>
              Catálogo de Equipos
            </Typography>
            <Typography variant="caption" sx={{ color: styles.text.muted }}>
              {totalCount} vehículo{totalCount !== 1 ? 's' : ''} en la flota
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: styles.responsive.gridKpi, gap: 2, mb: 3 }}>
        <StyledKPI
          label="Disponibles"
          value={stats?.available ?? '-'}
          subtitle={`de ${stats?.total ?? '-'} total`}
          color="#10b981"
          icon={<CarIcon />}
        />
        <StyledKPI
          label="Tipos en Flota"
          value={vehicleTypes.length}
          subtitle="categorías"
          color="#3b82f6"
          icon={<TypeIcon />}
        />
        <StyledKPI
          label="Tarifa Promedio"
          value={avgRate > 0 ? formatCurrency(avgRate) : '-'}
          subtitle="por día"
          color="#8b5cf6"
          icon={<MoneyIcon />}
        />
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: '16px',
          background: styles.isDarkMode ? 'rgba(6, 11, 40, 0.6)' : 'rgba(0, 0, 0, 0.02)',
          border: `1px solid ${styles.border.subtle}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          {/* Search */}
          <TextField
            placeholder="Buscar marca, modelo, placa..."
            size="small"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: styles.text.muted, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 220,
              flex: { xs: 1, md: 'none' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: styles.isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
              },
            }}
          />

          {/* Type filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={typeFilter}
              label="Tipo"
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="">Todos</MenuItem>
              {vehicleTypes.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Status filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Estado"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="available">Disponible</MenuItem>
              <MenuItem value="rented">Rentado</MenuItem>
              <MenuItem value="maintenance">Mantenimiento</MenuItem>
            </Select>
          </FormControl>

          {/* Location filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Ubicación</InputLabel>
            <Select
              value={locationFilter}
              label="Ubicación"
              onChange={(e) => { setLocationFilter(e.target.value); setPage(0); }}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="">Todas</MenuItem>
              {locations.map(l => (
                <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Condition filter */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Condición</InputLabel>
            <Select
              value={conditionFilter}
              label="Condición"
              onChange={(e) => { setConditionFilter(e.target.value); setPage(0); }}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="excellent">Excelente</MenuItem>
              <MenuItem value="good">Bueno</MenuItem>
              <MenuItem value="fair">Regular</MenuItem>
              <MenuItem value="poor">Malo</MenuItem>
            </Select>
          </FormControl>

          {/* Sort */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Ordenar</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar"
                onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
                sx={{ borderRadius: '12px' }}
              >
                {SORT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Tooltip title={sortOrder === 'ASC' ? 'Ascendente' : 'Descendente'}>
              <IconButton size="small" onClick={handleSortToggle} sx={{ color: styles.text.secondary }}>
                {sortOrder === 'ASC' ? <SortAscIcon fontSize="small" /> : <SortDescIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Clear + View toggle */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: { md: 'auto' } }}>
            {hasActiveFilters && (
              <Chip
                label="Limpiar"
                size="small"
                onDelete={handleClearFilters}
                deleteIcon={<ClearIcon />}
                sx={{ height: 28, fontSize: '0.75rem' }}
              />
            )}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '10px',
                  px: 1.2,
                  border: `1px solid ${styles.border.subtle}`,
                  color: styles.text.muted,
                  '&.Mui-selected': { color: '#8b5cf6', background: alpha('#8b5cf6', 0.1) },
                },
              }}
            >
              <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="list"><ListViewIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#8b5cf6' }} />
        </Box>
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          subtitle={hasActiveFilters ? 'No se encontraron vehículos con los filtros aplicados.' : 'No hay vehículos registrados en el sistema.'}
          icon={<CarIcon sx={{ fontSize: 48 }} />}
        />
      ) : (
        <>
          {/* Vehicle grid/list */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'list'
                ? '1fr'
                : {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                  },
              gap: 2.5,
              mb: 2,
            }}
          >
            {vehicles.map((vehicle) => (
              <CatalogCard
                key={vehicle.id}
                vehicle={vehicle}
                onViewDetail={(id) => navigate(`/inventory/${id}`)}
                onDownloadFicha={handleDownloadFicha}
                listView={viewMode === 'list'}
              />
            ))}
          </Box>

          {/* Pagination */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
              p: 1.5,
              borderRadius: '14px',
              background: styles.isDarkMode ? 'rgba(6, 11, 40, 0.6)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${styles.border.subtle}`,
            }}
          >
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[8, 12, 20, 40]}
              labelRowsPerPage={isMobile ? '' : 'Por página:'}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                color: styles.text.secondary,
                '& .MuiTablePagination-select': { borderRadius: '8px' },
              }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default Catalog;
