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
  CalendarToday as CalendarIcon,
  Percent as PercentIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import configService from '../services/configService';
import { CreatePriceConfigDto } from '../types/config';
import vehicleService from '../services/vehicleService';
import { locationService } from '../services/locationService';

const PricingConfig: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [vehicleTypes, setVehicleTypes] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<CreatePriceConfigDto>({
    vehicleTypeId: 0,
    locationId: 1,
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    minimumRentalDays: 1,
    discountPercentage: 0,
    extraHourRate: 0,
    extraDayRate: 0,
    insuranceRate: 0,
    depositAmount: 0,
    lateFeePerDay: 0,
    season: 'regular',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveUntil: '',
    createdBy: 1
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  // Cargar datos existentes si es modo edición
  useEffect(() => {
    const loadExistingConfig = async () => {
      if (!isEdit || !id) return;

      const numericId = Number(id);
      if (Number.isNaN(numericId) || numericId <= 0) {
        setError('ID de configuración inválido');
        navigate('/settings?tab=3');
        return;
      }

      try {
        const response = await configService.getPriceConfigs();
        const config = response.data?.find((c: any) => c.id === numericId);

        if (config) {
          setFormData({
            vehicleTypeId: config.vehicleTypeId || 0,
            locationId: config.locationId || 1,
            dailyRate: config.dailyRate || 0,
            weeklyRate: config.weeklyRate || 0,
            monthlyRate: config.monthlyRate || 0,
            minimumRentalDays: config.minimumRentalDays || 1,
            discountPercentage: config.discountPercentage || 0,
            extraHourRate: config.extraHourRate || 0,
            extraDayRate: config.extraDayRate || 0,
            insuranceRate: config.insuranceRate || 0,
            depositAmount: config.depositAmount || 0,
            lateFeePerDay: config.lateFeePerDay || 0,
            season: config.season || 'regular',
            effectiveFrom: config.effectiveFrom ? config.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
            effectiveUntil: config.effectiveUntil ? config.effectiveUntil.split('T')[0] : '',
            createdBy: config.createdBy || 1,
            notes: config.notes || ''
          });
        } else {
          setError('Configuración no encontrada');
          navigate('/settings?tab=3');
        }
      } catch (error) {
        console.error('Error loading config:', error);
        setError('Error al cargar la configuración');
      }
    };

    loadExistingConfig();
  }, [isEdit, id, navigate]);

  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      const [typesRes, locationsRes] = await Promise.all([
        vehicleService.getVehicleTypes(),
        locationService.getLocationsDropdown()
      ]);

      // Map to required interface
      const mappedTypes = (typesRes.data || []).map((t: any) => ({ id: t.id, name: t.name }));
      setVehicleTypes(mappedTypes);
      setLocations(locationsRes.data || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      setError('Error al cargar tipos de vehículos y ubicaciones');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.dailyRate <= 0) {
        setError('La tarifa diaria debe ser mayor a 0');
        setLoading(false);
        return;
      }

      if (!formData.vehicleTypeId) {
        setError('Debe seleccionar un tipo de vehículo');
        setLoading(false);
        return;
      }

      if (isEdit && id) {
        await configService.updatePriceConfig(Number(id), formData);
      } else {
        await configService.createPriceConfig(formData);
      }
      navigate('/settings?tab=3');
    } catch (error: any) {
      console.error('Error saving pricing config:', error);
      setError(error.response?.data?.message || 'Error al guardar la configuración de precios');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreatePriceConfigDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const seasons = [
    { value: 'regular', label: 'Estándar' },
    { value: 'high', label: 'Temporada Alta' },
    { value: 'low', label: 'Temporada Baja' },
    { value: 'peak', label: 'Temporada Pico/Festivos' }
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
          {isEdit ? 'Editar Tarifa' : 'Nueva Tarifa'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
          Configure las tarifas de renta por tipo de vehículo y temporada
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
              Información de la Tarifa
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Vehicle Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo de Vehículo</InputLabel>
                  <Select
                    value={formData.vehicleTypeId}
                    onChange={(e) => handleChange('vehicleTypeId', e.target.value)}
                    label="Tipo de Vehículo"
                  >
                    <MenuItem value={0} disabled>
                      Seleccione un tipo
                    </MenuItem>
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Location */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    value={formData.locationId}
                    onChange={(e) => handleChange('locationId', e.target.value)}
                    label="Ubicación"
                  >
                    {locations.map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Season */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Temporada</InputLabel>
                  <Select
                    value={formData.season}
                    onChange={(e) => handleChange('season', e.target.value)}
                    label="Temporada"
                  >
                    {seasons.map((season) => (
                      <MenuItem key={season.value} value={season.value}>
                        {season.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Minimum Rental Days */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Días Mínimos de Renta"
                  value={formData.minimumRentalDays}
                  onChange={(e) => handleChange('minimumRentalDays', parseInt(e.target.value) || 1)}
                  InputProps={{
                    inputProps: { min: 1, step: 1 }
                  }}
                  helperText="Mínimo de días requeridos para rentar"
                />
              </Grid>

              {/* Rates Section */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                  Tarifas Base
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Daily Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Tarifa Diaria"
                  value={formData.dailyRate}
                  onChange={(e) => handleChange('dailyRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Precio por día de renta"
                />
              </Grid>

              {/* Weekly Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarifa Semanal"
                  value={formData.weeklyRate}
                  onChange={(e) => handleChange('weeklyRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Precio por semana de renta"
                />
              </Grid>

              {/* Monthly Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarifa Mensual"
                  value={formData.monthlyRate}
                  onChange={(e) => handleChange('monthlyRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Precio por mes de renta"
                />
              </Grid>

              {/* Extra Charges Section */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                  Cargos Adicionales
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Extra Hour Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarifa por Hora Extra"
                  value={formData.extraHourRate}
                  onChange={(e) => handleChange('extraHourRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Costo por hora adicional"
                />
              </Grid>

              {/* Extra Day Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarifa por Día Extra"
                  value={formData.extraDayRate}
                  onChange={(e) => handleChange('extraDayRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Costo por día adicional"
                />
              </Grid>

              {/* Late Fee Per Day */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Multa por Día de Retraso"
                  value={formData.lateFeePerDay}
                  onChange={(e) => handleChange('lateFeePerDay', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Multa diaria por devolución tardía"
                />
              </Grid>

              {/* Deposits and Insurance Section */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                  Depósitos y Seguros
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Deposit Amount */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monto de Depósito"
                  value={formData.depositAmount}
                  onChange={(e) => handleChange('depositAmount', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Depósito requerido al iniciar renta"
                />
              </Grid>

              {/* Insurance Rate */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tarifa de Seguro Diario"
                  value={formData.insuranceRate}
                  onChange={(e) => handleChange('insuranceRate', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  helperText="Costo diario del seguro"
                />
              </Grid>

              {/* Discount Percentage */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Porcentaje de Descuento"
                  value={formData.discountPercentage}
                  onChange={(e) => handleChange('discountPercentage', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PercentIcon />
                      </InputAdornment>
                    ),
                    inputProps: { min: 0, max: 100, step: 0.01 }
                  }}
                  helperText="Descuento aplicable (0-100%)"
                />
              </Grid>

              {/* Effective Dates Section */}
              <Grid item xs={12}>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                  Vigencia
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Grid>

              {/* Effective From */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Vigente Desde"
                  value={formData.effectiveFrom}
                  onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                  InputLabelProps={{
                    shrink: true
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon />
                      </InputAdornment>
                    )
                  }}
                  helperText="Fecha de inicio de esta tarifa"
                />
              </Grid>

              {/* Effective Until */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Vigente Hasta (Opcional)"
                  value={formData.effectiveUntil || ''}
                  onChange={(e) => handleChange('effectiveUntil', e.target.value)}
                  InputLabelProps={{
                    shrink: true
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon />
                      </InputAdornment>
                    )
                  }}
                  helperText="Deja vacío para que no tenga fecha de expiración"
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notas (Opcional)"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Información adicional sobre esta configuración de precios..."
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate('/settings?tab=3')}
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
                  bgcolor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: isDarkMode ? '#7c3aed' : '#7c3aed'
                  }
                }}
              >
                {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Tarifa'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </form>

      {/* Help Card */}
      <Card sx={{ mt: 3, bgcolor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : alpha('#3b82f6', 0.05) }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#3b82f6' }}>
            Consejos para configurar tarifas
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Tarifa Semanal:</strong> Generalmente es 6-6.5 veces la tarifa diaria (descuento del 7-15%)
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Tarifa Mensual:</strong> Generalmente es 20-25 veces la tarifa diaria (descuento del 17-33%)
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Temporada Alta:</strong> Incrementa las tarifas en un 20-50% durante épocas de mayor demanda
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Temporada Baja:</strong> Reduce las tarifas en un 10-30% para incentivar rentas
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                <strong>Depósito:</strong> Típicamente 20-50% del valor total estimado de la renta
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>

      {/* Example Card */}
      <Card sx={{ mt: 3, bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : alpha('#10b981', 0.05) }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#10b981' }}>
            Ejemplo de configuración
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Para un Sedán en temporada estándar:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <li>
              <Typography variant="body2" color="text.secondary">
                Tarifa Diaria: $500.00 | Semanal: $3,000.00 | Mensual: $12,000.00
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Depósito: $2,500.00 (50% de renta semanal)
              </Typography>
            </li>
            <li>
              <Typography variant="body2" color="text.secondary">
                Seguro Diario: $100.00 | Multa por Retraso: $250.00/día
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PricingConfig;
