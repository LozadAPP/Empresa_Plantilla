/**
 * Formulario para Crear/Editar Renta (CHAT 2)
 * CONVERTIDO A MATERIAL UI - Soporte completo Dark/Light Mode
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Checkbox,
  Chip,
  Collapse,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { AppDispatch } from '../store';
import { createRental } from '../store/slices/rentalSlice';
import { CreateRentalDTO, PaymentMethod } from '../types/rental';
import { ExtraService, SelectedService } from '../types/extraService';
import customerService from '../services/customerService';
import vehicleService from '../services/vehicleService';
import extraServiceService from '../services/extraServiceService';
import { locationService } from '../services/locationService';
import { differenceInDays } from 'date-fns';

const RentalForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [servicesExpanded, setServicesExpanded] = useState(true);

  const [formData, setFormData] = useState<CreateRentalDTO>({
    customer_id: 0,
    vehicle_id: 0,
    location_id: 0,
    return_location_id: undefined,
    start_date: '',
    end_date: '',
    insurance_amount: 0,
    deposit_amount: 0,
    shipping_cost: 0,
    price_adjustment: 0,
    adjustment_reason: '',
    payment_method: undefined,
    start_mileage: undefined,
    fuel_level_start: '',
    discount_percentage: 0,
    extras_amount: 0,
    notes: ''
  });

  const [calculated, setCalculated] = useState({
    days: 0,
    subtotal: 0,
    discount: 0,
    insurance: 0,
    extras: 0,
    shipping: 0,
    adjustment: 0,
    subtotalWithExtras: 0,
    tax: 0,
    total: 0
  });

  useEffect(() => {
    loadCustomers();
    loadVehicles();
    loadLocations();
    loadExtraServices();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [
    formData.start_date,
    formData.end_date,
    formData.vehicle_id,
    formData.insurance_amount,
    formData.discount_percentage,
    formData.shipping_cost,
    formData.price_adjustment,
    selectedServices
  ]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll({});
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await vehicleService.getAvailable();
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await locationService.getLocationsDropdown();
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadExtraServices = async () => {
    try {
      const response = await extraServiceService.getActiveServices();
      setExtraServices(response.data || []);
    } catch (error) {
      console.error('Error loading extra services:', error);
    }
  };

  // Handle service selection
  const handleServiceToggle = (service: ExtraService) => {
    setSelectedServices(prev => {
      const existingIndex = prev.findIndex(s => s.extra_service_id === service.id);
      if (existingIndex >= 0) {
        // Remove service
        return prev.filter(s => s.extra_service_id !== service.id);
      } else {
        // Add service
        const days = calculated.days || 1;
        const subtotal = service.price_type === 'per_day'
          ? service.price * days
          : service.price;
        return [...prev, {
          extra_service_id: service.id,
          quantity: 1,
          unit_price: service.price,
          days: service.price_type === 'per_day' ? days : 1,
          subtotal,
          service
        }];
      }
    });
  };

  // Calculate total for selected services
  const calculateServicesTotal = (): number => {
    return selectedServices.reduce((total, s) => {
      const days = calculated.days || 1;
      if (s.service?.price_type === 'per_day') {
        return total + (s.unit_price * days);
      }
      return total + s.subtotal;
    }, 0);
  };

  // Get category label in Spanish
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'accessory': return 'Accesorios';
      case 'insurance': return 'Seguros';
      case 'service': return 'Servicios';
      default: return category;
    }
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'accessory': return '#3b82f6';
      case 'insurance': return '#10b981';
      case 'service': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  const calculateTotals = () => {
    if (!formData.start_date || !formData.end_date || !formData.vehicle_id) return;

    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const days = Math.max(1, differenceInDays(end, start) + 1);

    const selectedVehicle = vehicles.find(v => v.id === Number(formData.vehicle_id));
    if (!selectedVehicle) return;

    const dailyRate = selectedVehicle.daily_rate || 0;
    const subtotal = days * dailyRate;
    const discountPercentage = Number(formData.discount_percentage) || 0;
    const discount = subtotal * (discountPercentage / 100);
    const subtotalAfterDiscount = subtotal - discount;
    const insurance = Number(formData.insurance_amount) || 0;

    // Calculate extras from selected services
    const extras = selectedServices.reduce((total, s) => {
      if (s.service?.price_type === 'per_day') {
        return total + (s.unit_price * days);
      }
      return total + s.subtotal;
    }, 0);

    // New fields: shipping and adjustment
    const shipping = Number(formData.shipping_cost) || 0;
    const adjustment = Number(formData.price_adjustment) || 0;

    const subtotalWithExtras = subtotalAfterDiscount + insurance + extras + shipping + adjustment;
    const tax = subtotalWithExtras * 0.16;
    const total = subtotalWithExtras + tax;

    setCalculated({ days, subtotal, discount, insurance, extras, shipping, adjustment, subtotalWithExtras, tax, total });

    // Update formData extras_amount
    setFormData(prev => ({ ...prev, extras_amount: extras }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.vehicle_id || !formData.location_id) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' });
      return;
    }

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDateRegex.test(formData.start_date) || !isoDateRegex.test(formData.end_date)) {
      enqueueSnackbar('Formato de fecha inválido. Use el selector de calendario.', { variant: 'warning' });
      return;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      enqueueSnackbar('La fecha de inicio no puede ser en el pasado', { variant: 'warning' });
      return;
    }

    if (endDate <= startDate) {
      enqueueSnackbar('La fecha de fin debe ser después de la fecha de inicio', { variant: 'warning' });
      return;
    }

    // Validar razón del ajuste si hay ajuste de precio
    if (Number(formData.price_adjustment) !== 0 && !formData.adjustment_reason?.trim()) {
      enqueueSnackbar('Debe proporcionar una razón para el ajuste de precio', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      await dispatch(createRental(formData)).unwrap();
      enqueueSnackbar('¡Renta creada exitosamente!', { variant: 'success' });
      navigate('/rentals');
    } catch (error: any) {
      enqueueSnackbar(`Error: ${error}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Estilos comunes
  const paperStyles = {
    p: { xs: 2, sm: 3 },
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: 2,
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  // Input styles para touch-friendly
  const inputProps = {
    sx: { minHeight: { xs: 48, sm: 40 } }
  };

  const sectionTitleStyles = {
    fontSize: '1.1rem',
    fontWeight: 600,
    mb: 3,
    pb: 1,
    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
          Nueva Renta
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completa todos los campos para crear una nueva renta
        </Typography>
      </Box>

      <form onSubmit={handleSubmit} data-testid="rental-form">
        <Paper sx={{ ...paperStyles, mb: 3 }}>
          {/* SECCIÓN 1: Información Básica */}
          <Typography sx={sectionTitleStyles}>
            1. Información Básica
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Cliente */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                <InputLabel>Cliente *</InputLabel>
                <Select
                  name="customer_id"
                  value={formData.customer_id || ''}
                  onChange={(e) => handleChange({ target: { name: 'customer_id', value: e.target.value } })}
                  label="Cliente *"
                  required
                  data-testid="rental-customer-select"
                  sx={inputProps.sx}
                >
                  <MenuItem value="">Seleccionar cliente</MenuItem>
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email || 'Sin email'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Vehículo */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                <InputLabel>Vehículo *</InputLabel>
                <Select
                  name="vehicle_id"
                  value={formData.vehicle_id || ''}
                  onChange={(e) => handleChange({ target: { name: 'vehicle_id', value: e.target.value } })}
                  label="Vehículo *"
                  required
                  data-testid="rental-vehicle-select"
                  sx={inputProps.sx}
                >
                  <MenuItem value="">Seleccionar vehículo</MenuItem>
                  {vehicles.map(vehicle => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate}) - ${vehicle.daily_rate}/día
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sucursal de Recolección */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                <InputLabel>Sucursal de Recolección *</InputLabel>
                <Select
                  name="location_id"
                  value={formData.location_id || ''}
                  onChange={(e) => handleChange({ target: { name: 'location_id', value: e.target.value } })}
                  label="Sucursal de Recolección *"
                  required
                  data-testid="rental-location-select"
                  sx={inputProps.sx}
                >
                  <MenuItem value="">Seleccionar sucursal</MenuItem>
                  {locations.map(location => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sucursal de Devolución */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                <InputLabel>Sucursal de Devolución</InputLabel>
                <Select
                  name="return_location_id"
                  value={formData.return_location_id || ''}
                  onChange={(e) => handleChange({ target: { name: 'return_location_id', value: e.target.value } })}
                  label="Sucursal de Devolución"
                  sx={inputProps.sx}
                >
                  <MenuItem value="">Misma sucursal de recolección</MenuItem>
                  {locations.map(location => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Si el cliente devolverá en otra sucursal (one-way rental)
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ ...paperStyles, mb: 3 }}>
          {/* SECCIÓN 2: Fechas y Condiciones */}
          <Typography sx={sectionTitleStyles}>
            2. Fechas y Condiciones Iniciales del Vehículo
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Fecha inicio */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Fecha de Inicio *"
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                InputProps={{ sx: inputProps.sx }}
                data-testid="rental-start-date-input"
              />
            </Grid>

            {/* Fecha fin */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Fecha de Fin *"
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: formData.start_date || new Date().toISOString().split('T')[0] }}
                InputProps={{ sx: inputProps.sx }}
                data-testid="rental-end-date-input"
              />
            </Grid>

            {/* Kilometraje Inicial */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Kilometraje Inicial (KM) *"
                type="number"
                name="start_mileage"
                value={formData.start_mileage || ''}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
                InputProps={{ sx: inputProps.sx }}
                placeholder="Ej: 45000"
                helperText="Registra el KM actual del vehículo antes de entregarlo"
              />
            </Grid>

            {/* Nivel de Combustible */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size={isMobile ? "medium" : "small"}>
                <InputLabel>Nivel de Combustible Inicial *</InputLabel>
                <Select
                  name="fuel_level_start"
                  value={formData.fuel_level_start}
                  onChange={(e) => handleChange({ target: { name: 'fuel_level_start', value: e.target.value } })}
                  label="Nivel de Combustible Inicial *"
                  required
                  sx={inputProps.sx}
                >
                  <MenuItem value="">Seleccionar nivel</MenuItem>
                  <MenuItem value="Empty">Vacío</MenuItem>
                  <MenuItem value="1/4">1/4 Tanque</MenuItem>
                  <MenuItem value="1/2">1/2 Tanque</MenuItem>
                  <MenuItem value="3/4">3/4 Tanque</MenuItem>
                  <MenuItem value="Full">Tanque Lleno</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Nivel de combustible al momento de entregar el vehículo
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* SECCIÓN 3: Servicios Adicionales */}
        <Paper sx={{ ...paperStyles, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              mb: servicesExpanded ? 2 : 0
            }}
            onClick={() => setServicesExpanded(!servicesExpanded)}
          >
            <Typography sx={{ ...sectionTitleStyles, mb: 0, pb: 0, borderBottom: 'none' }}>
              3. Servicios Adicionales
              {selectedServices.length > 0 && (
                <Chip
                  label={`${selectedServices.length} seleccionados`}
                  size="small"
                  sx={{
                    ml: 2,
                    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                    color: isDarkMode ? '#a78bfa' : '#8b5cf6'
                  }}
                />
              )}
            </Typography>
            <IconButton size="small">
              {servicesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={servicesExpanded}>
            {extraServices.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                Cargando servicios disponibles...
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {/* Group services by category */}
                {['accessory', 'insurance', 'service'].map(category => {
                  const categoryServices = extraServices.filter(s => s.category === category);
                  if (categoryServices.length === 0) return null;

                  return (
                    <Grid item xs={12} key={category}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: getCategoryColor(category),
                          fontWeight: 600,
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        {getCategoryLabel(category)}
                      </Typography>
                      <Grid container spacing={1}>
                        {categoryServices.map(service => {
                          const isSelected = selectedServices.some(s => s.extra_service_id === service.id);
                          const days = calculated.days || 1;
                          const serviceTotal = service.price_type === 'per_day'
                            ? service.price * days
                            : service.price;

                          return (
                            <Grid item xs={12} sm={6} md={4} key={service.id}>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  cursor: 'pointer',
                                  border: `1px solid ${isSelected ? getCategoryColor(category) : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
                                  borderRadius: 1,
                                  background: isSelected
                                    ? (isDarkMode ? `${getCategoryColor(category)}15` : `${getCategoryColor(category)}10`)
                                    : 'transparent',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    borderColor: getCategoryColor(category),
                                    background: isDarkMode ? `${getCategoryColor(category)}10` : `${getCategoryColor(category)}05`
                                  }
                                }}
                                onClick={() => handleServiceToggle(service)}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <Checkbox
                                    checked={isSelected}
                                    size="small"
                                    sx={{
                                      p: 0,
                                      color: getCategoryColor(category),
                                      '&.Mui-checked': { color: getCategoryColor(category) }
                                    }}
                                  />
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={500} noWrap>
                                      {service.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        ${service.price.toFixed(2)}
                                        {service.price_type === 'per_day' ? '/día' : ' único'}
                                      </Typography>
                                      {isSelected && (
                                        <Typography
                                          variant="caption"
                                          fontWeight={600}
                                          sx={{ color: getCategoryColor(category) }}
                                        >
                                          ${serviceTotal.toFixed(2)}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {/* Selected services summary */}
            {selectedServices.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Servicios Adicionales:
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: isDarkMode ? '#a78bfa' : '#8b5cf6' }}>
                    ${calculated.extras.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </Collapse>
        </Paper>

        <Paper sx={{ ...paperStyles, mb: 3 }}>
          {/* SECCIÓN 4: Costos y Pagos */}
          <Typography sx={sectionTitleStyles}>
            4. Costos y Método de Pago
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Descuento */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Descuento (%)"
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleChange}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                InputProps={{ sx: inputProps.sx }}
                placeholder="Ej: 10 para 10%"
                helperText="Para clientes frecuentes o promociones especiales"
              />
            </Grid>

            {/* Seguro */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Costo del Seguro"
                type="number"
                name="insurance_amount"
                value={formData.insurance_amount}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ sx: inputProps.sx }}
                placeholder="Ej: 150"
                helperText="Seguro opcional (básico, premium, full coverage)"
              />
            </Grid>

            {/* Depósito */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Depósito de Garantía"
                type="number"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ sx: inputProps.sx }}
                placeholder="Ej: 500"
                helperText="Depósito reembolsable al devolver el vehículo"
              />
            </Grid>

            {/* Método de Pago */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                Método de Pago *
              </Typography>
              <FormControl component="fieldset" sx={{ width: '100%' }}>
                <RadioGroup
                  row={!isMobile}
                  name="payment_method"
                  value={formData.payment_method || ''}
                  onChange={handleChange}
                  sx={{
                    gap: { xs: 1.5, sm: 2 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    flexWrap: 'wrap'
                  }}
                >
                  {[
                    { value: PaymentMethod.CASH, label: 'Efectivo' },
                    { value: PaymentMethod.CREDIT_CARD, label: 'Tarjeta Crédito' },
                    { value: PaymentMethod.DEBIT_CARD, label: 'Tarjeta Débito' },
                    { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
                    { value: PaymentMethod.CHECK, label: 'Cheque' }
                  ].map(option => (
                    <Paper
                      key={option.value}
                      sx={{
                        px: 2,
                        py: { xs: 1.5, sm: 1 },
                        border: `1px solid ${formData.payment_method === option.value ? '#8b5cf6' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}`,
                        borderRadius: 1,
                        background: formData.payment_method === option.value
                          ? (isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)')
                          : 'transparent',
                        transition: 'all 0.2s',
                        width: { xs: '100%', sm: 'auto' }
                      }}
                    >
                      <FormControlLabel
                        value={option.value}
                        control={<Radio size="small" sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#8b5cf6' } }} />}
                        label={option.label}
                        sx={{ m: 0, width: '100%' }}
                      />
                    </Paper>
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* SECCIÓN 5: Ajustes de Precio */}
        <Paper sx={{ ...paperStyles, mb: 3 }}>
          <Typography sx={sectionTitleStyles}>
            5. Ajustes de Precio
          </Typography>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Costo de Envío */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Costo de Envío/Transporte"
                type="number"
                name="shipping_cost"
                value={formData.shipping_cost}
                onChange={handleChange}
                inputProps={{ min: 0, step: 0.01 }}
                InputProps={{ sx: inputProps.sx }}
                placeholder="Ej: 300"
                helperText="Si el vehículo se entrega en domicilio del cliente"
              />
            </Grid>

            {/* Ajuste de Precio */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size={isMobile ? "medium" : "small"}
                label="Ajuste de Precio (+/-)"
                type="number"
                name="price_adjustment"
                value={formData.price_adjustment}
                onChange={handleChange}
                inputProps={{ step: 0.01 }}
                InputProps={{ sx: inputProps.sx }}
                placeholder="Ej: -100 o 50"
                helperText="Positivo = cargo adicional, Negativo = descuento extra"
              />
            </Grid>

            {/* Razón del Ajuste (solo si hay ajuste) */}
            {Number(formData.price_adjustment) !== 0 && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size={isMobile ? "medium" : "small"}
                  label="Razón del Ajuste *"
                  name="adjustment_reason"
                  value={formData.adjustment_reason}
                  onChange={handleChange}
                  required={Number(formData.price_adjustment) !== 0}
                  multiline
                  rows={2}
                  InputProps={{ sx: inputProps.sx }}
                  placeholder="Ej: Descuento por cliente frecuente, Cargo por entrega nocturna, etc."
                  helperText="Obligatorio cuando hay ajuste de precio"
                  error={Number(formData.price_adjustment) !== 0 && !formData.adjustment_reason}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        <Paper sx={{ ...paperStyles, mb: 3 }}>
          {/* SECCIÓN 6: Notas */}
          <Typography sx={sectionTitleStyles}>
            6. Notas y Observaciones
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            size={isMobile ? "medium" : "small"}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Ej: Cliente solicita GPS adicional. Vehículo con raspón pequeño en puerta trasera derecha (ya documentado)."
            helperText="Cualquier observación importante sobre esta renta"
          />
        </Paper>

        {/* Resumen de Cálculo */}
        {calculated.days > 0 && (
          <Paper
            sx={{
              ...paperStyles,
              mb: 3,
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05))',
              border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              💰 Resumen de Cálculo
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Días de renta:</Typography>
                  <Typography variant="body2" fontWeight={600}>{calculated.days}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                  <Typography variant="body2" fontWeight={500}>${calculated.subtotal.toFixed(2)}</Typography>
                </Box>
              </Grid>
              {calculated.discount > 0 && (
                <Grid item xs={6} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <Typography variant="body2">Descuento:</Typography>
                    <Typography variant="body2" fontWeight={500}>-${calculated.discount.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              )}
              {calculated.insurance > 0 && (
                <Grid item xs={6} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Seguro:</Typography>
                    <Typography variant="body2" fontWeight={500}>${calculated.insurance.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              )}
              {calculated.extras > 0 && (
                <Grid item xs={6} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Servicios ({selectedServices.length}):</Typography>
                    <Typography variant="body2" fontWeight={500}>${calculated.extras.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              )}
              {calculated.shipping > 0 && (
                <Grid item xs={6} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Envío:</Typography>
                    <Typography variant="body2" fontWeight={500}>${calculated.shipping.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              )}
              {calculated.adjustment !== 0 && (
                <Grid item xs={6} md={4}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: calculated.adjustment > 0 ? '#ef4444' : '#10b981' }}>
                    <Typography variant="body2">Ajuste:</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {calculated.adjustment > 0 ? '+' : ''}${calculated.adjustment.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={6} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">IVA (16%):</Typography>
                  <Typography variant="body2" fontWeight={500}>${calculated.tax.toFixed(2)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1, borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">TOTAL A PAGAR:</Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: isDarkMode ? '#a78bfa' : '#8b5cf6' }}>
                    ${calculated.total.toFixed(2)} MXN
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Botones */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          justifyContent: { xs: 'stretch', sm: 'space-between' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 }
        }}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/rentals')}
            data-testid="rental-cancel-button"
            sx={{
              borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              width: { xs: '100%', sm: 'auto' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || calculated.days === 0}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
            data-testid="rental-submit-button"
            sx={{
              px: { xs: 2, sm: 4 },
              py: { xs: 1.5, sm: 1 },
              width: { xs: '100%', sm: 'auto' },
              background: isDarkMode
                ? 'linear-gradient(135deg, #60a5fa, #a78bfa)'
                : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              '&:hover': {
                background: isDarkMode
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'linear-gradient(135deg, #2563eb, #7c3aed)'
              },
              '&:disabled': {
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }
            }}
          >
            {loading ? 'Creando Renta...' : 'Crear Renta'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default RentalForm;
