/**
 * Componente RentalFilters - Filtros de rentas (CHAT 2)
 */
import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Button,
  Typography
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { RentalStatus } from '../../types/rental';

export interface RentalFilterValues {
  status: RentalStatus | '';
  search?: string;
  startDate?: string;
  endDate?: string;
  customerId?: number;
  vehicleId?: number;
}

interface RentalFiltersProps {
  filters: RentalFilterValues;
  onChange: (key: string, value: any) => void;
  onClear?: () => void;
}

const RentalFilters: React.FC<RentalFiltersProps> = ({ filters, onChange, onClear }) => {
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange('search', event.target.value);
  };

  const handleStatusChange = (event: any) => {
    onChange('status', event.target.value);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange('startDate', event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange('endDate', event.target.value);
  };

  const hasActiveFilters = Boolean(
    filters.status ||
    filters.search ||
    filters.startDate ||
    filters.endDate ||
    filters.customerId ||
    filters.vehicleId
  );

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      {/* Búsqueda */}
      <TextField
        placeholder="Buscar por código, cliente, vehículo..."
        size="small"
        value={filters.search || ''}
        onChange={handleSearchChange}
        sx={{ flexGrow: 1, minWidth: 250 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />

      {/* Estado */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Estado</InputLabel>
        <Select
          value={filters.status || ''}
          label="Estado"
          onChange={handleStatusChange}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="active">Activas</MenuItem>
          <MenuItem value="reserved">Reservadas</MenuItem>
          <MenuItem value="completed">Completadas</MenuItem>
          <MenuItem value="overdue">Vencidas</MenuItem>
          <MenuItem value="cancelled">Canceladas</MenuItem>
        </Select>
      </FormControl>

      {/* Fecha de inicio */}
      <TextField
        type="date"
        label="Fecha Inicio"
        size="small"
        value={filters.startDate || ''}
        onChange={handleStartDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      {/* Fecha de fin */}
      <TextField
        type="date"
        label="Fecha Fin"
        size="small"
        value={filters.endDate || ''}
        onChange={handleEndDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />

      {/* Botón limpiar filtros */}
      {hasActiveFilters && onClear && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<ClearIcon />}
          onClick={onClear}
          sx={{ minWidth: 120 }}
        >
          Limpiar
        </Button>
      )}

      {/* Icono indicador de filtros activos */}
      {hasActiveFilters && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'white'
          }}
        >
          <FilterIcon sx={{ mr: 0.5, fontSize: 18 }} />
          <Typography variant="caption" fontWeight="600">
            Filtros Activos
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RentalFilters;
