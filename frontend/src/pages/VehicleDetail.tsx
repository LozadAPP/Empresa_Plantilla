/**
 * Vista de detalle de Vehículo
 * Muestra información completa, KPIs, especificaciones, historial de rentas y mantenimientos
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  TrendingDown as DepreciationIcon,
  Build as BuildIcon,
  LocalGasStation as FuelIcon,
  Notes as NotesIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { Vehicle } from '../types';
import { MaintenanceOrder } from '../types/maintenance';
import vehicleService from '../services/vehicleService';
import rentalService from '../services/rentalService';
import maintenanceService from '../services/maintenanceService';
import { DocumentPanel } from '../components/documents';

// ========== Status configs ==========
const vehicleStatusConfig: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#10b981' },
  rented: { label: 'Rentado', color: '#3b82f6' },
  maintenance: { label: 'En Mantenimiento', color: '#f59e0b' },
};

const conditionConfig: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excelente', color: '#10b981' },
  good: { label: 'Bueno', color: '#3b82f6' },
  fair: { label: 'Regular', color: '#f59e0b' },
  poor: { label: 'Deficiente', color: '#ef4444' },
};

const rentalStatusConfig: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Pendiente', color: '#f59e0b' },
  reserved: { label: 'Reservada', color: '#3b82f6' },
  active: { label: 'Activa', color: '#10b981' },
  completed: { label: 'Completada', color: '#6b7280' },
  cancelled: { label: 'Cancelada', color: '#ef4444' },
  overdue: { label: 'Vencida', color: '#dc2626' },
};

const maintenanceStatusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: '#3b82f6' },
  in_progress: { label: 'En Progreso', color: '#f59e0b' },
  completed: { label: 'Completado', color: '#10b981' },
  cancelled: { label: 'Cancelado', color: '#6b7280' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: '#6b7280' },
  medium: { label: 'Media', color: '#3b82f6' },
  high: { label: 'Alta', color: '#f59e0b' },
  critical: { label: 'Crítica', color: '#ef4444' },
};

const VehicleDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { enqueueSnackbar } = useSnackbar();
  const { hasAnyRole } = useAuth();

  // Vehicle data
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  // Rentals
  const [rentals, setRentals] = useState<any[]>([]);
  const [rentalsLoading, setRentalsLoading] = useState(true);

  // Maintenance
  const [maintenanceOrders, setMaintenanceOrders] = useState<MaintenanceOrder[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  const paperSx = {
    p: 3,
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: 2,
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  };

  const loadVehicle = async () => {
    try {
      const response = await vehicleService.getById(Number(id));
      if (response.success && response.data) {
        setVehicle(response.data);
      }
    } catch {
      enqueueSnackbar('Error al cargar vehículo', { variant: 'error' });
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadRentals = async () => {
    setRentalsLoading(true);
    try {
      const response = await rentalService.getByVehicle(Number(id));
      setRentals(response.data?.rentals || []);
    } catch {
      setRentals([]);
      enqueueSnackbar('Error al cargar historial de rentas', { variant: 'warning' });
    } finally {
      setRentalsLoading(false);
    }
  };

  const loadMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const response = await maintenanceService.getMaintenanceHistory(Number(id));
      setMaintenanceOrders(response.data || []);
    } catch {
      setMaintenanceOrders([]);
      enqueueSnackbar('Error al cargar mantenimientos', { variant: 'warning' });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  useEffect(() => {
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0) {
      navigate('/inventory');
      return;
    }
    loadVehicle();
    loadRentals();
    loadMaintenance();
  }, [id]);

  const handleStatusChange = async (newStatus: 'available' | 'maintenance') => {
    if (!vehicle) return;
    setActionLoading(true);
    try {
      await vehicleService.updateStatus(vehicle.id, newStatus);
      enqueueSnackbar(
        `Vehículo marcado como ${vehicleStatusConfig[newStatus]?.label || newStatus}`,
        { variant: 'success' }
      );
      loadVehicle();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cambiar estado', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadFicha = async () => {
    if (!vehicle) return;
    try {
      const blob = await vehicleService.downloadFicha(vehicle.id);
      const url = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ficha-tecnica-${vehicle.license_plate || vehicle.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('Ficha técnica descargada', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al descargar ficha técnica', { variant: 'error' });
    }
  };

  // Loading state
  if (loading || !vehicle) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const statusCfg = vehicleStatusConfig[vehicle.status] || { label: vehicle.status, color: '#6b7280' };
  const condCfg = conditionConfig[vehicle.condition] || { label: vehicle.condition, color: '#6b7280' };

  // Check date warnings
  const isMaintenanceOverdue = vehicle.next_maintenance && new Date(vehicle.next_maintenance) < new Date();
  const isInsuranceExpired = vehicle.insurance_expiry && new Date(vehicle.insurance_expiry) < new Date();
  const depreciation = (vehicle.purchase_price || 0) - (vehicle.current_value || 0);

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{value || 'N/A'}</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>

      {/* ========== HEADER ========== */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/inventory')}
            variant="outlined"
            size="small"
            sx={{ borderRadius: '12px', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
          >
            Volver
          </Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </Typography>
              <Chip
                label={statusCfg.label}
                size="small"
                sx={{ fontWeight: 600, bgcolor: `${statusCfg.color}22`, color: statusCfg.color }}
              />
              <Chip
                label={condCfg.label}
                size="small"
                sx={{ fontWeight: 600, bgcolor: `${condCfg.color}22`, color: condCfg.color }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Placa: {vehicle.license_plate}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {vehicle.status === 'available' && hasAnyRole('director_general', 'jefe_ventas', 'vendedor') && (
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={() => navigate('/rentals/new')}
              sx={{ borderRadius: '12px', borderColor: '#8b5cf6', color: '#8b5cf6' }}
            >
              Nueva Renta
            </Button>
          )}
          {vehicle.status !== 'rented' && hasAnyRole('director_general', 'jefe_inventarios', 'encargado_inventario', 'jefe_ventas') && (
            <Button
              startIcon={<BuildIcon />}
              variant="outlined"
              size="small"
              disabled={actionLoading}
              onClick={() => handleStatusChange(vehicle.status === 'maintenance' ? 'available' : 'maintenance')}
              sx={{
                borderRadius: '12px',
                borderColor: vehicle.status === 'maintenance' ? '#10b981' : '#f59e0b',
                color: vehicle.status === 'maintenance' ? '#10b981' : '#f59e0b',
              }}
            >
              {vehicle.status === 'maintenance' ? 'Marcar Disponible' : 'Enviar a Mantenimiento'}
            </Button>
          )}
          {hasAnyRole('director_general', 'jefe_inventarios', 'encargado_inventario') && (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={() => navigate('/inventory')}
              sx={{ borderRadius: '12px' }}
            >
              Editar
            </Button>
          )}
          <Button
            startIcon={<PdfIcon />}
            variant="outlined"
            size="small"
            onClick={handleDownloadFicha}
            sx={{ borderRadius: '12px', borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            Ficha Técnica
          </Button>
        </Box>
      </Box>

      {/* ========== WARNINGS ========== */}
      {(isMaintenanceOverdue || isInsuranceExpired) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          {isMaintenanceOverdue && (
            <Chip
              icon={<WarningIcon />}
              label={`Mantenimiento vencido: ${formatDate(vehicle.next_maintenance!)}`}
              sx={{ bgcolor: isDarkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}
            />
          )}
          {isInsuranceExpired && (
            <Chip
              icon={<WarningIcon />}
              label={`Seguro vencido: ${formatDate(vehicle.insurance_expiry!)}`}
              sx={{ bgcolor: isDarkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}
            />
          )}
        </Box>
      )}

      {/* ========== KPI CARDS ========== */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Tarifa Diaria', value: formatCurrency(vehicle.daily_rate || 0), color: '#3b82f6', icon: <MoneyIcon /> },
          { label: 'Kilometraje', value: `${(vehicle.mileage || 0).toLocaleString()} km`, color: '#06b6d4', icon: <SpeedIcon /> },
          { label: 'Valor Actual', value: formatCurrency(vehicle.current_value || 0), color: '#10b981', icon: <MoneyIcon /> },
          { label: 'Depreciación Acum.', value: formatCurrency(depreciation), color: '#f59e0b', icon: <DepreciationIcon /> },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Paper sx={{
              ...paperSx,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px',
                bgcolor: isDarkMode ? `${kpi.color}22` : `${kpi.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {React.cloneElement(kpi.icon, { sx: { color: kpi.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ========== SPECIFICATIONS ========== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CarIcon sx={{ fontSize: 20, color: '#8b5cf6' }} /> Especificaciones
            </Typography>
            <InfoRow label="Marca" value={vehicle.make} />
            <InfoRow label="Modelo" value={vehicle.model} />
            <InfoRow label="Año" value={vehicle.year} />
            <InfoRow label="Color" value={vehicle.color} />
            <InfoRow label="Tipo" value={vehicle.vehicleType?.name} />
            <InfoRow label="Transmisión" value={vehicle.transmission} />
            <InfoRow label="Combustible" value={vehicle.fuel_type} />
            <InfoRow label="VIN" value={vehicle.vin} />
            <InfoRow label="Placa" value={vehicle.license_plate} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FuelIcon sx={{ fontSize: 20, color: '#10b981' }} /> Estado y Ubicación
            </Typography>
            <InfoRow label="Estado" value={
              <Chip label={statusCfg.label} size="small" sx={{ bgcolor: `${statusCfg.color}22`, color: statusCfg.color, fontWeight: 600 }} />
            } />
            <InfoRow label="Condición" value={
              <Chip label={condCfg.label} size="small" sx={{ bgcolor: `${condCfg.color}22`, color: condCfg.color, fontWeight: 600 }} />
            } />
            <InfoRow label="Ubicación" value={vehicle.location?.name} />
            <InfoRow label="Premium" value={vehicle.is_premium ? 'Sí' : 'No'} />
            <InfoRow label="Con Chofer" value={vehicle.has_driver ? 'Sí' : 'No'} />
            <InfoRow label="Próximo Mantenimiento" value={
              vehicle.next_maintenance ? (
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: isMaintenanceOverdue ? '#ef4444' : undefined,
                }}>
                  {formatDate(vehicle.next_maintenance)}
                  {isMaintenanceOverdue && ' (Vencido)'}
                </Typography>
              ) : 'N/A'
            } />
            <InfoRow label="Vencimiento Seguro" value={
              vehicle.insurance_expiry ? (
                <Typography variant="body2" sx={{
                  fontWeight: 600,
                  color: isInsuranceExpired ? '#ef4444' : undefined,
                }}>
                  {formatDate(vehicle.insurance_expiry)}
                  {isInsuranceExpired && ' (Vencido)'}
                </Typography>
              ) : 'N/A'
            } />
          </Paper>
        </Grid>
      </Grid>

      {/* ========== FINANCIAL INFO ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon sx={{ fontSize: 20, color: '#f59e0b' }} /> Información Financiera
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <InfoRow label="Precio de Compra" value={formatCurrency(vehicle.purchase_price || 0)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoRow label="Valor Actual" value={formatCurrency(vehicle.current_value || 0)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoRow label="Depreciación Mensual" value={formatCurrency(vehicle.monthly_depreciation || 0)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <InfoRow label="Tarifa Diaria" value={formatCurrency(vehicle.daily_rate || 0)} />
          </Grid>
        </Grid>
      </Paper>

      {/* ========== RENTAL HISTORY ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CarIcon sx={{ fontSize: 20, color: '#3b82f6' }} /> Historial de Rentas ({rentals.length})
        </Typography>
        {rentalsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : rentals.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Este vehículo no tiene rentas registradas
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Inicio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fin</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rentals.map((rental: any) => {
                  const rStatusCfg = rentalStatusConfig[rental.status] || { label: rental.status, color: '#6b7280' };
                  return (
                    <TableRow
                      key={rental.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.04)' } }}
                      onClick={() => navigate(`/rentals/${rental.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{rental.rental_code}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          component="span"
                          onClick={(e) => { e.stopPropagation(); if (rental.customer?.id) navigate(`/customers/${rental.customer.id}`); }}
                          sx={{ cursor: 'pointer', color: '#8b5cf6', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {rental.customer?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(rental.start_date)}</TableCell>
                      <TableCell>{formatDate(rental.end_date)}</TableCell>
                      <TableCell>
                        <Chip label={rStatusCfg.label} size="small" sx={{ bgcolor: `${rStatusCfg.color}22`, color: rStatusCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(rental.total_amount || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ========== MAINTENANCE ORDERS ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon sx={{ fontSize: 20, color: '#f59e0b' }} /> Órdenes de Mantenimiento ({maintenanceOrders.length})
        </Typography>
        {maintenanceLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : maintenanceOrders.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Este vehículo no tiene órdenes de mantenimiento
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha Programada</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Prioridad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Costo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {maintenanceOrders.map((order) => {
                  const mStatusCfg = maintenanceStatusConfig[order.status] || { label: order.status, color: '#6b7280' };
                  const prioCfg = priorityConfig[order.priority] || { label: order.priority, color: '#6b7280' };
                  return (
                    <TableRow key={order.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{order.maintenanceCode}</TableCell>
                      <TableCell>{order.maintenanceType?.name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(order.scheduledDate as any)}</TableCell>
                      <TableCell>
                        <Chip label={prioCfg.label} size="small" sx={{ bgcolor: `${prioCfg.color}22`, color: prioCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={mStatusCfg.label} size="small" sx={{ bgcolor: `${mStatusCfg.color}22`, color: mStatusCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {order.actualCost ? formatCurrency(order.actualCost) : 'Pendiente'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ========== NOTES ========== */}
      {vehicle.notes && (
        <Paper sx={{ ...paperSx, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotesIcon sx={{ fontSize: 20, color: '#6b7280' }} /> Notas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {vehicle.notes}
          </Typography>
        </Paper>
      )}

      {/* ========== DOCUMENTS ========== */}
      <DocumentPanel entityType="vehicle" entityId={vehicle.id} />
    </Box>
  );
};

export default VehicleDetail;
