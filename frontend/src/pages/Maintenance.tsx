import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Skeleton,
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
import { ExpandMore as ExpandMoreIcon, Close as CloseIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  Build as BuildIcon,
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduledIcon,
  Cancel as CancelledIcon,
  PlayArrow as InProgressIcon,
  Error as CriticalIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import maintenanceService from '../services/maintenanceService';
import { MaintenanceOrder } from '../types/maintenance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportToCSV, formatDateForCSV, formatCurrencyForCSV } from '../utils/exportCSV';

// Columnas para exportación CSV
const MAINTENANCE_COLUMNS = [
  { key: 'maintenanceCode', label: 'Codigo' },
  { key: 'vehicle.make', label: 'Marca' },
  { key: 'vehicle.model', label: 'Modelo' },
  { key: 'vehicle.licensePlate', label: 'Placa' },
  { key: 'maintenanceType.name', label: 'Tipo' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'status', label: 'Estado' },
  { key: 'scheduledDate', label: 'Fecha Programada', formatter: formatDateForCSV },
  { key: 'completedDate', label: 'Fecha Completada', formatter: formatDateForCSV },
  { key: 'actualCost', label: 'Costo', formatter: formatCurrencyForCSV },
];

const Maintenance: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // RESPONSIVE: Media queries
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Complete dialog states
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeFormData, setCompleteFormData] = useState({
    actualCost: '',
    actualDuration: '',
    notes: '',
    mileageAtService: '',
    nextServiceMileage: ''
  });

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const params: any = { page: 1, limit: 50 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await maintenanceService.getMaintenanceOrders(params);
      setOrders(response.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las ordenes de mantenimiento';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: MaintenanceOrder) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleOpenCompleteDialog = () => {
    setCompleteDialogOpen(true);
    setCompleteFormData({
      actualCost: selectedOrder?.maintenanceType?.estimatedCost?.toString() || '',
      actualDuration: selectedOrder?.maintenanceType?.estimatedDuration?.toString() || '',
      notes: '',
      mileageAtService: '',
      nextServiceMileage: ''
    });
    handleMenuClose();
  };

  const handleCloseCompleteDialog = () => {
    setCompleteDialogOpen(false);
    setCompleteFormData({
      actualCost: '',
      actualDuration: '',
      notes: '',
      mileageAtService: '',
      nextServiceMileage: ''
    });
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;

    try {
      setCompleting(true);
      const data: any = {};

      if (completeFormData.actualCost) data.actualCost = parseFloat(completeFormData.actualCost);
      if (completeFormData.actualDuration) data.actualDuration = parseFloat(completeFormData.actualDuration);
      if (completeFormData.notes) data.notes = completeFormData.notes;
      if (completeFormData.mileageAtService) data.mileageAtService = parseInt(completeFormData.mileageAtService);
      if (completeFormData.nextServiceMileage) data.nextServiceMileage = parseInt(completeFormData.nextServiceMileage);

      const response = await maintenanceService.completeMaintenanceOrder(selectedOrder.id, data);

      if (response.success) {
        enqueueSnackbar('Orden completada exitosamente', { variant: 'success' });
        handleCloseCompleteDialog();
        loadOrders();
      } else {
        enqueueSnackbar('Error al completar la orden', { variant: 'error' });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al completar la orden';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setCompleting(false);
    }
  };

  const getStatusChip = (status: string) => {
    const configs = {
      scheduled: { label: 'Programado', color: 'info', icon: <ScheduledIcon sx={{ fontSize: 16 }} /> },
      in_progress: { label: 'En Progreso', color: 'warning', icon: <InProgressIcon sx={{ fontSize: 16 }} /> },
      completed: { label: 'Completado', color: 'success', icon: <CompletedIcon sx={{ fontSize: 16 }} /> },
      cancelled: { label: 'Cancelado', color: 'error', icon: <CancelledIcon sx={{ fontSize: 16 }} /> }
    };

    const config = configs[status as keyof typeof configs] || configs.scheduled;

    return (
      <Chip
        label={config.label}
        color={config.color as any}
        size="small"
        icon={config.icon}
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getPriorityChip = (priority: string) => {
    const configs: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'error'; icon?: React.ReactElement }> = {
      low: { label: 'Baja', color: 'default' },
      medium: { label: 'Media', color: 'info' },
      high: { label: 'Alta', color: 'warning' },
      critical: { label: 'Crítica', color: 'error', icon: <CriticalIcon sx={{ fontSize: 16 }} /> }
    };

    const config = configs[priority] || configs.medium;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
      />
    );
  };

  const filteredOrders = orders.filter(order => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      order.maintenanceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicle?.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.maintenanceType?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      enqueueSnackbar('No hay órdenes para exportar', { variant: 'warning' });
      return;
    }

    try {
      exportToCSV(filteredOrders, MAINTENANCE_COLUMNS, 'MOVICAR_Mantenimiento');
      enqueueSnackbar(`Exportación completada: ${filteredOrders.length} órdenes`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al exportar las órdenes', { variant: 'error' });
    }
  };

  // Table skeleton component
  const TableSkeleton = () => (
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
            {['Código', 'Vehículo', 'Tipo', 'Prioridad', 'Estado', 'Fecha', 'Acciones'].map((header) => (
              <TableCell key={header}>
                <Skeleton variant="text" width="80%" height={24} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton variant="text" width="70%" height={20} /></TableCell>
              <TableCell>
                <Box>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
              </TableCell>
              <TableCell><Skeleton variant="rounded" width={100} height={24} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={90} height={24} /></TableCell>
              <TableCell><Skeleton variant="text" width="60%" height={20} /></TableCell>
              <TableCell><Skeleton variant="circular" width={32} height={32} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading && orders.length === 0) {
    return (
      <Box>
        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }, letterSpacing: '-0.02em', mb: 0.5 }}>
            Mantenimiento
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Gestión de órdenes de taller y servicios
          </Typography>
        </Box>

        {/* Stats Skeleton */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
              }}
            >
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={40} />
            </Paper>
          ))}
        </Box>

        {/* Actions Bar Skeleton */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" width={300} height={40} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" width={100} height={36} />
            ))}
          </Box>
        </Box>

        {/* Table Skeleton */}
        <TableSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
          Mantenimiento
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Gestión de órdenes de taller y servicios
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 3, md: 4 }
      }}>
        {[
          { label: 'Total', fullLabel: 'Total Órdenes', value: orders.length, color: '#8b5cf6' },
          { label: 'Programadas', fullLabel: 'Programadas', value: orders.filter(o => o.status === 'scheduled').length, color: '#3b82f6' },
          { label: 'En Progreso', fullLabel: 'En Progreso', value: orders.filter(o => o.status === 'in_progress').length, color: '#f59e0b' },
          { label: 'Completadas', fullLabel: 'Completadas', value: orders.filter(o => o.status === 'completed').length, color: '#10b981' }
        ].map((stat, index) => (
          <Paper
            key={index}
            sx={{
              p: { xs: 1.5, sm: 3 },
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: { xs: '12px', sm: 2 },
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
              {isMobile ? stat.label : stat.fullLabel}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Actions Bar - RESPONSIVE */}
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 1.5, sm: 2 },
        mb: 2
      }}>
        {/* Botón Nueva Orden - Primero en móvil */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/maintenance/new')}
          fullWidth={isMobile}
          sx={{
            order: { xs: 0, md: 4 },
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            minHeight: { xs: 48, sm: 40 },
            '&:hover': { bgcolor: theme.palette.primary.dark }
          }}
        >
          Nueva Orden
        </Button>

        {/* Export Button */}
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          fullWidth={isMobile}
          sx={{
            order: { xs: 1, md: 5 },
            minHeight: { xs: 48, sm: 40 }
          }}
        >
          {isMobile ? 'Exportar' : 'Exportar CSV'}
        </Button>

        {/* Search */}
        <TextField
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            order: { xs: 1, md: 0 },
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
        />

        {/* Status Filter - Select en móvil, botones en desktop */}
        {isMobile ? (
          <FormControl size="small" sx={{ order: 2, '& .MuiInputBase-root': { minHeight: 48 } }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={statusFilter}
              label="Estado"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="scheduled">Programadas</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="completed">Completadas</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, order: 1 }}>
            {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStatusFilter(status)}
                sx={{
                  bgcolor: statusFilter === status ? '#8b5cf6' : 'transparent',
                  color: statusFilter === status ? '#fff' : 'inherit',
                  '&:hover': { bgcolor: statusFilter === status ? '#7c3aed' : undefined }
                }}
              >
                {status === 'all' ? 'Todas' : status === 'scheduled' ? 'Programadas' : status === 'in_progress' ? 'En Progreso' : 'Completadas'}
              </Button>
            ))}
          </Box>
        )}

        {/* Priority Filter */}
        <FormControl size="small" sx={{
          order: { xs: 3, md: 2 },
          minWidth: { xs: '100%', sm: 140 },
          '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } }
        }}>
          <InputLabel>Prioridad</InputLabel>
          <Select
            value={priorityFilter}
            label="Prioridad"
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="low">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                Baja
              </Box>
            </MenuItem>
            <MenuItem value="medium">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                Media
              </Box>
            </MenuItem>
            <MenuItem value="high">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444' }} />
                Alta
              </Box>
            </MenuItem>
            <MenuItem value="critical">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626' }} />
                Crítica
              </Box>
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* RESPONSIVE: Cards en móvil, Tabla en desktop */}
      {isMobile ? (
        /* Vista de Cards para móvil */
        <Box>
          {filteredOrders.length === 0 ? (
            <Paper sx={{
              p: 4,
              textAlign: 'center',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <BuildIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No hay órdenes de mantenimiento
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  onClick={() => navigate(`/maintenance/${order.id}`)}
                  sx={{
                    cursor: 'pointer',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: 2,
                    transition: 'transform 0.15s, border-color 0.15s',
                    '&:hover': { borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6' },
                    '&:active': { transform: 'scale(0.98)' }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header: Código + Estado + Menú */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="700" sx={{ color: '#8b5cf6' }}>
                          {order.maintenanceCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.maintenanceType?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getPriorityChip(order.priority)}
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleMenuClick(e, order); }}
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
                          Vehículo
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          {order.vehicle?.make} {order.vehicle?.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.vehicle?.licensePlate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Fecha
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {format(new Date(order.scheduledDate), "d MMM yyyy", { locale: es })}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Estado
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>{getStatusChip(order.status)}</Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Costo
                        </Typography>
                        <Typography variant="body2" fontWeight="700" sx={{ color: '#10b981' }}>
                          ${order.actualCost || order.maintenanceType?.estimatedCost || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Vehículo</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Fecha Programada</strong></TableCell>
                <TableCell><strong>Prioridad</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Costo</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <BuildIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No hay órdenes de mantenimiento
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Crea una nueva orden para empezar
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/maintenance/${order.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {order.maintenanceCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.vehicle?.make} {order.vehicle?.model}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.vehicle?.licensePlate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.maintenanceType?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(order.scheduledDate), "d MMM yyyy", { locale: es })}
                      </Typography>
                    </TableCell>
                    <TableCell>{getPriorityChip(order.priority)}</TableCell>
                    <TableCell>{getStatusChip(order.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        ${order.actualCost || order.maintenanceType?.estimatedCost || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, order);
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
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { navigate(`/maintenance/${selectedOrder?.id}`); handleMenuClose(); }}>
          Ver Detalles
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/maintenance/${selectedOrder?.id}/edit`); handleMenuClose(); }}>
          Editar
        </MenuItem>
        {selectedOrder?.status === 'in_progress' && (
          <MenuItem onClick={handleOpenCompleteDialog}>
            Marcar como Completada
          </MenuItem>
        )}
      </Menu>

      {/* Complete Order Dialog - RESPONSIVE */}
      <Dialog
        open={completeDialogOpen}
        onClose={handleCloseCompleteDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isMobile ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
        }}>
          Completar Orden
          {isMobile && (
            <IconButton onClick={handleCloseCompleteDialog} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: isMobile ? 3 : 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Completa la información final de la orden {selectedOrder?.maintenanceCode}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Costo Real"
                type="number"
                value={completeFormData.actualCost}
                onChange={(e) => setCompleteFormData({ ...completeFormData, actualCost: e.target.value })}
                placeholder="0.00"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duración Real (horas)"
                type="number"
                value={completeFormData.actualDuration}
                onChange={(e) => setCompleteFormData({ ...completeFormData, actualDuration: e.target.value })}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kilometraje Actual"
                type="number"
                value={completeFormData.mileageAtService}
                onChange={(e) => setCompleteFormData({ ...completeFormData, mileageAtService: e.target.value })}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Próximo Servicio (km)"
                type="number"
                value={completeFormData.nextServiceMileage}
                onChange={(e) => setCompleteFormData({ ...completeFormData, nextServiceMileage: e.target.value })}
                placeholder="0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                multiline
                rows={3}
                value={completeFormData.notes}
                onChange={(e) => setCompleteFormData({ ...completeFormData, notes: e.target.value })}
                placeholder="Describe el trabajo realizado, piezas reemplazadas, observaciones..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 2 },
          borderTop: isMobile ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
        }}>
          <Button
            onClick={handleCloseCompleteDialog}
            disabled={completing}
            fullWidth={isMobile}
            sx={{ minHeight: { xs: 48, sm: 36 } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCompleteOrder}
            variant="contained"
            disabled={completing}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 48, sm: 36 },
              bgcolor: '#10b981',
              '&:hover': { bgcolor: '#059669' }
            }}
          >
            {completing ? 'Completando...' : 'Completar Orden'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Maintenance;
