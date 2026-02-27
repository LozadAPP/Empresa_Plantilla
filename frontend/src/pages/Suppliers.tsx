/**
 * Página de Listado de Proveedores
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
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Business as SuppliersIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ToggleOn as ActivateIcon,
  ToggleOff as DeactivateIcon,
  Delete as DeleteIcon,
  Handshake as ServicesIcon,
  Inventory as ProductsIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { FileDownload as ExportIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import TableSkeleton from '../components/common/TableSkeleton';
import EmptyState from '../components/common/EmptyState';
import { supplierService } from '../services/supplierService';
import { exportToCSV, SUPPLIERS_COLUMNS } from '../utils/exportCSV';
import type { Supplier, SupplierFilters, SupplierStats } from '../types/supplier';

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  services: { label: 'Servicios', color: '#3b82f6' },
  products: { label: 'Productos', color: '#f59e0b' },
  both: { label: 'Ambos', color: '#10b981' },
};

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Dialogs
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });

  const cardBg = isDarkMode ? '#1c1c2e' : '#ffffff';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const textSecondary = isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params: SupplierFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (search) params.search = search;
      if (typeFilter) params.supplier_type = typeFilter as any;
      if (activeFilter !== '') params.is_active = activeFilter;

      const res = await supplierService.getAll(params);
      setSuppliers(res.data);
      setPagination(prev => ({ ...prev, ...res.pagination }));
    } catch {
      enqueueSnackbar('Error al cargar proveedores', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, activeFilter, enqueueSnackbar]);

  const loadStats = useCallback(async () => {
    try {
      const res = await supplierService.getStats();
      setStats(res.data);
    } catch {
      // Stats are optional
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const res = await supplierService.toggleActive(supplier.id);
      enqueueSnackbar(res.message, { variant: 'success' });
      loadSuppliers();
      loadStats();
    } catch {
      enqueueSnackbar('Error al cambiar estado', { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.supplier) return;
    try {
      const res = await supplierService.delete(deleteDialog.supplier.id);
      enqueueSnackbar(res.message, { variant: 'success' });
      setDeleteDialog({ open: false, supplier: null });
      loadSuppliers();
      loadStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al eliminar';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await supplierService.getAll({ limit: 10000 });
      exportToCSV(res.data, SUPPLIERS_COLUMNS, 'proveedores');
      enqueueSnackbar('CSV exportado exitosamente', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al exportar CSV', { variant: 'error' });
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setActiveFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasFilters = search || typeFilter || activeFilter !== '';

  // KPI Cards
  const kpiCards = stats ? [
    { label: 'Total Proveedores', value: stats.total, color: '#3b82f6', icon: <SuppliersIcon /> },
    { label: 'Activos', value: stats.active, color: '#10b981', icon: <ActivateIcon /> },
    { label: 'Servicios', value: stats.byType.services, color: '#8b5cf6', icon: <ServicesIcon /> },
    { label: 'Productos', value: stats.byType.products, color: '#f59e0b', icon: <ProductsIcon /> },
  ] : [];

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SuppliersIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
          <Typography variant="h5" fontWeight={700}>
            Proveedores
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            sx={{ borderRadius: 2 }}
          >
            CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/suppliers/new')}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            }}
          >
            Nuevo Proveedor
          </Button>
        </Box>
      </Box>

      {/* KPIs */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpiCards.map((kpi, idx) => (
            <Grid item xs={6} sm={3} key={idx}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: cardBg,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box sx={{
                  width: 48, height: 48, borderRadius: 2,
                  bgcolor: `${kpi.color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: kpi.color,
                }}>
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
                  <Typography variant="caption" sx={{ color: textSecondary }}>{kpi.label}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems={isMobile ? 'stretch' : 'center'}>
          <TextField
            placeholder="Buscar por nombre, RFC, contacto..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
            sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={typeFilter}
              label="Tipo"
              onChange={(e) => { setTypeFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="services">Servicios</MenuItem>
              <MenuItem value="products">Productos</MenuItem>
              <MenuItem value="both">Ambos</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={activeFilter}
              label="Estado"
              onChange={(e) => { setActiveFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="true">Activos</MenuItem>
              <MenuItem value="false">Inactivos</MenuItem>
            </Select>
          </FormControl>
          {hasFilters && (
            <Button startIcon={<ClearIcon />} onClick={handleClearFilters} size="small">
              Limpiar
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Table / Cards */}
      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={<SuppliersIcon />}
          title="No hay proveedores"
          subtitle={hasFilters ? 'Intenta con otros filtros' : 'Crea tu primer proveedor'}
        />
      ) : isMobile ? (
        /* Mobile Cards */
        <Stack spacing={2}>
          {suppliers.map((s) => (
            <Card
              key={s.id}
              sx={{
                borderRadius: 3,
                bgcolor: cardBg,
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/suppliers/${s.id}`)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography fontWeight={600}>{s.name}</Typography>
                  <Chip
                    label={s.is_active ? 'Activo' : 'Inactivo'}
                    size="small"
                    color={s.is_active ? 'success' : 'default'}
                    sx={{ borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: textSecondary }}>{s.supplier_code}</Typography>
                {s.rfc && <Typography variant="body2" sx={{ color: textSecondary }}>RFC: {s.rfc}</Typography>}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Chip
                    label={TYPE_CONFIG[s.supplier_type]?.label || s.supplier_type}
                    size="small"
                    sx={{
                      bgcolor: `${TYPE_CONFIG[s.supplier_type]?.color || '#6b7280'}20`,
                      color: TYPE_CONFIG[s.supplier_type]?.color || '#6b7280',
                      borderRadius: 1,
                    }}
                  />
                  {s.contact_person && (
                    <Typography variant="body2" sx={{ color: textSecondary }}>{s.contact_person}</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        /* Desktop Table */
        <TableContainer component={Paper} sx={{ borderRadius: 3, bgcolor: cardBg, border: `1px solid ${borderColor}` }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>RFC</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow
                  key={s.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => navigate(`/suppliers/${s.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#3b82f6' }}>
                      {s.supplier_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{s.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: textSecondary }}>{s.rfc || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={TYPE_CONFIG[s.supplier_type]?.label || s.supplier_type}
                      size="small"
                      sx={{
                        bgcolor: `${TYPE_CONFIG[s.supplier_type]?.color || '#6b7280'}20`,
                        color: TYPE_CONFIG[s.supplier_type]?.color || '#6b7280',
                        fontWeight: 600,
                        borderRadius: 1,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.contact_person || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.phone || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.is_active ? 'Activo' : 'Inactivo'}
                      size="small"
                      color={s.is_active ? 'success' : 'default'}
                      sx={{ borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => navigate(`/suppliers/${s.id}`)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => navigate(`/suppliers/${s.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={s.is_active ? 'Desactivar' : 'Activar'}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(s)}
                        sx={{ color: s.is_active ? '#f59e0b' : '#10b981' }}
                      >
                        {s.is_active ? <DeactivateIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => setDeleteDialog({ open: true, supplier: s })}
                        sx={{ color: '#ef4444' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            rowsPerPage={pagination.limit}
            onPageChange={(_, p) => setPagination(prev => ({ ...prev, page: p + 1 }))}
            onRowsPerPageChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Filas:"
          />
        </TableContainer>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, supplier: null })}>
        <DialogTitle>Eliminar Proveedor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de eliminar a <strong>{deleteDialog.supplier?.name}</strong>?
            Solo se puede eliminar si no tiene gastos ni mantenimientos vinculados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, supplier: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;
