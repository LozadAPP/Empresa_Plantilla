/**
 * Formulario de Cotización (Crear/Editar)
 * Incluye selección de cliente/vehículo y cálculos en vivo
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Autocomplete,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import quoteService from '../services/quoteService';
import customerService from '../services/customerService';
import vehicleService from '../services/vehicleService';
import { locationService } from '../services/locationService';
import { useLocation as useLocationContext } from '../contexts/LocationContext';

interface CustomerOption {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface VehicleOption {
  id: number;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  daily_rate: number;
  status?: string;
}

interface LocationOption {
  id: number;
  name: string;
}

const QuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { selectedLocationId } = useLocationContext();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [locationId, setLocationId] = useState<number | null>(selectedLocationId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(16);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [extrasAmount, setExtrasAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [validDays, setValidDays] = useState<number>(30);
  const [notes, setNotes] = useState('');

  // Data state
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, vehiclesRes, locationsRes] = await Promise.all([
          customerService.getActive(),
          vehicleService.getAvailable(),
          locationService.getLocationsDropdown()
        ]);

        if (customersRes.success) setCustomers(customersRes.data || []);
        if (vehiclesRes.success) setVehicles(vehiclesRes.data || []);
        if (locationsRes.success) setLocations(locationsRes.data || []);
      } catch (error) {
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Load existing quote for editing
  useEffect(() => {
    if (isEditing && id) {
      const loadQuote = async () => {
        setLoading(true);
        try {
          const response = await quoteService.getById(Number(id));
          if (response.success) {
            const q = response.data;
            setCustomerId(q.customer_id);
            setVehicleId(q.vehicle_id || null);
            setLocationId(q.location_id || null);
            setStartDate(q.start_date ? new Date(q.start_date).toISOString().split('T')[0] : '');
            setEndDate(q.end_date ? new Date(q.end_date).toISOString().split('T')[0] : '');
            setDailyRate(Number(q.daily_rate) || 0);
            setTaxPercentage(Number(q.tax_percentage) || 16);
            setDiscountPercentage(Number(q.discount_percentage) || 0);
            setInsuranceAmount(Number(q.insurance_amount) || 0);
            setExtrasAmount(Number(q.extras_amount) || 0);
            setShippingCost(Number(q.shipping_cost) || 0);
            setDepositAmount(Number(q.deposit_amount) || 0);
            setNotes(q.notes || '');
          }
        } catch (error) {
          enqueueSnackbar('Error al cargar cotización', { variant: 'error' });
          navigate('/quotes');
        } finally {
          setLoading(false);
        }
      };
      loadQuote();
    }
  }, [id, isEditing, navigate, enqueueSnackbar]);

  // Auto-fill daily rate when vehicle changes
  useEffect(() => {
    if (vehicleId && !isEditing) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setDailyRate(vehicle.daily_rate);
      }
    }
  }, [vehicleId, vehicles, isEditing]);

  // Live calculation
  const calculation = useMemo(() => {
    if (!startDate || !endDate || !dailyRate) {
      return { days: 0, subtotal: 0, discountAmount: 0, taxAmount: 0, total: 0 };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const subtotal = days * dailyRate;
    const discountAmount = subtotal * (discountPercentage / 100);
    const afterDiscount = subtotal - discountAmount + insuranceAmount + extrasAmount + shippingCost;
    const taxAmount = afterDiscount * (taxPercentage / 100);
    const total = afterDiscount + taxAmount;

    return {
      days,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  }, [startDate, endDate, dailyRate, taxPercentage, discountPercentage, insuranceAmount, extrasAmount, shippingCost]);

  const handleSave = async (sendAfterSave = false) => {
    if (!customerId) {
      enqueueSnackbar('Selecciona un cliente', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        customer_id: customerId,
        vehicle_id: vehicleId || undefined,
        location_id: locationId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        daily_rate: dailyRate || undefined,
        tax_percentage: taxPercentage,
        discount_percentage: discountPercentage,
        insurance_amount: insuranceAmount,
        extras_amount: extrasAmount,
        shipping_cost: shippingCost,
        deposit_amount: depositAmount,
        valid_days: validDays,
        notes: notes || undefined
      };

      let response;
      if (isEditing) {
        response = await quoteService.update(Number(id), data);
      } else {
        response = await quoteService.create(data);
      }

      if (response.success) {
        enqueueSnackbar(isEditing ? 'Cotización actualizada' : 'Cotización creada exitosamente', { variant: 'success' });

        if (sendAfterSave && response.data?.id) {
          try {
            await quoteService.send(response.data.id);
            enqueueSnackbar('Cotización enviada al cliente', { variant: 'info' });
          } catch (sendError) {
            enqueueSnackbar('Cotización guardada pero no se pudo enviar', { variant: 'warning' });
          }
        }

        navigate(`/quotes/${response.data?.id || ''}`);
      }
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al guardar cotización', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const paperSx = {
    p: 3,
    borderRadius: '16px',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
  };

  const selectedCustomer = customers.find(c => c.id === customerId) || null;
  const selectedVehicle = vehicles.find(v => v.id === vehicleId) || null;

  if (loading || loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/quotes')}
          sx={{ color: 'text.secondary', textTransform: 'none' }}
        >
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
          {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column - Form */}
        <Grid item xs={12} md={8}>
          {/* Client & Vehicle */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Información General
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={customers}
                  value={selectedCustomer}
                  onChange={(_, val) => setCustomerId(val?.id || null)}
                  getOptionLabel={(opt) => opt.name}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{opt.name}</Typography>
                        {opt.email && <Typography variant="caption" color="text.secondary">{opt.email}</Typography>}
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Cliente *" placeholder="Buscar cliente..." />
                  )}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={vehicles}
                  value={selectedVehicle}
                  onChange={(_, val) => setVehicleId(val?.id || null)}
                  getOptionLabel={(opt) => `${opt.make} ${opt.model} (${opt.license_plate})`}
                  renderOption={(props, opt) => (
                    <li {...props} key={opt.id}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {opt.make} {opt.model} ({opt.year})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {opt.license_plate} — {formatCurrency(opt.daily_rate)}/día
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Vehículo" placeholder="Buscar vehículo..." />
                  )}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    label="Ubicación"
                    value={locationId || ''}
                    onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <MenuItem value="">Sin ubicación</MenuItem>
                    {locations.map(loc => (
                      <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vigencia (días)"
                  type="number"
                  size="small"
                  fullWidth
                  value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value) || 30)}
                  inputProps={{ min: 1, max: 365 }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Dates & Pricing */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Fechas y Precios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha inicio"
                  type="date"
                  size="small"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha fin"
                  type="date"
                  size="small"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Tarifa diaria"
                  type="number"
                  size="small"
                  fullWidth
                  value={dailyRate || ''}
                  onChange={(e) => setDailyRate(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Descuento (%)"
                  type="number"
                  size="small"
                  fullWidth
                  value={discountPercentage || ''}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Seguro"
                  type="number"
                  size="small"
                  fullWidth
                  value={insuranceAmount || ''}
                  onChange={(e) => setInsuranceAmount(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Extras"
                  type="number"
                  size="small"
                  fullWidth
                  value={extrasAmount || ''}
                  onChange={(e) => setExtrasAmount(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Envío"
                  type="number"
                  size="small"
                  fullWidth
                  value={shippingCost || ''}
                  onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="IVA (%)"
                  type="number"
                  size="small"
                  fullWidth
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(Number(e.target.value) || 0)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Depósito"
                  type="number"
                  size="small"
                  fullWidth
                  value={depositAmount || ''}
                  onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Notas
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Notas adicionales para la cotización..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
            />
          </Paper>
        </Grid>

        {/* Right column - Summary */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              ...paperSx,
              position: { md: 'sticky' },
              top: { md: 100 }
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Resumen
            </Typography>

            {calculation.days > 0 ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Días:</Typography>
                  <Typography variant="body2" fontWeight={600}>{calculation.days}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Tarifa diaria:</Typography>
                  <Typography variant="body2">{formatCurrency(dailyRate)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(calculation.subtotal)}</Typography>
                </Box>
                {calculation.discountAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Descuento ({discountPercentage}%):</Typography>
                    <Typography variant="body2" sx={{ color: '#10b981' }}>-{formatCurrency(calculation.discountAmount)}</Typography>
                  </Box>
                )}
                {insuranceAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Seguro:</Typography>
                    <Typography variant="body2">+{formatCurrency(insuranceAmount)}</Typography>
                  </Box>
                )}
                {extrasAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Extras:</Typography>
                    <Typography variant="body2">+{formatCurrency(extrasAmount)}</Typography>
                  </Box>
                )}
                {shippingCost > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Envío:</Typography>
                    <Typography variant="body2">+{formatCurrency(shippingCost)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">IVA ({taxPercentage}%):</Typography>
                  <Typography variant="body2">{formatCurrency(calculation.taxAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Total:</Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0075ff' }}>
                    {formatCurrency(calculation.total)}
                  </Typography>
                </Box>
                {depositAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Depósito:</Typography>
                    <Typography variant="body2">{formatCurrency(depositAmount)}</Typography>
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Selecciona fechas y tarifa para ver el cálculo
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleSave(false)}
                disabled={saving || !customerId}
                fullWidth
                sx={{
                  background: 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { background: 'linear-gradient(90deg, #0060cc 0%, #1ab8e0 100%)' }
                }}
              >
                {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Borrador')}
              </Button>
              {!isEditing && (
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={() => handleSave(true)}
                  disabled={saving || !customerId || calculation.total <= 0}
                  fullWidth
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#0075ff',
                    color: '#0075ff'
                  }}
                >
                  Guardar y Enviar
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuoteForm;
