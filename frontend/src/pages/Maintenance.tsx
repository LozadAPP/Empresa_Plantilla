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
  Select
} from '@mui/material';
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
  Error as CriticalIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import maintenanceService from '../services/maintenanceService';
import { MaintenanceOrder } from '../types/maintenance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Maintenance: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);

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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
        {[
          { label: 'Total Órdenes', value: orders.length, color: '#8b5cf6' },
          { label: 'Programadas', value: orders.filter(o => o.status === 'scheduled').length, color: '#3b82f6' },
          { label: 'En Progreso', value: orders.filter(o => o.status === 'in_progress').length, color: '#f59e0b' },
          { label: 'Completadas', value: orders.filter(o => o.status === 'completed').length, color: '#10b981' }
        ].map((stat, index) => (
          <Paper
            key={index}
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {stat.label}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Actions Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar por código, vehículo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: 250 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {['all', 'scheduled', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setStatusFilter(status)}
              sx={{
                bgcolor: statusFilter === status ? '#8b5cf6' : 'transparent',
                color: statusFilter === status ? '#fff' : 'inherit',
                '&:hover': {
                  bgcolor: statusFilter === status ? '#7c3aed' : undefined
                }
              }}
            >
              {status === 'all' ? 'Todas' : status === 'scheduled' ? 'Programadas' : status === 'in_progress' ? 'En Progreso' : 'Completadas'}
            </Button>
          ))}
        </Box>

        <FormControl size="small" sx={{ minWidth: 140 }}>
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/maintenance/new')}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          Nueva Orden
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

      {/* Complete Order Dialog */}
      <Dialog open={completeDialogOpen} onClose={handleCloseCompleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Completar Orden de Mantenimiento</DialogTitle>
        <DialogContent>
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
        <DialogActions>
          <Button onClick={handleCloseCompleteDialog} disabled={completing}>
            Cancelar
          </Button>
          <Button
            onClick={handleCompleteOrder}
            variant="contained"
            disabled={completing}
            sx={{
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
