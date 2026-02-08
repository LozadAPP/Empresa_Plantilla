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
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import extraServiceService from '../services/extraServiceService';
import { CreateExtraServiceDto, PriceType, ServiceCategory } from '../types/extraService';
import vehicleService from '../services/vehicleService';
import { locationService } from '../services/locationService';

const ExtraServiceForm: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [vehicleTypes, setVehicleTypes] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<CreateExtraServiceDto>({
    name: '',
    description: '',
    price: 0,
    price_type: 'per_day',
    category: 'accessory',
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    const loadExistingService = async () => {
      if (!isEdit || !id) return;

      const numericId = Number(id);
      if (Number.isNaN(numericId) || numericId <= 0) {
        setError('ID de servicio inválido');
        navigate('/settings?tab=5');
        return;
      }

      try {
        const response = await extraServiceService.getServiceById(numericId);
        const service = response.data;

        if (service) {
          setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price,
            price_type: service.price_type,
            category: service.category,
            vehicle_type_id: service.vehicle_type_id,
            location_id: service.location_id,
          });
        } else {
          setError('Servicio no encontrado');
          navigate('/settings?tab=5');
        }
      } catch (err) {
        console.error('Error loading service:', err);
        setError('Error al cargar el servicio');
      }
    };

    loadExistingService();
  }, [isEdit, id, navigate]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const [typesRes, locationsRes] = await Promise.all([
        vehicleService.getVehicleTypes(),
        locationService.getLocationsDropdown()
      ]);

      const mappedTypes = (typesRes.data || []).map((t: any) => ({ id: t.id, name: t.name }));
      setVehicleTypes(mappedTypes);
      setLocations(locationsRes.data || []);
    } catch (err) {
      console.error('Error loading dropdown data:', err);
      setError('Error al cargar datos de referencia');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name.trim()) {
        setError('El nombre del servicio es requerido');
        setLoading(false);
        return;
      }

      if (formData.price < 0) {
        setError('El precio debe ser un número positivo');
        setLoading(false);
        return;
      }

      if (isEdit && id) {
        await extraServiceService.updateService(Number(id), formData);
      } else {
        await extraServiceService.createService(formData);
      }
      navigate('/settings?tab=5');
    } catch (err: any) {
      console.error('Error saving extra service:', err);
      setError(err.response?.data?.message || 'Error al guardar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateExtraServiceDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories: { value: ServiceCategory; label: string }[] = [
    { value: 'accessory', label: 'Accesorio' },
    { value: 'insurance', label: 'Seguro' },
    { value: 'service', label: 'Servicio' },
  ];

  const priceTypes: { value: PriceType; label: string }[] = [
    { value: 'per_day', label: 'Por día' },
    { value: 'fixed', label: 'Precio fijo (único)' },
  ];

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
          {isEdit ? 'Editar Servicio Extra' : 'Nuevo Servicio Extra'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Configure los servicios adicionales disponibles para las rentas
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Información del Servicio
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Nombre del Servicio"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: GPS, Seguro Premium, Silla de Bebé"
                  helperText="Nombre descriptivo del servicio"
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    label="Categoría"
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Price */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Precio"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Precio del servicio"
                />
              </Grid>

              {/* Price Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Precio</InputLabel>
                  <Select
                    value={formData.price_type}
                    onChange={(e) => handleChange('price_type', e.target.value)}
                    label="Tipo de Precio"
                  >
                    {priceTypes.map((pt) => (
                      <MenuItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción (Opcional)"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe el servicio y lo que incluye..."
                />
              </Grid>

              {/* Optional Filters Section */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                  Restricciones (Opcional)
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Si no selecciona tipo de vehículo o ubicación, el servicio estará disponible para todos.
                </Typography>
              </Grid>

              {/* Vehicle Type (Optional) */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Vehículo (Opcional)</InputLabel>
                  <Select
                    value={formData.vehicle_type_id || ''}
                    onChange={(e) => handleChange('vehicle_type_id', e.target.value || undefined)}
                    label="Tipo de Vehículo (Opcional)"
                  >
                    <MenuItem value="">
                      Todos los tipos
                    </MenuItem>
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Location (Optional) */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Ubicación (Opcional)</InputLabel>
                  <Select
                    value={formData.location_id || ''}
                    onChange={(e) => handleChange('location_id', e.target.value || undefined)}
                    label="Ubicación (Opcional)"
                  >
                    <MenuItem value="">
                      Todas las sedes
                    </MenuItem>
                    {locations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/settings?tab=5')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
                sx={{
                  bgcolor: '#8b5cf6',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#7c3aed'
                  }
                }}
              >
                {loading ? 'Guardando...' : isEdit ? 'Actualizar Servicio' : 'Crear Servicio'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>

      {/* Help Card */}
      <Card sx={{ mt: 3, bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : alpha('#3b82f6', 0.05) }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#3b82f6' }}>
            Tipos de Servicios Extra
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Accesorios:</strong> GPS, silla de bebé, rack para bicicletas, portaequipaje, etc.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Seguros:</strong> Seguro contra robo, daños a terceros, cobertura amplia, etc.
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Servicios:</strong> Conductor asignado, lavado de vehículo, entrega a domicilio, etc.
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExtraServiceForm;
