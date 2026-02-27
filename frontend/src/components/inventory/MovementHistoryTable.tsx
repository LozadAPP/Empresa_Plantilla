import React, { useState, useEffect } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, TextField, Select, MenuItem, FormControl,
  InputLabel, Chip, IconButton, CircularProgress, Typography, Grid,
  Accordion, AccordionSummary, AccordionDetails, Button
} from '@mui/material';
import {
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import inventoryService from '../../services/inventoryService';
import { InventoryMovement, MovementFilters, Location, ItemCategory } from '../../types/inventory';
import { useSnackbar } from 'notistack';

interface MovementHistoryTableProps {
  refreshKey?: number;
  onViewDetails?: (itemId: string) => void;
}

const MovementHistoryTable: React.FC<MovementHistoryTableProps> = ({ refreshKey, onViewDetails }) => {
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  // Filtros
  const [filters, setFilters] = useState<MovementFilters>({
    movementType: '',
    movementSubtype: '',
    dateFrom: '',
    dateTo: '',
    locationId: undefined,
    categoryId: undefined,
    search: ''
  });

  // Data para filtros
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Cargar ubicaciones y categorías al montar
  useEffect(() => {
    loadFiltersData();
  }, []);

  // Cargar movimientos cuando cambian filtros o paginación
  useEffect(() => {
    loadMovements();
  }, [page, rowsPerPage, filters, refreshKey]);

  const loadFiltersData = async () => {
    setLoadingFilters(true);
    try {
      const [locRes, catRes] = await Promise.all([
        inventoryService.getAllLocations(),
        inventoryService.getAllCategories()
      ]);
      setLocations(locRes.data || []);
      setCategories(catRes.data || []);
    } catch (error: any) {
      enqueueSnackbar('Error al cargar datos de filtros', { variant: 'error' });
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getAllMovements({
        page: page + 1,
        limit: rowsPerPage,
        movementType: filters.movementType || undefined,
        movementSubtype: filters.movementSubtype || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        locationId: filters.locationId || undefined,
        categoryId: filters.categoryId || undefined,
        sortBy: 'movementDate',
        sortOrder: 'DESC'
      });
      setMovements(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cargar el historial', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof MovementFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleClearFilter = (field: keyof MovementFilters) => {
    const clearedValue = (field === 'locationId' || field === 'categoryId') ? undefined : '';
    handleFilterChange(field, clearedValue);
  };

  const handleClearAllFilters = () => {
    setFilters({
      movementType: '',
      movementSubtype: '',
      dateFrom: '',
      dateTo: '',
      locationId: undefined,
      categoryId: undefined,
      search: ''
    });
    setPage(0);
  };

  const handleDownloadDocument = async (movement: InventoryMovement) => {
    try {
      const response = await inventoryService.downloadMovementDocument(movement.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${movement.movementNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Documento descargado exitosamente', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al descargar el documento', { variant: 'error' });
    }
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([_, value]) => value !== '' && value !== undefined).length;
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      entry: 'Entrada',
      exit: 'Salida',
      transfer: 'Transferencia'
    };
    return labels[type] || type;
  };

  const getMovementSubtypeLabel = (subtype: string) => {
    const labels: Record<string, string> = {
      rental: 'Renta',
      sale: 'Venta',
      purchase: 'Compra',
      return: 'Devolución',
      maintenance: 'Mantenimiento',
      relocation: 'Reubicación'
    };
    return labels[subtype] || subtype;
  };

  const getChipColor = (type: string): "success" | "warning" | "info" | "default" => {
    if (type === 'entry') return 'success';
    if (type === 'exit') return 'warning';
    if (type === 'transfer') return 'info';
    return 'default';
  };

  return (
    <Box>
      {/* Filtros Avanzados (Accordion) */}
      <Accordion
        defaultExpanded
        sx={{
          mb: 2,
          backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <SearchIcon />
            <Typography fontWeight={600}>Filtros Avanzados</Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip
                label={`${getActiveFiltersCount()} activo${getActiveFiltersCount() > 1 ? 's' : ''}`}
                size="small"
                color="primary"
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Búsqueda por texto */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por N° Movimiento o Artículo"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  endAdornment: filters.search && (
                    <IconButton size="small" onClick={() => handleClearFilter('search')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )
                }}
              />
            </Grid>

            {/* Tipo de movimiento */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  value={filters.movementType || ''}
                  label="Tipo de Movimiento"
                  onChange={(e) => handleFilterChange('movementType', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="entry">Entrada</MenuItem>
                  <MenuItem value="exit">Salida</MenuItem>
                  <MenuItem value="transfer">Transferencia</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Subtipo */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Subtipo</InputLabel>
                <Select
                  value={filters.movementSubtype || ''}
                  label="Subtipo"
                  onChange={(e) => handleFilterChange('movementSubtype', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="rental">Renta</MenuItem>
                  <MenuItem value="sale">Venta</MenuItem>
                  <MenuItem value="purchase">Compra</MenuItem>
                  <MenuItem value="return">Devolución</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                  <MenuItem value="relocation">Reubicación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fecha desde */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Desde"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Fecha hasta */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Hasta"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Ubicación */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small" disabled={loadingFilters}>
                <InputLabel>Ubicación</InputLabel>
                <Select
                  value={filters.locationId || ''}
                  label="Ubicación"
                  onChange={(e) => handleFilterChange('locationId', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {locations.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Categoría */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small" disabled={loadingFilters}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filters.categoryId || ''}
                  label="Categoría"
                  onChange={(e) => handleFilterChange('categoryId', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Botón Limpiar Filtros */}
            {getActiveFiltersCount() > 0 && (
              <Grid item xs={12}>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleClearAllFilters}
                  sx={{ textTransform: 'none' }}
                >
                  Limpiar todos los filtros
                </Button>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Chips de Filtros Activos */}
      {getActiveFiltersCount() > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {filters.search && (
            <Chip
              label={`Búsqueda: "${filters.search}"`}
              onDelete={() => handleClearFilter('search')}
              size="small"
            />
          )}
          {filters.movementType && (
            <Chip
              label={`Tipo: ${getMovementTypeLabel(filters.movementType)}`}
              onDelete={() => handleClearFilter('movementType')}
              size="small"
            />
          )}
          {filters.movementSubtype && (
            <Chip
              label={`Subtipo: ${getMovementSubtypeLabel(filters.movementSubtype)}`}
              onDelete={() => handleClearFilter('movementSubtype')}
              size="small"
            />
          )}
          {filters.dateFrom && (
            <Chip
              label={`Desde: ${new Date(filters.dateFrom).toLocaleDateString()}`}
              onDelete={() => handleClearFilter('dateFrom')}
              size="small"
            />
          )}
          {filters.dateTo && (
            <Chip
              label={`Hasta: ${new Date(filters.dateTo).toLocaleDateString()}`}
              onDelete={() => handleClearFilter('dateTo')}
              size="small"
            />
          )}
          {filters.locationId && (
            <Chip
              label={`Ubicación: ${locations.find(l => String(l.id) === String(filters.locationId))?.name || filters.locationId}`}
              onDelete={() => handleClearFilter('locationId')}
              size="small"
            />
          )}
          {filters.categoryId && (
            <Chip
              label={`Categoría: ${categories.find(c => String(c.id) === String(filters.categoryId))?.name || filters.categoryId}`}
              onDelete={() => handleClearFilter('categoryId')}
              size="small"
            />
          )}
        </Box>
      )}

      {/* Tabla */}
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
              <TableCell>N° Movimiento</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Subtipo</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Artículo</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {getActiveFiltersCount() > 0
                      ? 'No hay movimientos que coincidan con los filtros aplicados'
                      : 'No hay movimientos registrados'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => (
                <TableRow key={movement.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {movement.movementNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getMovementTypeLabel(movement.movementType)}
                      size="small"
                      color={getChipColor(movement.movementType)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getMovementSubtypeLabel(movement.movementSubtype)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(movement.movementDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => onViewDetails && onViewDetails(movement.itemId)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        color: isDarkMode ? '#a78bfa' : '#8b5cf6'
                      }}
                    >
                      {movement.itemName}
                    </Button>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {movement.itemCategory}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {movement.toLocationName || movement.fromLocationName || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {movement.userName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {movement.documentGenerated && (
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadDocument(movement)}
                        title="Descargar PDF"
                        sx={{ color: isDarkMode ? '#a78bfa' : '#8b5cf6' }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>
    </Box>
  );
};

export default MovementHistoryTable;
