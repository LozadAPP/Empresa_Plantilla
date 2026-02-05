import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Alert,
  Divider,
  Autocomplete,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Build as BuildIcon,
  DirectionsCar as CarIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import maintenanceService from '../services/maintenanceService';
import vehicleService from '../services/vehicleService';

interface MaintenanceType {
  id: number;
  name: string;
  description?: string;
  estimatedCost: number;
  estimatedDuration: number;
}

interface Vehicle {
  id: number;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
}

interface FormData {
  vehicleId: number;
  maintenanceTypeId: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  estimatedCost: number;
  description: string;
  notes: string;
}

const MaintenanceForm: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string>('');
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState<FormData>({
    vehicleId: 0,
    maintenanceTypeId: 0,
    priority: 'medium',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedCost: 0,
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Solo cargar la orden cuando vehicles esté listo
    if (id && vehicles.length > 0) {
      loadMaintenanceOrder(parseInt(id));
    }
  }, [id, vehicles]);

  const loadInitialData = async () => {
    try {
      const [typesRes, vehiclesRes] = await Promise.all([
        maintenanceService.getMaintenanceTypes(),
        vehicleService.getAll({ page: 1, limit: 100 })
      ]);
      setMaintenanceTypes(typesRes.data || []);
      // Map vehicle fields to local interface
      const mappedVehicles: Vehicle[] = (vehiclesRes.data || []).map((v: any) => ({
        id: v.id,
        licensePlate: v.licensePlate || v.license_plate,
        make: v.make,
        model: v.model,
        year: v.year
      }));
      setVehicles(mappedVehicles);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar los datos iniciales';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const loadMaintenanceOrder = async (orderId: number) => {
    try {
      const response = await maintenanceService.getMaintenanceOrderById(orderId);
      const order = response.data;
      setFormData({
        vehicleId: order.vehicleId,
        maintenanceTypeId: order.maintenanceTypeId,
        priority: order.priority,
        scheduledDate: new Date(order.scheduledDate).toISOString().split('T')[0],
        estimatedCost: order.maintenanceType?.estimatedCost || 0,
        description: order.description || '',
        notes: order.notes || ''
      });
      const vehicle = vehicles.find(v => v.id === order.vehicleId);
      if (vehicle) setSelectedVehicle(vehicle);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar la orden de mantenimiento';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.vehicleId) {
        setError('Debe seleccionar un vehículo');
        setLoading(false);
        return;
      }

      if (!formData.maintenanceTypeId) {
        setError('Debe seleccionar un tipo de mantenimiento');
        setLoading(false);
        return;
      }

      if (isEdit && id) {
        const updatePayload = {
          scheduledDate: formData.scheduledDate,
          priority: formData.priority,
          description: formData.description,
          notes: formData.notes
        };
        await maintenanceService.updateMaintenanceOrder(parseInt(id), updatePayload);
      } else {
        const createPayload = {
          vehicleId: formData.vehicleId,
          maintenanceTypeId: formData.maintenanceTypeId,
          scheduledDate: formData.scheduledDate,
          priority: formData.priority,
          description: formData.description
        };
        await maintenanceService.createMaintenanceOrder(createPayload);
      }

      enqueueSnackbar(isEdit ? 'Orden actualizada exitosamente' : 'Orden creada exitosamente', { variant: 'success' });
      navigate('/maintenance');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al guardar la orden de mantenimiento';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (typeId: number) => {
    const type = maintenanceTypes.find(t => t.id === typeId);
    setFormData(prev => ({
      ...prev,
      maintenanceTypeId: typeId,
      estimatedCost: type?.estimatedCost || prev.estimatedCost
    }));
  };

  const handleVehicleChange = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    handleChange('vehicleId', vehicle?.id || 0);
  };

  const priorities = [
    { value: 'low', label: 'Baja', color: '#10b981' },
    { value: 'medium', label: 'Media', color: '#f59e0b' },
    { value: 'high', label: 'Alta', color: '#ef4444' },
    { value: 'critical', label: 'Crítica', color: '#dc2626' }
  ];

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
          {isEdit ? 'Editar Orden de Mantenimiento' : 'Nueva Orden de Mantenimiento'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Complete los datos para programar el mantenimiento del vehículo
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card sx={{
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CarIcon sx={{ color: '#8b5cf6' }} />
              <Typography variant="h6" fontWeight={600}>
                Información del Vehículo
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {/* Vehicle Selection */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={vehicles}
                  value={selectedVehicle}
                  onChange={(_, newValue) => handleVehicleChange(newValue)}
                  getOptionLabel={(option) => `${option.licensePlate} - ${option.make} ${option.model} (${option.year})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vehículo"
                      required
                      placeholder="Buscar por placa, marca o modelo..."
                      size={isMobile ? "medium" : "small"}
                      InputProps={{
                        ...params.InputProps,
                        sx: { minHeight: { xs: 48, sm: 40 } }
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              </Grid>

              {/* Maintenance Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required size={isMobile ? "medium" : "small"}>
                  <InputLabel>Tipo de Mantenimiento</InputLabel>
                  <Select
                    value={formData.maintenanceTypeId}
                    onChange={(e) => handleTypeChange(e.target.value as number)}
                    label="Tipo de Mantenimiento"
                    sx={{ minHeight: { xs: 48, sm: 40 } }}
                  >
                    <MenuItem value={0} disabled>
                      Seleccione un tipo
                    </MenuItem>
                    {maintenanceTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name} - ${type.estimatedCost}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority & Schedule Section */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
                  <BuildIcon sx={{ color: '#8b5cf6' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Programación
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Priority */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required size={isMobile ? "medium" : "small"}>
                  <InputLabel>Prioridad</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    label="Prioridad"
                    sx={{ minHeight: { xs: 48, sm: 40 } }}
                  >
                    {priorities.map((priority) => (
                      <MenuItem key={priority.value} value={priority.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: priority.color
                            }}
                          />
                          {priority.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Scheduled Date */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha Programada"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange('scheduledDate', e.target.value)}
                  size={isMobile ? "medium" : "small"}
                  InputLabelProps={{
                    shrink: true
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon />
                      </InputAdornment>
                    ),
                    sx: { minHeight: { xs: 48, sm: 40 } }
                  }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0]
                  }}
                  helperText="No se permiten fechas pasadas"
                />
              </Grid>

              {/* Estimated Cost */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Costo Estimado"
                  value={formData.estimatedCost}
                  onChange={(e) => handleChange('estimatedCost', parseFloat(e.target.value) || 0)}
                  size={isMobile ? "medium" : "small"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 },
                    sx: { minHeight: { xs: 48, sm: 40 } }
                  }}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={isMobile ? 2 : 3}
                  size={isMobile ? "medium" : "small"}
                  label="Descripción del Trabajo"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describa el trabajo de mantenimiento a realizar..."
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size={isMobile ? "medium" : "small"}
                  label="Notas Adicionales (Opcional)"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional o instrucciones especiales..."
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{
              mt: 4,
              display: 'flex',
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
              justifyContent: { xs: 'stretch', sm: 'flex-end' }
            }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/maintenance')}
                disabled={loading}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  py: { xs: 1.5, sm: 1 }
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  width: { xs: '100%', sm: 'auto' },
                  py: { xs: 1.5, sm: 1 },
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
                  }
                }}
              >
                {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Orden'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>

      {/* Info Card */}
      <Card sx={{
        mt: 3,
        bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`
      }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#3b82f6' }}>
            Información sobre prioridades
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Baja:</strong> Mantenimiento preventivo que puede esperar
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Media:</strong> Mantenimiento programado regular
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Alta:</strong> Requiere atención pronta, afecta disponibilidad
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Crítica:</strong> Problema de seguridad, atención inmediata requerida
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MaintenanceForm;
