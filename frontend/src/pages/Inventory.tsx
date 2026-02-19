import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  DirectionsCar as CarIcon,
  Build as MaintenanceIcon,
  CheckCircle as AvailableIcon,
  Info as RentedIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';
import { locationService, LocationDropdown } from '../services/locationService';
import { Vehicle, VehicleStatus, VehicleFilters, Pagination, VehicleFormData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { StyledKPI, StyledSection } from '../components/styled';
import VehicleForm from '../components/forms/VehicleForm';
import EmptyState from '../components/common/EmptyState';

const statusColors: Record<VehicleStatus, 'success' | 'info' | 'warning'> = {
  available: 'success',
  rented: 'info',
  maintenance: 'warning'
};

const statusLabels: Record<VehicleStatus, string> = {
  available: 'Disponible',
  rented: 'Rentado',
  maintenance: 'Mantenimiento'
};

const getConditionColor = (condition: string): 'success' | 'info' | 'warning' => {
  if (condition === 'excellent') return 'success';
  if (condition === 'good') return 'info';
  return 'warning';
};

const Inventory: React.FC = () => {
  const { hasAnyRole } = useAuth();
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const canEdit = hasAnyRole('admin', 'director_general', 'jefe_inventarios', 'encargado_inventario');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });

  // Global statistics (Fase 2.4 - estadísticas globales, no por página)
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    maintenance: 0
  });

  // Locations for dropdown
  const [locations, setLocations] = useState<LocationDropdown[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [yearFilter, setYearFilter] = useState<{ min?: number; max?: number }>({});
  const [mileageFilter, setMileageFilter] = useState<{ min?: number; max?: number }>({});
  const [locationFilter, setLocationFilter] = useState<number | ''>('');
  const [typeFilter, setTypeFilter] = useState<number | ''>('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // View Dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Vehicle>>({});
  const [editLoading, setEditLoading] = useState(false);

  // Create/Edit Dialog (unified with VehicleForm)
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  useEffect(() => {
    locationService.getLocationsDropdown()
      .then(res => { if (res.data) setLocations(res.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [pagination.page, pagination.limit, statusFilter, yearFilter, mileageFilter, locationFilter, typeFilter, conditionFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        fetchVehicles();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch global statistics on mount and when filters change (Fase 2.4)
  useEffect(() => {
    fetchGlobalStatistics();
  }, [statusFilter, locationFilter, typeFilter, conditionFilter]);

  const fetchGlobalStatistics = async () => {
    try {
      const response = await vehicleService.getStatistics(locationFilter as number | undefined);
      if (response.success && response.data) {
        setGlobalStats({
          total: response.data.total,
          available: response.data.available,
          rented: response.data.rented,
          maintenance: response.data.maintenance
        });
      }
    } catch (error) {
      console.error('Error fetching global statistics:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const filters: VehicleFilters = {};
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (yearFilter.min) filters.minYear = yearFilter.min;
      if (yearFilter.max) filters.maxYear = yearFilter.max;
      if (mileageFilter.min) filters.minMileage = mileageFilter.min;
      if (mileageFilter.max) filters.maxMileage = mileageFilter.max;
      if (locationFilter) filters.location_id = locationFilter as number;
      if (typeFilter) filters.vehicle_type_id = typeFilter as number;
      if (conditionFilter) filters.condition = conditionFilter as any;

      const response = await vehicleService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
        filters
      });

      if (response.success) {
        setVehicles(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError('Error al cargar vehículos');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination((prev) => ({ ...prev, limit: Number.parseInt(event.target.value, 10), page: 1 }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, vehicle: Vehicle) => {
    setAnchorEl(event.currentTarget);
    setSelectedVehicle(vehicle);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleStatusChange = async (newStatus: VehicleStatus) => {
    if (!selectedVehicle) return;
    try {
      await vehicleService.updateStatus(selectedVehicle.id, newStatus);
      fetchVehicles();
    } catch (err) {
      setError('Error al actualizar estado');
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    if (!globalThis.confirm(`¿Eliminar vehículo ${selectedVehicle.make} ${selectedVehicle.model}?`)) return;
    try {
      await vehicleService.delete(selectedVehicle.id);
      fetchVehicles();
      handleMenuClose();
      enqueueSnackbar('Vehículo eliminado correctamente', { variant: 'success' });
    } catch (err: any) {
      // Extraer mensaje específico del error del backend
      const errorMsg = err.response?.data?.message || 'Error al eliminar vehículo';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      handleMenuClose();
    }
  };

  // Edit functions (now using unified VehicleForm)
  const handleEdit = () => {
    if (!selectedVehicle) return;
    setVehicleToEdit(selectedVehicle);
    setCreateDialogOpen(true); // Reusing same dialog for edit
    handleMenuClose();
  };

  const handleEditChange = (field: keyof Vehicle, value: string | number) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!selectedVehicle) return;
    setEditLoading(true);
    try {
      await vehicleService.update(selectedVehicle.id, editFormData);
      setEditDialogOpen(false);
      fetchVehicles();
      setError(null);
    } catch (err) {
      setError('Error al actualizar vehículo');
    } finally {
      setEditLoading(false);
    }
  };

  // Create functions (now handles both create and update)
  const handleCreateClick = () => {
    setVehicleToEdit(null); // Clear edit mode
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (data: VehicleFormData, vehicleId?: number) => {
    setCreateLoading(true);
    try {
      if (vehicleId) {
        // Update existing vehicle
        await vehicleService.update(vehicleId, data);
      } else {
        // Create new vehicle
        await vehicleService.create(data);
      }
      setCreateDialogOpen(false);
      setVehicleToEdit(null);
      fetchVehicles();
      fetchGlobalStatistics(); // Refresh stats after create/update
      setError(null);
    } catch (err) {
      setError(vehicleId ? 'Error al actualizar vehículo' : 'Error al crear vehículo');
      throw err; // Re-throw to let form handle it
    } finally {
      setCreateLoading(false);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setYearFilter({});
    setMileageFilter({});
    setLocationFilter('');
    setTypeFilter('');
    setConditionFilter('');
  };

  // Handle sorting by column
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle order
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  // Export to Excel (CSV format)
  const handleExportToExcel = () => {
    // Prepare CSV data
    const headers = ['ID', 'Marca', 'Modelo', 'Año', 'Placa', 'VIN', 'Color', 'Estado', 'Condición', 'Kilometraje', 'Precio Compra', 'Valor Actual'];
    const rows = vehicles.map(v => [
      v.id,
      v.make,
      v.model,
      v.year,
      v.license_plate,
      v.vin,
      v.color || '',
      statusLabels[v.status],
      v.condition,
      v.mileage,
      v.purchase_price,
      v.current_value
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_vehiculos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats are now fetched globally from backend (Fase 2.4)
  // Removed local calculation that only counted current page

  if (loading && vehicles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
            variant="h2"
            sx={{
              mb: 0.5,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}
          >
            Inventario de Vehículos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Gestión completa de la flota vehicular
          </Typography>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            fullWidth={isMobile}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              py: { xs: 1.25, sm: 1 }
            }}
          >
            {isMobile ? 'Agregar' : 'Agregar Vehículo'}
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StyledKPI
          icon={<CarIcon />}
          label="Total Vehículos"
          value={globalStats.total}
          subtitle="en la flota"
          color="#8b5cf6"
        />
        <StyledKPI
          icon={<AvailableIcon />}
          label="Disponibles"
          value={globalStats.available}
          subtitle="listos para rentar"
          color="#10b981"
        />
        <StyledKPI
          icon={<RentedIcon />}
          label="Rentados"
          value={globalStats.rented}
          subtitle="actualmente en uso"
          color="#3b82f6"
        />
        <StyledKPI
          icon={<MaintenanceIcon />}
          label="Mantenimiento"
          value={globalStats.maintenance}
          subtitle="en servicio"
          color="#f59e0b"
        />
      </Box>

      {/* Tabla de Vehículos */}
      <StyledSection
        title="Lista de Vehículos"
        subtitle={`${pagination.total} vehículos en total`}
        action={
          canEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                bgcolor: isDarkMode ? '#a78bfa' : '#8b5cf6',
                color: '#fff',
                '&:hover': {
                  bgcolor: isDarkMode ? '#8b5cf6' : '#7c3aed'
                }
              }}
            >
              Nuevo Vehículo
            </Button>
          ) : undefined
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Filters Bar - Responsive */}
        <Box sx={{ mb: 3 }}>
          {/* Basic Filters Row */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 1.5, md: 2 },
            mb: 2,
            alignItems: { xs: 'stretch', md: 'center' }
          }}>
            <TextField
              placeholder={isMobile ? "Buscar..." : "Buscar por modelo, placa, color, VIN..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{
                flexGrow: 1,
                minWidth: { xs: 'auto', md: 300 }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'row', md: 'row' },
              gap: 1,
              flexWrap: 'wrap'
            }}>
              <FormControl size="small" sx={{ minWidth: { xs: 'calc(50% - 4px)', sm: 150 }, flex: { xs: 1, sm: 'none' } }}>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | '')}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="available">Disponible</MenuItem>
                  <MenuItem value="rented">Rentado</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant={showAdvancedFilters ? "contained" : "outlined"}
                startIcon={!isMobile && <TuneIcon />}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                size="small"
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  minWidth: { xs: 'auto', sm: 'auto' },
                  flex: { xs: 1, sm: 'none' }
                }}
              >
                {isMobile ? <TuneIcon /> : 'Filtros'}
              </Button>
            </Box>

            <Box sx={{
              display: 'flex',
              gap: 1,
              ml: { xs: 0, md: 'auto' },
              justifyContent: { xs: 'space-between', md: 'flex-end' }
            }}>
              <Button
                variant="outlined"
                startIcon={!isMobile && <ClearIcon />}
                onClick={handleClearFilters}
                size="small"
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  flex: { xs: 1, md: 'none' }
                }}
              >
                {isMobile ? <ClearIcon /> : 'Limpiar'}
              </Button>
              <Button
                variant="outlined"
                startIcon={!isMobile && <ExportIcon />}
                onClick={handleExportToExcel}
                size="small"
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  flex: { xs: 1, md: 'none' }
                }}
                disabled={vehicles.length === 0}
              >
                {isMobile ? <ExportIcon /> : 'Exportar'}
              </Button>
            </Box>
          </Box>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                borderRadius: '12px',
                bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.02)'
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon sx={{ fontSize: 18 }} />
                Filtros Avanzados
              </Typography>

              <Grid container spacing={2}>
                {/* Year Range */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                    Rango de Año
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Desde"
                      type="number"
                      size="small"
                      value={yearFilter.min || ''}
                      onChange={(e) => setYearFilter(prev => ({ ...prev, min: e.target.value ? parseInt(e.target.value) : undefined }))}
                      inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                    />
                    <TextField
                      label="Hasta"
                      type="number"
                      size="small"
                      value={yearFilter.max || ''}
                      onChange={(e) => setYearFilter(prev => ({ ...prev, max: e.target.value ? parseInt(e.target.value) : undefined }))}
                      inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                    />
                  </Box>
                </Grid>

                {/* Mileage Range */}
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                    Kilometraje
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Mínimo"
                      type="number"
                      size="small"
                      value={mileageFilter.min || ''}
                      onChange={(e) => setMileageFilter(prev => ({ ...prev, min: e.target.value ? parseInt(e.target.value) : undefined }))}
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      label="Máximo"
                      type="number"
                      size="small"
                      value={mileageFilter.max || ''}
                      onChange={(e) => setMileageFilter(prev => ({ ...prev, max: e.target.value ? parseInt(e.target.value) : undefined }))}
                      inputProps={{ min: 0 }}
                    />
                  </Box>
                </Grid>

                {/* Condition */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Condición</InputLabel>
                    <Select
                      value={conditionFilter}
                      label="Condición"
                      onChange={(e) => setConditionFilter(e.target.value)}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      <MenuItem value="excellent">Excelente</MenuItem>
                      <MenuItem value="good">Buena</MenuItem>
                      <MenuItem value="fair">Regular</MenuItem>
                      <MenuItem value="poor">Mala</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Location */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Ubicación</InputLabel>
                    <Select
                      value={locationFilter}
                      label="Ubicación"
                      onChange={(e) => setLocationFilter(e.target.value as number | '')}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {locations.map(loc => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>

        {/* Mobile Cards View */}
        {isMobile ? (
          <Box>
            {vehicles.length === 0 ? (
              <EmptyState
                icon={<CarIcon />}
                title="No se encontraron vehículos"
                subtitle="Agrega un nuevo vehículo para empezar"
              />
            ) : (
              <Stack spacing={1.5}>
                {vehicles.map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                      borderRadius: '12px',
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Header: Modelo + Acciones */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={600} noWrap>
                            {vehicle.make} {vehicle.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vehicle.license_plate} • {vehicle.year}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={statusLabels[vehicle.status]}
                            color={statusColors[vehicle.status]}
                            size="small"
                          />
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, vehicle)}>
                            <MoreIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }} />

                      {/* Detalles en grid */}
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Valor
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${vehicle.current_value?.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Condición
                          </Typography>
                          <Chip
                            label={vehicle.condition}
                            size="small"
                            variant="outlined"
                            color={getConditionColor(vehicle.condition)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Ubicación
                          </Typography>
                          <Typography variant="body2">
                            {vehicle.location?.name || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Tipo
                          </Typography>
                          <Typography variant="body2">
                            {vehicle.vehicleType?.name || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Pagination for Mobile */}
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={handleChangePage}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage=""
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                '.MuiTablePagination-selectLabel': { display: 'none' },
                '.MuiTablePagination-select': { display: 'none' },
                '.MuiTablePagination-selectIcon': { display: 'none' },
              }}
            />
          </Box>
        ) : (
          /* Desktop Table View */
          <TableContainer sx={{ border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('make')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">Modelo</Typography>
                      {sortBy === 'make' && (sortOrder === 'ASC' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('license_plate')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">Placa</Typography>
                      {sortBy === 'license_plate' && (sortOrder === 'ASC' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('year')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">Año</Typography>
                      {sortBy === 'year' && (sortOrder === 'ASC' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight="600">Color</Typography></TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('status')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">Estado</Typography>
                      {sortBy === 'status' && (sortOrder === 'ASC' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight="600">Ubicación</Typography></TableCell>
                  <TableCell
                    align="right"
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('current_value')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Typography variant="body2" fontWeight="600">Valor</Typography>
                      {sortBy === 'current_value' && (sortOrder === 'ASC' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('condition')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2" fontWeight="600">Condición</Typography>
                      {sortBy === 'condition' && (sortOrder === 'ASC' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />)}
                    </Box>
                  </TableCell>
                  <TableCell align="center"><Typography variant="body2" fontWeight="600">Acciones</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 0, border: 'none' }}>
                      <EmptyState
                        icon={<CarIcon />}
                        title="No se encontraron vehículos"
                        subtitle="Agrega un nuevo vehículo para empezar"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {vehicle.make} {vehicle.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.vehicleType?.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{vehicle.license_plate}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{vehicle.year}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{vehicle.color || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[vehicle.status]}
                          color={statusColors[vehicle.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{vehicle.location?.name || '-'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="600">
                          ${vehicle.current_value?.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vehicle.condition}
                          size="small"
                          variant="outlined"
                          color={getConditionColor(vehicle.condition)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, vehicle)}>
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              onPageChange={handleChangePage}
              rowsPerPage={pagination.limit}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </TableContainer>
        )}
      </StyledSection>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" /> Ver Detalles
        </MenuItem>
        {canEdit && (
          <>
            <MenuItem onClick={handleEdit}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" /> Editar
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('available')} disabled={selectedVehicle?.status === 'available'}>
              Marcar Disponible
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('maintenance')} disabled={selectedVehicle?.status === 'maintenance'}>
              Enviar a Mantenimiento
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Eliminar
            </MenuItem>
          </>
        )}
      </Menu>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Vehículo
        </DialogTitle>
        <DialogContent dividers>
          {selectedVehicle && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Modelo</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.year}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Placa</Typography>
                <Typography variant="body1" gutterBottom>{selectedVehicle.license_plate}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">VIN</Typography>
                <Typography variant="body1" gutterBottom>{selectedVehicle.vin}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Color</Typography>
                <Typography variant="body1" gutterBottom>{selectedVehicle.color || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Tipo</Typography>
                <Typography variant="body1" gutterBottom>{selectedVehicle.vehicleType?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Ubicación</Typography>
                <Typography variant="body1" gutterBottom>{selectedVehicle.location?.name || '-'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Valor de Compra</Typography>
                <Typography variant="body1" gutterBottom>${selectedVehicle.purchase_price?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Valor Actual</Typography>
                <Typography variant="body1" gutterBottom>${selectedVehicle.current_value?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Kilometraje</Typography>
                <Typography variant="body1" gutterBottom>{selectedVehicle.mileage?.toLocaleString()} km</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Condición</Typography>
                <Chip label={selectedVehicle.condition} size="small" color={getConditionColor(selectedVehicle.condition)} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Editar Vehículo
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Marca"
                value={editFormData.make || ''}
                onChange={(e) => handleEditChange('make', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Modelo"
                value={editFormData.model || ''}
                onChange={(e) => handleEditChange('model', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Año"
                type="number"
                value={editFormData.year || ''}
                onChange={(e) => handleEditChange('year', parseInt(e.target.value, 10))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Placa"
                value={editFormData.license_plate || ''}
                onChange={(e) => handleEditChange('license_plate', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="VIN"
                value={editFormData.vin || ''}
                onChange={(e) => handleEditChange('vin', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Color"
                value={editFormData.color || ''}
                onChange={(e) => handleEditChange('color', e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Kilometraje"
                type="number"
                value={editFormData.mileage || ''}
                onChange={(e) => handleEditChange('mileage', parseInt(e.target.value, 10))}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={editFormData.status || ''}
                  label="Estado"
                  onChange={(e) => handleEditChange('status', e.target.value)}
                >
                  <MenuItem value="available">Disponible</MenuItem>
                  <MenuItem value="rented">Rentado</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Condición</InputLabel>
                <Select
                  value={editFormData.condition || ''}
                  label="Condición"
                  onChange={(e) => handleEditChange('condition', e.target.value)}
                >
                  <MenuItem value="excellent">Excelente</MenuItem>
                  <MenuItem value="good">Bueno</MenuItem>
                  <MenuItem value="fair">Regular</MenuItem>
                  <MenuItem value="poor">Malo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={editLoading}
            sx={{ bgcolor: isDarkMode ? '#a78bfa' : '#8b5cf6', '&:hover': { bgcolor: isDarkMode ? '#8b5cf6' : '#7c3aed' } }}
          >
            {editLoading ? <CircularProgress size={20} /> : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Vehicle Dialog (unified) */}
      <VehicleForm
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setVehicleToEdit(null);
        }}
        onSubmit={handleCreateSubmit}
        loading={createLoading}
        initialData={vehicleToEdit || undefined}
        vehicleId={vehicleToEdit?.id}
      />
    </Box>
  );
};

export default Inventory;
