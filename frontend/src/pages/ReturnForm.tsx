/**
 * Formulario de Devolución (CHAT 2)
 * CONVERTIDO A MATERIAL UI - Soporte completo Dark/Light Mode
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useReturnForm } from '../hooks/useReturnForm';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { DUMMY_LOCATIONS } from '../constants/locations';
import { FUEL_LEVEL_LABELS } from '../constants/statusColors';
import {
  ReturnPenaltySummary,
  ReturnConfirmModal,
  DamageSection
} from '../components/returns';

const ReturnForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const rentalId = searchParams.get('rental');
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();

  const {
    loading,
    rental,
    formData,
    selectedDamageType,
    showConfirmModal,
    penaltyCalculation,
    handleChange,
    handleDamageTypeChange,
    handlePhotoUpload,
    removePhoto,
    handleSubmit,
    confirmSubmit,
    handleCancel,
    closeConfirmModal
  } = useReturnForm({ rentalId });

  const getFuelLevelLabel = (level: string) => FUEL_LEVEL_LABELS[level] || level;

  const paperStyles = {
    p: { xs: 2, sm: 3 },
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: { xs: '12px', sm: 2 },
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  const sectionTitleStyles = {
    fontSize: '1.1rem',
    fontWeight: 600,
    mb: 3,
    pb: 1,
    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  // Loading state
  if (!rental) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: '#8b5cf6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
          Registrar Devolución
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Renta: {rental.rental_code} - {rental.vehicle?.brand} {rental.vehicle?.model} ({rental.vehicle?.plate})
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* FORMULARIO (2 columnas) */}
        <Grid item xs={12} lg={8}>
          <form onSubmit={handleSubmit}>
            <Paper sx={{ ...paperStyles, mb: 3 }}>
              {/* SECCIÓN 1: Información de Devolución */}
              <Typography sx={sectionTitleStyles}>
                Información de Devolución
              </Typography>

              <Grid container spacing={3}>
                {/* Fecha de Devolución */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha de Devolución *"
                    type="datetime-local"
                    name="return_date"
                    value={formData.return_date}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ shrink: true }}
                    helperText={`Esperada: ${new Date(rental.end_date).toLocaleDateString('es-MX')}`}
                  />
                </Grid>

                {/* Sucursal de Devolución */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sucursal de Devolución *</InputLabel>
                    <Select
                      name="return_location_id"
                      value={formData.return_location_id || ''}
                      onChange={(e) => handleChange({ target: { name: 'return_location_id', value: e.target.value } } as any)}
                      label="Sucursal de Devolución *"
                      required
                    >
                      {DUMMY_LOCATIONS.map(loc => (
                        <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Recogida en: {DUMMY_LOCATIONS.find(l => l.id === rental.location_id)?.name || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ ...paperStyles, mb: 3 }}>
              {/* SECCIÓN 2: Condiciones del Vehículo */}
              <Typography sx={sectionTitleStyles}>
                Condiciones del Vehículo
              </Typography>

              <Grid container spacing={3}>
                {/* Kilometraje Final */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Kilometraje Final *"
                    type="number"
                    name="end_mileage"
                    value={formData.end_mileage}
                    onChange={handleChange}
                    required
                    inputProps={{ min: rental.start_mileage || 0 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Inicial: <strong>{rental.start_mileage || 'N/A'}</strong> km
                    {formData.end_mileage > 0 && rental.start_mileage && (
                      <Box component="span" sx={{ ml: 1, color: '#3b82f6' }}>
                        (Recorridos: {formData.end_mileage - rental.start_mileage} km)
                      </Box>
                    )}
                  </Typography>
                </Grid>

                {/* Nivel de Combustible */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Nivel de Combustible Final *</InputLabel>
                    <Select
                      name="fuel_level"
                      value={formData.fuel_level}
                      onChange={(e) => handleChange({ target: { name: 'fuel_level', value: e.target.value } } as any)}
                      label="Nivel de Combustible Final *"
                      required
                    >
                      <MenuItem value="empty">Vacío</MenuItem>
                      <MenuItem value="quarter">1/4</MenuItem>
                      <MenuItem value="half">1/2</MenuItem>
                      <MenuItem value="three_quarters">3/4</MenuItem>
                      <MenuItem value="full">Lleno</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Inicial: <strong>{getFuelLevelLabel(rental.fuel_level_start || 'full')}</strong>
                    {rental.fuel_level_start && formData.fuel_level !== rental.fuel_level_start && (
                      <Box component="span" sx={{ ml: 1, color: '#f59e0b' }}>
                        Diferente al inicial
                      </Box>
                    )}
                  </Typography>
                </Grid>

                {/* Condición del Vehículo */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Condición General *</InputLabel>
                    <Select
                      name="vehicle_condition"
                      value={formData.vehicle_condition}
                      onChange={(e) => handleChange({ target: { name: 'vehicle_condition', value: e.target.value } } as any)}
                      label="Condición General *"
                      required
                    >
                      <MenuItem value="excellent">Excelente</MenuItem>
                      <MenuItem value="good">Bueno</MenuItem>
                      <MenuItem value="fair">Regular</MenuItem>
                      <MenuItem value="poor">Malo</MenuItem>
                      <MenuItem value="damaged">Dañado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Limpieza Requerida */}
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="cleaning_required"
                        checked={formData.cleaning_required}
                        onChange={handleChange}
                        sx={{ color: '#8b5cf6', '&.Mui-checked': { color: '#8b5cf6' } }}
                      />
                    }
                    label={`Requiere limpieza profunda (+${formatCurrency(50)})`}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SECCIÓN 3: Daños y Costos - Componente extraído */}
            <Paper sx={{ ...paperStyles, mb: 3 }}>
              <DamageSection
                selectedDamageType={selectedDamageType}
                damageDescription={formData.damage_description || ''}
                damageCost={formData.damage_cost || 0}
                photos={formData.photos || []}
                isDarkMode={isDarkMode}
                onDamageTypeChange={handleDamageTypeChange}
                onDescriptionChange={handleChange}
                onCostChange={handleChange}
                onPhotoUpload={handlePhotoUpload}
                onRemovePhoto={removePhoto}
              />
            </Paper>

            <Paper sx={{ ...paperStyles, mb: 3 }}>
              {/* SECCIÓN 4: Notas de Inspección */}
              <Typography sx={sectionTitleStyles}>
                Notas de Inspección
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                name="inspection_notes"
                value={formData.inspection_notes}
                onChange={handleChange}
                placeholder="Observaciones generales de la inspección, condiciones especiales, comentarios del cliente, etc."
              />
            </Paper>

            {/* Botones */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleCancel}
                sx={{
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
                sx={{
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                {loading ? 'Registrando...' : 'Registrar Devolución'}
              </Button>
            </Box>
          </form>
        </Grid>

        {/* PANEL DE PENALIDADES (1 columna) - Componente extraído */}
        <Grid item xs={12} lg={4}>
          <ReturnPenaltySummary
            penaltyCalculation={penaltyCalculation}
            dailyRate={rental.daily_rate}
            isDarkMode={isDarkMode}
          />
        </Grid>
      </Grid>

      {/* MODAL DE CONFIRMACIÓN - Componente extraído */}
      {showConfirmModal && penaltyCalculation && (
        <ReturnConfirmModal
          isOpen={showConfirmModal}
          loading={loading}
          rental={rental}
          formData={formData}
          penaltyCalculation={penaltyCalculation}
          isDarkMode={isDarkMode}
          onConfirm={confirmSubmit}
          onClose={closeConfirmModal}
        />
      )}
    </Box>
  );
};

export default ReturnForm;
