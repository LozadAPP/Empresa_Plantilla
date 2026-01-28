import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Vehicle, VehicleFormData, VehicleCondition } from '../../types';

/**
 * Validates VIN (Vehicle Identification Number) with checksum verification
 * @param vin - 17 character VIN string
 * @returns { valid: boolean, error?: string }
 */
const validateVIN = (vin: string): { valid: boolean; error?: string } => {
  if (!vin) return { valid: false, error: 'VIN es requerido' };

  const cleanVin = vin.toUpperCase().trim();

  // Check length
  if (cleanVin.length !== 17) {
    return { valid: false, error: 'VIN debe tener exactamente 17 caracteres' };
  }

  // Check for invalid characters (I, O, Q are not allowed in VINs)
  if (/[IOQ]/.test(cleanVin)) {
    return { valid: false, error: 'VIN no puede contener letras I, O o Q' };
  }

  // Check alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
    return { valid: false, error: 'VIN solo puede contener letras (excepto I, O, Q) y números' };
  }

  // Transliteration values for VIN characters
  const transliteration: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };

  // Position weights for checksum calculation
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = cleanVin[i];
    const value = transliteration[char];
    if (value === undefined) {
      return { valid: false, error: 'VIN contiene caracteres inválidos' };
    }
    sum += value * weights[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : remainder.toString();

  // Position 9 (index 8) is the check digit
  if (cleanVin[8] !== checkDigit) {
    return { valid: false, error: 'VIN inválido: dígito verificador incorrecto' };
  }

  return { valid: true };
};

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleFormData, vehicleId?: number) => Promise<void>;
  loading?: boolean;
  initialData?: Vehicle;
  vehicleId?: number;
}

const VehicleForm: React.FC<VehicleFormProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialData,
  vehicleId
}) => {
  const currentYear = new Date().getFullYear();
  const isEditMode = !!initialData || !!vehicleId;

  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    license_plate: '',
    vin: '',
    year: currentYear,
    color: '',
    vehicle_type_id: 1,
    location_id: 1,
    daily_rate: 0,
    purchase_price: 0,
    current_value: 0,
    monthly_depreciation: 0,
    mileage: 0,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    condition: 'excellent',
    is_premium: false,
    has_driver: false,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos iniciales cuando se abre en modo edición
  useEffect(() => {
    if (initialData) {
      setFormData({
        make: initialData.make,
        model: initialData.model,
        license_plate: initialData.license_plate,
        vin: initialData.vin,
        year: initialData.year,
        color: initialData.color || '',
        vehicle_type_id: initialData.vehicle_type_id,
        location_id: initialData.location_id,
        daily_rate: initialData.daily_rate || 0,
        purchase_price: initialData.purchase_price,
        current_value: initialData.current_value,
        monthly_depreciation: initialData.monthly_depreciation,
        mileage: initialData.mileage || 0,
        fuel_type: initialData.fuel_type,
        transmission: initialData.transmission,
        condition: initialData.condition,
        is_premium: initialData.is_premium || false,
        has_driver: initialData.has_driver || false,
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof VehicleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.make.trim()) newErrors.make = 'Marca es requerida';
    if (!formData.model.trim()) newErrors.model = 'Modelo es requerido';
    if (!formData.license_plate.trim()) newErrors.license_plate = 'Placa es requerida';

    // VIN validation with checksum
    const vinValidation = validateVIN(formData.vin);
    if (!vinValidation.valid) {
      newErrors.vin = vinValidation.error || 'VIN inválido';
    }

    // Year validation (more realistic range: 1990 to next year)
    const minYear = 1990;
    if (formData.year < minYear || formData.year > currentYear + 1) {
      newErrors.year = `Año debe estar entre ${minYear} y ${currentYear + 1}`;
    }

    // Daily rate validation
    if (!formData.daily_rate || formData.daily_rate <= 0) {
      newErrors.daily_rate = 'Tarifa diaria debe ser mayor a 0';
    }

    // Price validations
    if (formData.purchase_price <= 0) {
      newErrors.purchase_price = 'Precio de compra debe ser mayor a 0';
    }
    if (formData.current_value < 0) {
      newErrors.current_value = 'Valor actual no puede ser negativo';
    }
    if (formData.monthly_depreciation < 0) {
      newErrors.monthly_depreciation = 'Depreciación no puede ser negativa';
    }

    // Business logic: daily_rate should be reasonable compared to purchase_price
    // Example: daily rate shouldn't exceed 1% of purchase price (too expensive)
    if (formData.daily_rate > formData.purchase_price * 0.01) {
      newErrors.daily_rate = 'Tarifa diaria parece muy alta comparada con el precio de compra';
    }

    // Business logic validations
    if (formData.current_value > formData.purchase_price) {
      newErrors.current_value = 'Valor actual no puede ser mayor al precio de compra';
    }

    // Depreciation coherence (annual depreciation shouldn't exceed purchase price)
    if (formData.monthly_depreciation * 12 > formData.purchase_price) {
      newErrors.monthly_depreciation = 'Depreciación anual excede el precio de compra';
    }

    // License plate format (basic validation)
    if (formData.license_plate.length < 3) {
      newErrors.license_plate = 'Placa debe tener al menos 3 caracteres';
    }

    // Mileage validation
    if (formData.mileage && formData.mileage < 0) {
      newErrors.mileage = 'Kilometraje no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onSubmit(formData, vehicleId);
      handleClose();
    } catch (error) {
      // Error handled by parent
    }
  };

  const handleClose = () => {
    setFormData({
      make: '',
      model: '',
      license_plate: '',
      vin: '',
      year: currentYear,
      color: '',
      vehicle_type_id: 1,
      location_id: 1,
      daily_rate: 0,
      purchase_price: 0,
      current_value: 0,
      monthly_depreciation: 0,
      mileage: 0,
      fuel_type: 'gasoline',
      transmission: 'automatic',
      condition: 'excellent',
      is_premium: false,
      has_driver: false,
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      data-testid="vehicle-form-dialog"
      PaperProps={{
        sx: {
          borderRadius: '16px'
        }
      }}
    >
      <DialogTitle component="div">
        <Typography variant="h6" component="span" fontWeight={600}>
          {isEditMode ? 'Editar Vehículo' : 'Agregar Nuevo Vehículo'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Información Básica */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Marca *"
                value={formData.make}
                onChange={(e) => handleChange('make', e.target.value)}
                error={!!errors.make}
                helperText={errors.make}
                placeholder="Ej: Toyota, Honda, Ford"
                data-testid="vehicle-make-input"
                inputProps={{ 'data-testid': 'vehicle-make-field' }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Modelo *"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                error={!!errors.model}
                helperText={errors.model}
                placeholder="Ej: Corolla, Civic, F-150"
                data-testid="vehicle-model-input"
                inputProps={{ 'data-testid': 'vehicle-model-field' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Año *"
                value={formData.year}
                onChange={(e) => handleChange('year', parseInt(e.target.value))}
                error={!!errors.year}
                helperText={errors.year}
                inputProps={{ min: 1900, max: currentYear + 1, 'data-testid': 'vehicle-year-field' }}
                data-testid="vehicle-year-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Placa *"
                value={formData.license_plate}
                onChange={(e) => handleChange('license_plate', e.target.value.toUpperCase())}
                error={!!errors.license_plate}
                helperText={errors.license_plate}
                placeholder="ABC-1234"
                data-testid="vehicle-plate-input"
                inputProps={{ 'data-testid': 'vehicle-plate-field' }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                placeholder="Ej: Rojo, Azul, Negro"
                data-testid="vehicle-color-input"
                inputProps={{ 'data-testid': 'vehicle-color-field' }}
              />
            </Grid>

            {/* VIN y Especificaciones */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 2 }}>
                Identificación y Especificaciones
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="VIN (Número de Serie) *"
                value={formData.vin}
                onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                error={!!errors.vin}
                helperText={errors.vin || '17 caracteres'}
                placeholder="1HGBH41JXMN109186"
                inputProps={{ maxLength: 17, 'data-testid': 'vehicle-vin-field' }}
                data-testid="vehicle-vin-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth data-testid="vehicle-fuel-control">
                <InputLabel>Tipo de Combustible</InputLabel>
                <Select
                  value={formData.fuel_type}
                  label="Tipo de Combustible"
                  onChange={(e) => handleChange('fuel_type', e.target.value)}
                  data-testid="vehicle-fuel-select"
                  inputProps={{ 'data-testid': 'vehicle-fuel-field' }}
                >
                  <MenuItem value="gasoline" data-testid="fuel-gasoline">Gasolina</MenuItem>
                  <MenuItem value="diesel" data-testid="fuel-diesel">Diesel</MenuItem>
                  <MenuItem value="electric" data-testid="fuel-electric">Eléctrico</MenuItem>
                  <MenuItem value="hybrid" data-testid="fuel-hybrid">Híbrido</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth data-testid="vehicle-transmission-control">
                <InputLabel>Transmisión</InputLabel>
                <Select
                  value={formData.transmission}
                  label="Transmisión"
                  onChange={(e) => handleChange('transmission', e.target.value)}
                  data-testid="vehicle-transmission-select"
                  inputProps={{ 'data-testid': 'vehicle-transmission-field' }}
                >
                  <MenuItem value="automatic" data-testid="transmission-automatic">Automática</MenuItem>
                  <MenuItem value="manual" data-testid="transmission-manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth data-testid="vehicle-condition-control">
                <InputLabel>Condición *</InputLabel>
                <Select
                  value={formData.condition}
                  label="Condición *"
                  onChange={(e) => handleChange('condition', e.target.value as VehicleCondition)}
                  data-testid="vehicle-condition-select"
                  inputProps={{ 'data-testid': 'vehicle-condition-field' }}
                >
                  <MenuItem value="excellent" data-testid="condition-excellent">Excelente</MenuItem>
                  <MenuItem value="good" data-testid="condition-good">Bueno</MenuItem>
                  <MenuItem value="fair" data-testid="condition-fair">Regular</MenuItem>
                  <MenuItem value="poor" data-testid="condition-poor">Malo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Información Financiera */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 2 }}>
                Información Financiera
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Tarifa Diaria de Renta *"
                value={formData.daily_rate}
                onChange={(e) => handleChange('daily_rate', parseFloat(e.target.value))}
                error={!!errors.daily_rate}
                helperText={errors.daily_rate || 'Precio por día de renta'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                inputProps={{ min: 0, step: 0.01, 'data-testid': 'vehicle-daily-rate-field' }}
                data-testid="vehicle-daily-rate-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Precio de Compra *"
                value={formData.purchase_price}
                onChange={(e) => handleChange('purchase_price', parseFloat(e.target.value))}
                error={!!errors.purchase_price}
                helperText={errors.purchase_price}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                inputProps={{ min: 0, step: 0.01, 'data-testid': 'vehicle-purchase-price-field' }}
                data-testid="vehicle-purchase-price-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Valor Actual *"
                value={formData.current_value}
                onChange={(e) => handleChange('current_value', parseFloat(e.target.value))}
                error={!!errors.current_value}
                helperText={errors.current_value}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                inputProps={{ min: 0, step: 0.01, 'data-testid': 'vehicle-current-value-field' }}
                data-testid="vehicle-current-value-input"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Depreciación Mensual *"
                value={formData.monthly_depreciation}
                onChange={(e) => handleChange('monthly_depreciation', parseFloat(e.target.value))}
                error={!!errors.monthly_depreciation}
                helperText={errors.monthly_depreciation}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
                inputProps={{ min: 0, step: 0.01, 'data-testid': 'vehicle-depreciation-field' }}
                data-testid="vehicle-depreciation-input"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Kilometraje"
                value={formData.mileage}
                onChange={(e) => handleChange('mileage', parseInt(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">km</InputAdornment>
                }}
                inputProps={{ min: 0, 'data-testid': 'vehicle-mileage-field' }}
                data-testid="vehicle-mileage-input"
              />
            </Grid>

            {/* Opciones */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom sx={{ mt: 2 }}>
                Opciones Adicionales
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_premium}
                    onChange={(e) => handleChange('is_premium', e.target.checked)}
                    data-testid="vehicle-premium-checkbox"
                    inputProps={{ 'data-testid': 'vehicle-premium-field' } as any}
                  />
                }
                label="Vehículo Premium"
                data-testid="vehicle-premium-label"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.has_driver}
                    onChange={(e) => handleChange('has_driver', e.target.checked)}
                    data-testid="vehicle-driver-checkbox"
                    inputProps={{ 'data-testid': 'vehicle-driver-field' } as any}
                  />
                }
                label="Incluye Chofer"
                data-testid="vehicle-driver-label"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas / Observaciones"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Cualquier información adicional sobre el vehículo..."
                data-testid="vehicle-notes-input"
                inputProps={{ 'data-testid': 'vehicle-notes-field' }}
              />
            </Grid>
          </Grid>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Por favor corrige los errores antes de continuar
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 500 }}
          data-testid="vehicle-cancel-button"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
          data-testid="vehicle-submit-button"
        >
          {loading ? 'Guardando...' : isEditMode ? 'Actualizar Vehículo' : 'Agregar Vehículo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VehicleForm;
