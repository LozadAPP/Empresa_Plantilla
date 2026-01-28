/**
 * Componente ReturnInspection - Formulario de inspección (CHAT 2)
 */
import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import {
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  Build as ConditionIcon,
  CleaningServices as CleaningIcon
} from '@mui/icons-material';
import { VehicleCondition } from '../../types/return';

interface InspectionData {
  end_mileage: number;
  fuel_level: string;
  vehicle_condition: VehicleCondition;
  damage_description: string;
  damage_cost: number;
  cleaning_required: boolean;
  inspection_notes: string;
}

interface ReturnInspectionProps {
  formData: InspectionData;
  onChange: (field: string, value: any) => void;
  startMileage?: number;
}

const ReturnInspection: React.FC<ReturnInspectionProps> = ({
  formData,
  onChange,
  startMileage = 0
}) => {
  const handleChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    onChange(field, value);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="600" gutterBottom>
        Inspección del Vehículo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Completa los datos de la inspección del vehículo devuelto
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Kilometraje */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SpeedIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight="600">
              Kilometraje
            </Typography>
          </Box>
          <TextField
            type="number"
            label="Kilometraje Final *"
            fullWidth
            value={formData.end_mileage}
            onChange={handleChange('end_mileage')}
            required
            inputProps={{ min: startMileage }}
            helperText={`Kilometraje inicial: ${startMileage.toLocaleString()} km`}
          />
        </Box>

        <Divider />

        {/* Combustible */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FuelIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight="600">
              Nivel de Combustible
            </Typography>
          </Box>
          <FormControl fullWidth required>
            <InputLabel>Nivel de Combustible</InputLabel>
            <Select
              value={formData.fuel_level}
              label="Nivel de Combustible"
              onChange={handleChange('fuel_level')}
            >
              <MenuItem value="empty">Vacío</MenuItem>
              <MenuItem value="quarter">1/4</MenuItem>
              <MenuItem value="half">1/2</MenuItem>
              <MenuItem value="three_quarters">3/4</MenuItem>
              <MenuItem value="full">Lleno</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Condición del Vehículo */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ConditionIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight="600">
              Condición del Vehículo
            </Typography>
          </Box>
          <FormControl fullWidth required>
            <InputLabel>Condición</InputLabel>
            <Select
              value={formData.vehicle_condition}
              label="Condición"
              onChange={handleChange('vehicle_condition')}
            >
              <MenuItem value="excellent">Excelente</MenuItem>
              <MenuItem value="good">Bueno</MenuItem>
              <MenuItem value="fair">Regular</MenuItem>
              <MenuItem value="poor">Malo</MenuItem>
              <MenuItem value="damaged">Dañado</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider />

        {/* Limpieza */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CleaningIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight="600">
              Limpieza
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.cleaning_required}
                onChange={handleChange('cleaning_required')}
              />
            }
            label={
              <Box>
                <Typography variant="body2">
                  Requiere limpieza profunda
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Se aplicará un cargo adicional de $50.00
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider />

        {/* Daños */}
        <Box>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
            Descripción de Daños (si aplica)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Descripción de daños"
            value={formData.damage_description}
            onChange={handleChange('damage_description')}
            placeholder="Describe cualquier daño encontrado en el vehículo..."
          />
        </Box>

        {/* Costo de Daños */}
        {formData.damage_description && (
          <Box>
            <TextField
              type="number"
              label="Costo de Reparación"
              fullWidth
              value={formData.damage_cost}
              onChange={handleChange('damage_cost')}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Ingresa el costo estimado de reparación de los daños"
            />
          </Box>
        )}

        <Divider />

        {/* Notas de Inspección */}
        <Box>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
            Notas de Inspección
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notas adicionales"
            value={formData.inspection_notes}
            onChange={handleChange('inspection_notes')}
            placeholder="Observaciones generales de la inspección..."
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default ReturnInspection;
