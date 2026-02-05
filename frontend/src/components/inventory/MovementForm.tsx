import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  TrendingUp as EntryIcon,
  TrendingDown as ExitIcon,
  SwapHoriz as TransferIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { inventoryService } from '../../services/inventoryService';
import { InventoryItem, Location } from '../../types/inventory';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

interface MovementFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItem?: InventoryItem | null;
}

const MovementForm: React.FC<MovementFormProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedItem,
}) => {
  const { isDarkMode } = useCustomTheme();

  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Formulario
  const [formData, setFormData] = useState({
    itemId: preselectedItem?.id || '',
    movementType: 'exit' as 'entry' | 'exit' | 'transfer',
    movementSubtype: 'rental' as 'rental' | 'sale' | 'purchase' | 'return' | 'transfer' | 'maintenance',
    toLocationId: '',
    fromLocationId: '',
    customerId: '',
    expectedReturnDate: '',
    notes: '',
  });

  // Estado para ubicación personalizada
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    if (open) {
      loadItems();
      loadLocations();
      if (preselectedItem) {
        setFormData((prev) => ({
          ...prev,
          itemId: preselectedItem.id,
          fromLocationId: preselectedItem.currentLocationId,
        }));
      }
    }
  }, [open, preselectedItem]);

  const loadItems = async () => {
    try {
      const response = await inventoryService.getAllItems({ limit: 1000 });
      setItems(response.data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await inventoryService.getAllLocations();
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones
      if (!formData.itemId) {
        throw new Error('Debe seleccionar un artículo');
      }

      // Validar ubicación destino (ya sea seleccionada o personalizada)
      if (useCustomLocation) {
        if (!customLocation.name || !customLocation.address || !customLocation.city || !customLocation.state) {
          throw new Error('Complete todos los campos de la ubicación personalizada');
        }
      } else if (!formData.toLocationId) {
        throw new Error('Debe seleccionar una ubicación destino');
      }

      if (formData.movementType === 'transfer' && !formData.fromLocationId) {
        throw new Error('Para transferencias debe especificar la ubicación origen');
      }

      // Si es ubicación personalizada, primero crear la ubicación
      let finalLocationId = formData.toLocationId;

      if (useCustomLocation) {
        // Crear la nueva ubicación
        const newLocationResponse = await inventoryService.createLocation({
          name: customLocation.name,
          address: customLocation.address,
          city: customLocation.city,
          state: customLocation.state,
          country: 'México',
          coordinates: { lat: 19.4326, lng: -99.1332 }, // CDMX por defecto
          isActive: true,
        });
        finalLocationId = newLocationResponse.data.id;
      }

      await inventoryService.createMovement({
        itemId: formData.itemId,
        movementType: formData.movementType,
        movementSubtype: formData.movementSubtype,
        toLocationId: finalLocationId,
        fromLocationId: formData.fromLocationId || undefined,
        customerId: formData.customerId || undefined,
        expectedReturnDate: formData.expectedReturnDate ? new Date(formData.expectedReturnDate) : undefined,
        notes: formData.notes || undefined,
      });

      // Reset form
      setFormData({
        itemId: '',
        movementType: 'exit',
        movementSubtype: 'rental',
        toLocationId: '',
        fromLocationId: '',
        customerId: '',
        expectedReturnDate: '',
        notes: '',
      });
      setUseCustomLocation(false);
      setCustomLocation({ name: '', address: '', city: '', state: '' });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = () => {
    switch (formData.movementType) {
      case 'entry':
        return <EntryIcon sx={{ color: '#10b981' }} />;
      case 'exit':
        return <ExitIcon sx={{ color: '#ef4444' }} />;
      case 'transfer':
        return <TransferIcon sx={{ color: '#3b82f6' }} />;
    }
  };

  const selectedItem = items.find((item) => item.id === formData.itemId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: isDarkMode ? '#1c1c2e' : '#ffffff',
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
          pb: 2,
        }}
      >
        {getMovementIcon()}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="span" fontWeight={700}>
            Registrar Movimiento
          </Typography>
          <Typography variant="body2" component="p" color="text.secondary">
            Complete los datos del movimiento de inventario
          </Typography>
        </Box>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1, borderRadius: 2 }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Artículo */}
            <Autocomplete
              value={selectedItem || null}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  itemId: newValue?.id || '',
                  fromLocationId: newValue?.currentLocationId || '',
                });
              }}
              options={items}
              getOptionLabel={(option) => `${option.name} - ${option.serialNumber}`}
              disabled={!!preselectedItem}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Artículo"
                  required
                  helperText={
                    selectedItem
                      ? `Ubicación actual: ${selectedItem.currentLocationName}`
                      : 'Seleccione el artículo a mover'
                  }
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.serialNumber} • {option.categoryName}
                    </Typography>
                  </Box>
                  <Chip
                    label={option.status}
                    size="small"
                    sx={{ ml: 2, fontSize: '0.7rem' }}
                  />
                </Box>
              )}
            />

            {/* Tipo de Movimiento */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                label="Tipo de Movimiento"
                value={formData.movementType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    movementType: e.target.value as any,
                  })
                }
                required
              >
                <MenuItem value="entry">Entrada</MenuItem>
                <MenuItem value="exit">Salida</MenuItem>
                <MenuItem value="transfer">Transferencia</MenuItem>
              </TextField>

              <TextField
                select
                label="Subtipo"
                value={formData.movementSubtype}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    movementSubtype: e.target.value as any,
                  })
                }
                required
              >
                <MenuItem value="rental">Renta</MenuItem>
                <MenuItem value="sale">Venta</MenuItem>
                <MenuItem value="purchase">Compra</MenuItem>
                <MenuItem value="return">Devolución</MenuItem>
                <MenuItem value="transfer">Transferencia</MenuItem>
                <MenuItem value="maintenance">Mantenimiento</MenuItem>
              </TextField>
            </Box>

            {/* Ubicaciones */}
            {formData.movementType === 'transfer' && (
              <TextField
                select
                label="Ubicación Origen"
                value={formData.fromLocationId}
                onChange={(e) =>
                  setFormData({ ...formData, fromLocationId: e.target.value })
                }
                required
                helperText="Ubicación desde donde se mueve el artículo"
              >
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name} - {location.city}, {location.state}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Selector de ubicación o personalizado */}
            <TextField
              select
              label="Ubicación Destino"
              value={useCustomLocation ? 'custom' : formData.toLocationId}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustomLocation(true);
                  setFormData({ ...formData, toLocationId: '' });
                } else {
                  setUseCustomLocation(false);
                  setCustomLocation({ name: '', address: '', city: '', state: '' });
                  setFormData({ ...formData, toLocationId: e.target.value });
                }
              }}
              required={!useCustomLocation}
              helperText={useCustomLocation ? 'Complete los campos de ubicación personalizada' : 'Seleccione una sucursal o elija "Personalizado"'}
            >
              <MenuItem value="custom" sx={{ fontStyle: 'italic', color: isDarkMode ? '#a78bfa' : '#8b5cf6' }}>
                ✏️ Personalizado (escribir ubicación)
              </MenuItem>
              <MenuItem disabled divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  — Sucursales disponibles —
                </Typography>
              </MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name} - {location.city}, {location.state}
                </MenuItem>
              ))}
            </TextField>

            {/* Campos de ubicación personalizada */}
            {useCustomLocation && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  border: `1px dashed ${isDarkMode ? '#8b5cf6' : '#a78bfa'}`,
                  backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.02)',
                }}
              >
                <TextField
                  label="Nombre del lugar"
                  value={customLocation.name}
                  onChange={(e) => setCustomLocation({ ...customLocation, name: e.target.value })}
                  required
                  placeholder="Ej: Oficinas Cliente ABC"
                  size="small"
                  sx={{ gridColumn: '1 / -1' }}
                />
                <TextField
                  label="Dirección"
                  value={customLocation.address}
                  onChange={(e) => setCustomLocation({ ...customLocation, address: e.target.value })}
                  required
                  placeholder="Ej: Av. Principal 123"
                  size="small"
                  sx={{ gridColumn: '1 / -1' }}
                />
                <TextField
                  label="Ciudad"
                  value={customLocation.city}
                  onChange={(e) => setCustomLocation({ ...customLocation, city: e.target.value })}
                  required
                  placeholder="Ej: Guadalajara"
                  size="small"
                />
                <TextField
                  label="Estado"
                  value={customLocation.state}
                  onChange={(e) => setCustomLocation({ ...customLocation, state: e.target.value })}
                  required
                  placeholder="Ej: Jalisco"
                  size="small"
                />
              </Box>
            )}

            {/* Fecha de retorno esperada (para rentas) */}
            {formData.movementSubtype === 'rental' && (
              <TextField
                type="date"
                label="Fecha de Retorno Esperada"
                value={formData.expectedReturnDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedReturnDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText="Fecha estimada de devolución del artículo"
              />
            )}

            {/* Notas */}
            <TextField
              label="Notas"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales sobre el movimiento..."
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            borderTop: `1px solid ${isDarkMode ? '#2d2d44' : '#e5e7eb'}`,
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: isDarkMode ? '#a78bfa' : '#8b5cf6',
              '&:hover': {
                backgroundColor: isDarkMode ? '#8b5cf6' : '#7c3aed',
              },
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Registrando...
              </>
            ) : (
              'Registrar Movimiento'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MovementForm;
