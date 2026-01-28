import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  alpha,
  Snackbar,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Check as CheckIcon,
  Block as BlockIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { locationService, Location, LocationType } from '../services/locationService';

const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'office', label: 'Oficina' },
  { value: 'warehouse', label: 'Almacén' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'other', label: 'Otro' },
];

const Locations: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    zipCode: '',
    type: 'office' as LocationType,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: ''
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getLocations({ limit: 100 });
      if (response.success && response.data) {
        setLocations(response.data);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar las ubicaciones',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, location: Location) => {
    setAnchorEl(event.currentTarget);
    setSelectedLocation(location);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLocation(null);
  };

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        country: location.country || 'México',
        zipCode: location.zipCode || '',
        type: location.type || 'office',
        contactName: location.contactName || '',
        contactPhone: location.contactPhone || '',
        contactEmail: location.contactEmail || '',
        notes: location.notes || ''
      });
      setSelectedLocation(location);
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        country: 'México',
        zipCode: '',
        type: 'office',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        notes: ''
      });
      setSelectedLocation(null);
    }
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLocation(null);
    setError('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Validate required fields
      if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
        setError('Nombre, dirección, ciudad y estado son obligatorios');
        setSaving(false);
        return;
      }

      const locationData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode || undefined,
        type: formData.type,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        notes: formData.notes || undefined
      };

      let response;
      if (selectedLocation) {
        response = await locationService.updateLocation(selectedLocation.id, locationData);
      } else {
        response = await locationService.createLocation(locationData);
      }

      if (response.success) {
        setSnackbar({
          open: true,
          message: selectedLocation ? 'Sede actualizada exitosamente' : 'Sede creada exitosamente',
          severity: 'success'
        });
        handleCloseDialog();
        loadLocations();
      } else {
        setError(response.message || 'Error al guardar la sede');
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      setError(error.response?.data?.message || 'Error al guardar la sede');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (locationId: number) => {
    try {
      const response = await locationService.toggleLocationStatus(locationId);
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || 'Estado actualizado',
          severity: 'success'
        });
        loadLocations();
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Error al cambiar estado',
          severity: 'error'
        });
      }
      handleMenuClose();
    } catch (error: any) {
      console.error('Error toggling location status:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al cambiar estado de la sede',
        severity: 'error'
      });
      handleMenuClose();
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalVehicles = locations.reduce((sum, loc) => sum + (loc.vehicleCount || 0), 0);
  const totalUsers = locations.reduce((sum, loc) => sum + (loc.userCount || 0), 0);
  const activeLocations = locations.filter(l => l.isActive).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Gestión de Sedes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Administra las ubicaciones y sucursales del negocio
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          Nueva Sede
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Sedes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {locations.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeLocations} activas
                  </Typography>
                </Box>
                <LocationIcon sx={{ fontSize: 40, color: '#8b5cf6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Vehículos
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6' }}>
                    {totalVehicles}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    en todas las sedes
                  </Typography>
                </Box>
                <CarIcon sx={{ fontSize: 40, color: '#3b82f6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Personal
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                    {totalUsers}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    en todas las sedes
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Promedio Vehículos
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b' }}>
                    {activeLocations > 0 ? Math.round(totalVehicles / activeLocations) : 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    por sede activa
                  </Typography>
                </Box>
                <CarIcon sx={{ fontSize: 40, color: '#f59e0b', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Card sx={{
        mb: 3,
        p: 2,
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre, ciudad o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Card>

      {/* Locations Table */}
      <TableContainer component={Paper} sx={{
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1) }}>
              <TableCell sx={{ fontWeight: 700 }}>Sede</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ubicación</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Contacto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vehículos</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Personal</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron sedes
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={location.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: alpha('#8b5cf6', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <LocationIcon sx={{ color: '#8b5cf6' }} />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {location.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{location.address}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {location.city}, {location.state}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {location.contactPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2">{location.contactPhone}</Typography>
                      </Box>
                    )}
                    {location.contactEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">{location.contactEmail}</Typography>
                      </Box>
                    )}
                    {location.contactName && (
                      <Typography variant="caption" color="text.secondary">
                        {location.contactName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={location.vehicleCount}
                      size="small"
                      icon={<CarIcon fontSize="small" />}
                      sx={{
                        bgcolor: alpha('#3b82f6', 0.1),
                        color: '#3b82f6',
                        '& .MuiChip-icon': { color: '#3b82f6' }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={location.userCount}
                      size="small"
                      icon={<PeopleIcon fontSize="small" />}
                      sx={{
                        bgcolor: alpha('#10b981', 0.1),
                        color: '#10b981',
                        '& .MuiChip-icon': { color: '#10b981' }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={location.isActive ? 'Activa' : 'Inactiva'}
                      icon={location.isActive ? <CheckIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                      size="small"
                      color={location.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, location)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenDialog(selectedLocation!)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => selectedLocation && handleToggleStatus(selectedLocation.id)}>
          {selectedLocation?.isActive ? (
            <>
              <BlockIcon sx={{ mr: 1, fontSize: 20, color: '#ef4444' }} />
              Desactivar
            </>
          ) : (
            <>
              <CheckIcon sx={{ mr: 1, fontSize: 20, color: '#10b981' }} />
              Activar
            </>
          )}
        </MenuItem>
      </Menu>

      {/* Location Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedLocation ? 'Editar Sede' : 'Nueva Sede'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Nombre de la Sede"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ej: Sede Principal, Sucursal Norte"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as LocationType })}
                >
                  {LOCATION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                placeholder="Calle, número, colonia"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ciudad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="País"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Postal"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Información de Contacto
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nombre de Contacto"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={2}
                placeholder="Notas adicionales sobre la sede..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' }
            }}
          >
            {saving ? 'Guardando...' : (selectedLocation ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Locations;
