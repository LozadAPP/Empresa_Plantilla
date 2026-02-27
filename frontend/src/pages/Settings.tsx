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
  alpha,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  People as PeopleIcon,
  Extension as ExtensionIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Receipt as FiscalIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import configService from '../services/configService';
import { userService } from '../services/userService';
import extraServiceService from '../services/extraServiceService';
import cfdiService from '../services/cfdiService';
import { SystemConfig, PriceConfig } from '../types/config';
import { ExtraService } from '../types/extraService';
import { CompanyFiscalConfig } from '../types/cfdi';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import TabPanel from '../components/common/TabPanel';

const Settings: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [priceConfigs, setPriceConfigs] = useState<PriceConfig[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingUserStats, setLoadingUserStats] = useState(false);
  const [userStats, setUserStats] = useState<{ total: number; active: number; byRole: { role: string; count: number }[] } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loadingExtraServices, setLoadingExtraServices] = useState(false);
  const [fiscalConfig, setFiscalConfig] = useState<CompanyFiscalConfig | null>(null);
  const [loadingFiscal, setLoadingFiscal] = useState(false);
  const [savingFiscal, setSavingFiscal] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    if (tabValue === 3) {
      loadPriceConfigs();
    }
    if (tabValue === 4) {
      loadUserStats();
    }
    if (tabValue === 5) {
      loadExtraServices();
    }
    if (tabValue === 6) {
      loadFiscalConfig();
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

  const loadUserStats = async () => {
    if (userStats) return; // Ya cargado
    setLoadingUserStats(true);
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        setUserStats(response.data);
      }
    } catch (error: any) {
    } finally {
      setLoadingUserStats(false);
    }
  };

  const loadExtraServices = async () => {
    setLoadingExtraServices(true);
    try {
      const response = await extraServiceService.getAllServices();
      setExtraServices(response.data || []);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar los servicios adicionales';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoadingExtraServices(false);
    }
  };

  const loadFiscalConfig = async () => {
    if (fiscalConfig) return;
    setLoadingFiscal(true);
    try {
      const response = await cfdiService.getFiscalConfig();
      if (response.success) {
        setFiscalConfig(response.data);
      }
    } catch {
      enqueueSnackbar('Error al cargar configuración fiscal', { variant: 'error' });
    } finally {
      setLoadingFiscal(false);
    }
  };

  const handleFiscalChange = (field: keyof CompanyFiscalConfig, value: string) => {
    setFiscalConfig(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveFiscal = async () => {
    if (!fiscalConfig) return;
    setSavingFiscal(true);
    try {
      await cfdiService.updateFiscalConfig(fiscalConfig);
      enqueueSnackbar('Configuración fiscal guardada', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al guardar configuración fiscal', { variant: 'error' });
    } finally {
      setSavingFiscal(false);
    }
  };

  const handleToggleExtraService = async (id: number) => {
    try {
      const response = await extraServiceService.toggleServiceStatus(id);
      enqueueSnackbar(response.message, { variant: 'success' });
      loadExtraServices();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cambiar el estado del servicio';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleDeleteExtraService = async (id: number) => {
    try {
      const response = await extraServiceService.deleteService(id);
      enqueueSnackbar(response.message, { variant: 'success' });
      loadExtraServices();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al eliminar el servicio';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'accessory': return 'Accesorio';
      case 'insurance': return 'Seguro';
      case 'service': return 'Servicio';
      default: return category;
    }
  };

  const getCategoryColor = (category: string): 'primary' | 'success' | 'warning' | 'default' => {
    switch (category) {
      case 'accessory': return 'primary';
      case 'insurance': return 'success';
      case 'service': return 'warning';
      default: return 'default';
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
      <Box sx={{
        mb: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, letterSpacing: '-0.02em', mb: 0.5 }}>
            Configuración
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', display: { xs: 'none', sm: 'block' } }}>
            Administra la configuración del sistema y preferencias
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            width: { xs: '100%', sm: 'auto' },
            py: { xs: 1.5, sm: 1 },
            '&:hover': {
              bgcolor: theme.palette.primary.dark
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
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minWidth: { xs: 'auto', sm: 90 },
              px: { xs: 1.5, sm: 2 }
            }
          }}
        >
          <Tab icon={<SettingsIcon />} iconPosition="start" label={isMobile ? "" : "General"} />
          <Tab icon={<NotificationsIcon />} iconPosition="start" label={isMobile ? "" : "Notificaciones"} />
          <Tab icon={<SecurityIcon />} iconPosition="start" label={isMobile ? "" : "Seguridad"} />
          <Tab icon={<MoneyIcon />} iconPosition="start" label={isMobile ? "" : "Precios"} />
          <Tab icon={<PeopleIcon />} iconPosition="start" label={isMobile ? "" : "Usuarios"} />
          <Tab icon={<ExtensionIcon />} iconPosition="start" label={isMobile ? "" : "Servicios"} />
          <Tab icon={<FiscalIcon />} iconPosition="start" label={isMobile ? "" : "Fiscal"} />
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
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
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
                      primaryTypographyProps={{ noWrap: true }}
                      secondaryTypographyProps={{ noWrap: true }}
                      sx={{ mr: 8 }}
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
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
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
                  <Chip label={loadingUserStats ? '...' : `${userStats?.byRole?.find(r => r.role === 'admin')?.count || 0} usuarios`} color="primary" size="small" sx={{ mr: 1 }} />
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
                  <Chip label={loadingUserStats ? '...' : `${userStats?.byRole?.filter(r => ['jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'manager'].includes(r.role)).reduce((sum, r) => sum + r.count, 0) || 0} usuarios`} color="primary" size="small" sx={{ mr: 1 }} />
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
                  <Chip label={loadingUserStats ? '...' : `${userStats?.byRole?.filter(r => ['vendedor', 'contador', 'cajero', 'tecnico', 'encargado_inventario', 'asistente_admin', 'operator'].includes(r.role)).reduce((sum, r) => sum + r.count, 0) || 0} usuarios`} color="primary" size="small" sx={{ mr: 1 }} />
                  <IconButton edge="end" size="small" onClick={() => navigate('/users')} title="Ver usuarios">
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Fiscal Settings */}
      <TabPanel value={tabValue} index={6}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Datos Fiscales de la Empresa
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configura los datos fiscales para la emisión de CFDI
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={savingFiscal ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveFiscal}
                disabled={savingFiscal || !fiscalConfig}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': { bgcolor: theme.palette.primary.dark }
                }}
              >
                {savingFiscal ? 'Guardando...' : 'Guardar Fiscal'}
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {loadingFiscal ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !fiscalConfig ? (
              <Alert severity="info">
                No se pudo cargar la configuración fiscal. Verifica que el backend esté corriendo.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {/* Datos del Emisor */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                    Datos del Emisor
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="RFC de la Empresa"
                    value={fiscalConfig.company_rfc || ''}
                    onChange={(e) => handleFiscalChange('company_rfc', e.target.value.toUpperCase())}
                    helperText="RFC del emisor (12 caracteres)"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Razón Social"
                    value={fiscalConfig.company_razon_social || ''}
                    onChange={(e) => handleFiscalChange('company_razon_social', e.target.value)}
                    helperText="Nombre fiscal de la empresa"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Régimen Fiscal</InputLabel>
                    <Select
                      value={fiscalConfig.company_regimen_fiscal || ''}
                      label="Régimen Fiscal"
                      onChange={(e) => handleFiscalChange('company_regimen_fiscal', e.target.value)}
                    >
                      <MenuItem value="">Sin especificar</MenuItem>
                      <MenuItem value="601">601 - General de Ley PM</MenuItem>
                      <MenuItem value="603">603 - PM Fines no Lucrativos</MenuItem>
                      <MenuItem value="612">612 - PF Actividades Empresariales</MenuItem>
                      <MenuItem value="616">616 - Sin obligaciones fiscales</MenuItem>
                      <MenuItem value="625">625 - Plataformas Tecnológicas</MenuItem>
                      <MenuItem value="626">626 - RESICO</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    value={fiscalConfig.company_zip_code || ''}
                    onChange={(e) => handleFiscalChange('company_zip_code', e.target.value.replace(/\D/g, ''))}
                    helperText="C.P. del domicilio fiscal"
                    inputProps={{ maxLength: 5 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Dirección Fiscal"
                    value={fiscalConfig.company_address || ''}
                    onChange={(e) => handleFiscalChange('company_address', e.target.value)}
                  />
                </Grid>

                {/* PAC Configuration */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                    Proveedor de Timbrado (PAC)
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Proveedor PAC"
                    value={fiscalConfig.cfdi_pac_provider || 'simulado'}
                    onChange={(e) => handleFiscalChange('cfdi_pac_provider', e.target.value)}
                    helperText="Proveedor actual de timbrado"
                    InputProps={{
                      endAdornment: fiscalConfig.cfdi_pac_provider === 'simulado' ? (
                        <Chip label="Modo Simulado" size="small" color="warning" />
                      ) : undefined
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Usuario PAC"
                    value={fiscalConfig.cfdi_pac_user || ''}
                    onChange={(e) => handleFiscalChange('cfdi_pac_user', e.target.value)}
                    helperText="Usuario de autenticación con el PAC"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Contraseña PAC"
                    value={fiscalConfig.cfdi_pac_password || ''}
                    onChange={(e) => handleFiscalChange('cfdi_pac_password', e.target.value)}
                    helperText="Contraseña de autenticación con el PAC"
                  />
                </Grid>

                {/* Certificates */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                    Certificados de Sello Digital (CSD)
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Los certificados CSD se configuran a nivel de servidor. Contacta al administrador del sistema para instalar o actualizar los certificados.
                  </Alert>
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Extra Services Settings */}
      <TabPanel value={tabValue} index={5}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Servicios Adicionales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Administra los servicios extras disponibles en las rentas (GPS, seguros, etc.)
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/settings/extra-services/new')}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
                  }
                }}
              >
                Nuevo Servicio
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {loadingExtraServices ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : extraServices.length === 0 ? (
              <Alert severity="info">
                No hay servicios adicionales configurados. Haz clic en "Nuevo Servicio" para crear uno.
              </Alert>
            ) : (
              <List>
                {extraServices.map((service) => (
                  <ListItem
                    key={service.id}
                    sx={{
                      bgcolor: service.is_active
                        ? alpha('#8b5cf6', 0.05)
                        : (isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
                      borderRadius: 1,
                      mb: 1,
                      opacity: service.is_active ? 1 : 0.6
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={500}>{service.name}</Typography>
                          <Chip
                            label={getCategoryLabel(service.category)}
                            color={getCategoryColor(service.category)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          ${Number(service.price).toFixed(2)} {service.price_type === 'per_day' ? '/ día' : '(único)'}
                          {service.description && ` - ${service.description}`}
                        </>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      sx={{ mr: 8 }}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={service.is_active ? 'Activo' : 'Inactivo'}
                        color={service.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <IconButton
                        edge="end"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleToggleExtraService(service.id)}
                        title={service.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {service.is_active ? <ToggleOnIcon color="success" /> : <ToggleOffIcon />}
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => navigate(`/settings/extra-services/${service.id}/edit`)}
                        title="Editar servicio"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeleteExtraService(service.id)}
                        title="Eliminar servicio"
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
    </Box>
  );
};

export default Settings;
