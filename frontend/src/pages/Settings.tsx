import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  alpha
} from '@mui/material';
import {
  Save as SaveIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import configService from '../services/configService';
import { SystemConfig, PriceConfig } from '../types/config';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import TabPanel from '../components/common/TabPanel';

const Settings: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [priceConfigs, setPriceConfigs] = useState<PriceConfig[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (tabValue === 3) {
      loadPriceConfigs();
    }
  }, [tabValue]);

  // OPTIMIZADO: Cleanup del setTimeout para evitar memory leaks
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (success) {
      timer = setTimeout(() => setSuccess(false), 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  const loadConfigs = async () => {
    try {
      const response = await configService.getSystemConfigs();
      setConfigs(response.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las configuraciones';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadPriceConfigs = async () => {
    setLoadingPrices(true);
    try {
      const response = await configService.getPriceConfigs();
      setPriceConfigs(response.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las tarifas';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoadingPrices(false);
    }
  };

  const handleDeactivatePriceConfig = async (id: number) => {
    try {
      await configService.deactivatePriceConfig(id);
      enqueueSnackbar('Tarifa desactivada exitosamente', { variant: 'success' });
      loadPriceConfigs();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al desactivar la tarifa';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      for (const config of configs.filter(c => c.isEditable)) {
        await configService.updateSystemConfig(config.id, {
          configValue: config.configValue,
          description: config.description
        });
      }
      setSuccess(true);
      // Cleanup manejado por useEffect
    } catch (error: any) {
      console.error('Error saving configs:', error);
      setError(error.response?.data?.message || 'Error al guardar las configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigs(prev => prev.map(config =>
      config.configKey === key ? { ...config, configValue: value } : config
    ));
  };

  const getConfigsByCategory = (category: string) => {
    return configs.filter(c => c.category === category);
  };

  const renderConfigField = (config: SystemConfig) => {
    if (!config.isEditable) {
      return (
        <TextField
          fullWidth
          label={config.configKey}
          value={config.configValue}
          disabled
          helperText={config.description}
        />
      );
    }

    switch (config.configType) {
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={config.configValue === 'true'}
                onChange={(e) => handleConfigChange(config.configKey, e.target.checked ? 'true' : 'false')}
              />
            }
            label={
              <Box>
                <Typography variant="body1">{config.configKey}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {config.description}
                </Typography>
              </Box>
            }
          />
        );
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={config.configKey}
            value={config.configValue}
            onChange={(e) => handleConfigChange(config.configKey, e.target.value)}
            helperText={config.description}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            label={config.configKey}
            value={config.configValue}
            onChange={(e) => handleConfigChange(config.configKey, e.target.value)}
            helperText={config.description}
          />
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Configuración
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Administra la configuración del sistema y preferencias
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: '#7c3aed'
            }
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configuraciones guardadas exitosamente
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{
        mb: 3,
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab icon={<SettingsIcon />} iconPosition="start" label="General" />
          <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notificaciones" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Seguridad" />
          <Tab icon={<MoneyIcon />} iconPosition="start" label="Precios" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Usuarios" />
        </Tabs>
      </Card>

      {/* General Settings */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configuración General
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ajusta las configuraciones básicas del sistema
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {getConfigsByCategory('general').map((config) => (
                <Grid item xs={12} md={6} key={config.id}>
                  {renderConfigField(config)}
                </Grid>
              ))}

              {/* Default settings if no configs in DB */}
              {getConfigsByCategory('general').length === 0 && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nombre de la Empresa"
                      defaultValue="MOVICAR"
                      helperText="Nombre de tu empresa que aparecerá en documentos y emails"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Moneda"
                      defaultValue="USD"
                      helperText="Moneda por defecto para transacciones"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Zona Horaria"
                      defaultValue="America/Mexico_City"
                      helperText="Zona horaria de tu ubicación principal"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Idioma"
                      defaultValue="es"
                      helperText="Idioma del sistema"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Notifications Settings */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configuración de Notificaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Personaliza cómo y cuándo recibir notificaciones
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {getConfigsByCategory('notifications').map((config) => (
                <Grid item xs={12} key={config.id}>
                  {renderConfigField(config)}
                </Grid>
              ))}

              {/* Default notification settings */}
              {getConfigsByCategory('notifications').length === 0 && (
                <>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={
                        <Box>
                          <Typography variant="body1">Notificaciones por Email</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Recibe notificaciones importantes por correo electrónico
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={
                        <Box>
                          <Typography variant="body1">Alertas de Rentas Próximas a Vencer</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Notificar cuando una renta esté próxima a vencer
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={
                        <Box>
                          <Typography variant="body1">Alertas de Pagos Pendientes</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Notificar cuando haya pagos pendientes de los clientes
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={
                        <Box>
                          <Typography variant="body1">Alertas de Mantenimiento</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Notificar cuando un vehículo requiera mantenimiento
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Días de Anticipación para Alertas"
                      defaultValue={3}
                      helperText="Cuántos días antes notificar sobre eventos próximos"
                      InputProps={{
                        inputProps: { min: 1, max: 30 }
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Settings */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Configuración de Seguridad
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ajusta las configuraciones de seguridad y acceso
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {getConfigsByCategory('security').map((config) => (
                <Grid item xs={12} key={config.id}>
                  {renderConfigField(config)}
                </Grid>
              ))}

              {/* Default security settings */}
              {getConfigsByCategory('security').length === 0 && (
                <>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={
                        <Box>
                          <Typography variant="body1">Autenticación de Dos Factores</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requerir 2FA para iniciar sesión
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label={
                        <Box>
                          <Typography variant="body1">Registro de Auditoría</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Registrar todas las acciones de los usuarios
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Tiempo de Sesión (minutos)"
                      defaultValue={60}
                      helperText="Tiempo de inactividad antes de cerrar sesión automáticamente"
                      InputProps={{
                        inputProps: { min: 15, max: 480 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Longitud Mínima de Contraseña"
                      defaultValue={8}
                      helperText="Número mínimo de caracteres para contraseñas"
                      InputProps={{
                        inputProps: { min: 6, max: 20 }
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Pricing Settings */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Configuración de Precios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administra las tarifas y precios por tipo de vehículo
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/settings/pricing/new')}
                sx={{
                  bgcolor: '#8b5cf6',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#7c3aed'
                  }
                }}
              >
                Nueva Tarifa
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {loadingPrices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : priceConfigs.length === 0 ? (
              <Alert severity="info">
                No hay tarifas configuradas. Haz clic en "Nueva Tarifa" para crear una.
              </Alert>
            ) : (
              <List>
                {priceConfigs.map((config) => (
                  <ListItem
                    key={config.id}
                    sx={{
                      bgcolor: alpha('#8b5cf6', 0.05),
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemText
                      primary={
                        <>
                          {config.vehicleType?.name || 'Todos los vehículos'}
                          {config.location && ` - ${config.location.name}`}
                          {config.season && ` (${config.season})`}
                        </>
                      }
                      secondary={
                        <>
                          Diaria: ${config.dailyRate}
                          {config.weeklyRate && ` | Semanal: $${config.weeklyRate}`}
                          {config.monthlyRate && ` | Mensual: $${config.monthlyRate}`}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={config.isActive ? 'Activa' : 'Inactiva'}
                        color={config.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        edge="end"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => navigate(`/settings/pricing/${config.id}/edit`)}
                        title="Editar tarifa"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeactivatePriceConfig(config.id)}
                        title="Desactivar tarifa"
                        disabled={!config.isActive}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Users Settings */}
      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Gestión de Usuarios
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administra usuarios y permisos del sistema
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/users')}
                sx={{
                  bgcolor: '#8b5cf6',
                  color: '#fff',
                  '&:hover': {
                    bgcolor: '#7c3aed'
                  }
                }}
              >
                Gestionar Usuarios
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Alert severity="info" sx={{ mb: 3 }}>
              La gestión completa de usuarios y roles está disponible en el módulo de administración
            </Alert>

            <List>
              <ListItem
                sx={{
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha('#8b5cf6', 0.05),
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText
                  primary="Administradores del Sistema"
                  secondary="Acceso completo a todas las funciones"
                />
                <ListItemSecondaryAction>
                  <Chip label="3 usuarios" color="primary" size="small" sx={{ mr: 1 }} />
                  <IconButton edge="end" size="small" onClick={() => navigate('/users')} title="Ver usuarios">
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem
                sx={{
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha('#8b5cf6', 0.05),
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText
                  primary="Gerentes"
                  secondary="Gestión de rentas, reportes y configuraciones"
                />
                <ListItemSecondaryAction>
                  <Chip label="5 usuarios" color="primary" size="small" sx={{ mr: 1 }} />
                  <IconButton edge="end" size="small" onClick={() => navigate('/users')} title="Ver usuarios">
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem
                sx={{
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha('#8b5cf6', 0.05),
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText
                  primary="Operadores"
                  secondary="Gestión de rentas y devoluciones"
                />
                <ListItemSecondaryAction>
                  <Chip label="10 usuarios" color="primary" size="small" sx={{ mr: 1 }} />
                  <IconButton edge="end" size="small" onClick={() => navigate('/users')} title="Ver usuarios">
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default Settings;
