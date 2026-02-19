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
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Avatar,
  alpha,
  Snackbar,
  useMediaQuery,
  useTheme,
  Stack,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as ManagerIcon,
  PersonOutline as OperatorIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/common/EmptyState';
import { userService, User, Role } from '../services/userService';

const Users: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();

  // RESPONSIVE: Media queries
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: [] as { role: string; count: number }[]
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    roles: ['vendedor'] as string[],
    location_id: undefined as number | undefined,
    password: ''
  });

  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await userService.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('[Users] Error loading roles:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('[Users] Error loading stats:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        roles: user.roles?.map(r => r.name) || ['vendedor'],
        location_id: user.location_id,
        password: ''
      });
      setSelectedUser(user);
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        roles: ['vendedor'],
        location_id: undefined,
        password: ''
      });
      setSelectedUser(null);
    }
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setError('');
  };

  const handleSave = async () => {
    try {
      setError('');

      if (selectedUser) {
        // Update existing user
        const response = await userService.updateUser(selectedUser.id, {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          location_id: formData.location_id,
          roles: formData.roles
        });

        if (response.success) {
          setSnackbar({ open: true, message: 'Usuario actualizado correctamente', severity: 'success' });
          handleCloseDialog();
          loadUsers();
          loadStats();
        }
      } else {
        // Create new user
        if (!formData.password) {
          setError('La contraseña es requerida');
          return;
        }

        const response = await userService.createUser({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || undefined,
          location_id: formData.location_id,
          roles: formData.roles
        });

        if (response.success) {
          setSnackbar({ open: true, message: 'Usuario creado correctamente', severity: 'success' });
          handleCloseDialog();
          loadUsers();
          loadStats();
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar el usuario';
      setError(errorMessage);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      const response = await userService.toggleUserStatus(userId);
      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message,
          severity: 'success'
        });
        loadUsers();
        loadStats();
      }
      handleMenuClose();
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al cambiar estado del usuario', severity: 'error' });
    }
  };

  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
    setNewPassword('');
    handleMenuClose();
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      const response = await userService.resetUserPassword(selectedUser.id, newPassword);
      if (response.success) {
        setSnackbar({ open: true, message: 'Contraseña restablecida correctamente', severity: 'success' });
        setPasswordDialogOpen(false);
        setNewPassword('');
        setSelectedUser(null);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al restablecer contraseña', severity: 'error' });
    }
  };

  const getRoleConfig = (roleName: string) => {
    const configs: Record<string, { label: string; color: string; icon: JSX.Element }> = {
      // Sistema de 12 roles (CLAUDE.md)
      admin: { label: 'Administrador', color: theme.palette.primary.main, icon: <AdminIcon fontSize="small" /> },
      director_general: { label: 'Director General', color: '#ef4444', icon: <AdminIcon fontSize="small" /> },
      // Jefes de área
      jefe_inventarios: { label: 'Jefe Inventarios', color: '#3b82f6', icon: <ManagerIcon fontSize="small" /> },
      jefe_ventas: { label: 'Jefe Ventas', color: '#f59e0b', icon: <ManagerIcon fontSize="small" /> },
      jefe_finanzas: { label: 'Jefe Finanzas', color: '#10b981', icon: <ManagerIcon fontSize="small" /> },
      jefe_admin: { label: 'Jefe Admin', color: '#06b6d4', icon: <ManagerIcon fontSize="small" /> },
      // Operativos
      encargado_inventario: { label: 'Encargado Inventario', color: '#8b5cf6', icon: <OperatorIcon fontSize="small" /> },
      tecnico: { label: 'Técnico', color: '#64748b', icon: <OperatorIcon fontSize="small" /> },
      vendedor: { label: 'Vendedor', color: '#f59e0b', icon: <OperatorIcon fontSize="small" /> },
      contador: { label: 'Contador', color: '#10b981', icon: <OperatorIcon fontSize="small" /> },
      cajero: { label: 'Cajero', color: '#06b6d4', icon: <OperatorIcon fontSize="small" /> },
      asistente_admin: { label: 'Asistente Admin', color: '#64748b', icon: <OperatorIcon fontSize="small" /> },
      // Aliases para compatibilidad
      director: { label: 'Director', color: '#ef4444', icon: <AdminIcon fontSize="small" /> },
      manager: { label: 'Gerente', color: '#3b82f6', icon: <ManagerIcon fontSize="small" /> },
      seller: { label: 'Vendedor', color: '#f59e0b', icon: <OperatorIcon fontSize="small" /> },
      accountant: { label: 'Contador', color: '#10b981', icon: <OperatorIcon fontSize="small" /> },
      inventory: { label: 'Inventario', color: '#06b6d4', icon: <OperatorIcon fontSize="small" /> },
      operator: { label: 'Operador', color: '#64748b', icon: <OperatorIcon fontSize="small" /> },
    };
    return configs[roleName] || { label: roleName, color: '#64748b', icon: <OperatorIcon fontSize="small" /> };
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.roles?.some(r => r.name === roleFilter);
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate stats from users if API stats not loaded
  const activeUsers = stats.active || users.filter(u => u.is_active).length;
  const adminCount = stats.byRole.find(r => r.role === 'admin')?.count || users.filter(u => u.roles?.some(r => r.name === 'admin')).length;
  // Jefes: director_general + todos los jefe_*
  const jefesRoles = ['director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin'];
  const jefesCount = stats.byRole.filter(r => jefesRoles.includes(r.role)).reduce((sum, r) => sum + r.count, 0)
    || users.filter(u => u.roles?.some(r => jefesRoles.includes(r.name))).length;
  // Operativos: encargado, tecnico, vendedor, contador, cajero, asistente
  const operativosRoles = ['encargado_inventario', 'tecnico', 'vendedor', 'contador', 'cajero', 'asistente_admin'];
  const operativosCount = stats.byRole.filter(r => operativosRoles.includes(r.role)).reduce((sum, r) => sum + r.count, 0)
    || users.filter(u => u.roles?.some(r => operativosRoles.includes(r.name))).length;

  return (
    <Box>
      {/* Header - RESPONSIVE */}
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
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Administra los usuarios y permisos del sistema
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
          sx={{
            minHeight: { xs: 48, sm: 40 },
            bgcolor: theme.palette.primary.main,
            color: '#fff',
            '&:hover': { bgcolor: theme.palette.primary.dark }
          }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {isMobile ? 'Total' : 'Total Usuarios'}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {stats.total || users.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    {activeUsers} activos
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#8b5cf6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {isMobile ? 'Admins' : 'Administradores'}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#8b5cf6', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {adminCount}
                  </Typography>
                </Box>
                <AdminIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#8b5cf6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    Jefes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {jefesCount}
                  </Typography>
                </Box>
                <ManagerIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#3b82f6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    Operativos
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {operativosCount}
                  </Typography>
                </Box>
                <OperatorIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#10b981', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters - RESPONSIVE */}
      <Card sx={{
        mb: 3,
        p: { xs: 1.5, sm: 2 },
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          {/* Role Filter - Select en móvil, botones en desktop */}
          {isMobile ? (
            <FormControl size="small" fullWidth sx={{ '& .MuiInputBase-root': { minHeight: 48 } }}>
              <InputLabel>Filtrar por rol</InputLabel>
              <Select
                value={roleFilter}
                label="Filtrar por rol"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="admin">Administradores</MenuItem>
                <MenuItem value="director_general">Director General</MenuItem>
                <MenuItem value="jefe_inventarios">Jefe Inventarios</MenuItem>
                <MenuItem value="jefe_ventas">Jefe Ventas</MenuItem>
                <MenuItem value="jefe_finanzas">Jefe Finanzas</MenuItem>
                <MenuItem value="jefe_admin">Jefe Admin</MenuItem>
                <MenuItem value="vendedor">Vendedores</MenuItem>
                <MenuItem value="tecnico">Técnicos</MenuItem>
                <MenuItem value="contador">Contadores</MenuItem>
                <MenuItem value="cajero">Cajeros</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant={roleFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('all')}
              >
                Todos
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'admin' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('admin')}
              >
                Admins
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'director_general' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('director_general')}
              >
                Director
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'jefe_ventas' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('jefe_ventas')}
              >
                Ventas
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'vendedor' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('vendedor')}
              >
                Vendedores
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'tecnico' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('tecnico')}
              >
                Técnicos
              </Button>
            </Box>
          )}
        </Box>
      </Card>

      {/* RESPONSIVE: Cards en móvil, Tabla en desktop */}
      {isMobile ? (
        /* Vista de Cards para móvil */
        <Box>
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={<PersonIcon />}
              title="No se encontraron usuarios"
              subtitle="Crea un nuevo usuario para comenzar"
            />
          ) : (
            <Stack spacing={1.5}>
              {filteredUsers.map((user) => {
                const primaryRole = user.roles?.[0];
                const roleConfig = getRoleConfig(primaryRole?.name || 'vendedor');
                return (
                  <Card
                    key={user.id}
                    sx={{
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      {/* Header: Avatar + Nombre + Menú */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: roleConfig.color, width: 40, height: 40 }}>
                            {user.first_name[0]}{user.last_name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="700">
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

                      {/* Info */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {user.roles?.map((role) => {
                            const config = getRoleConfig(role.name);
                            return (
                              <Chip
                                key={role.id}
                                label={config.label}
                                size="small"
                                sx={{
                                  bgcolor: alpha(config.color, 0.1),
                                  color: config.color,
                                  border: 'none',
                                  height: 24,
                                  fontSize: '0.7rem'
                                }}
                              />
                            );
                          })}
                        </Box>
                        <Chip
                          label={user.is_active ? 'Activo' : 'Inactivo'}
                          size="small"
                          color={user.is_active ? 'success' : 'default'}
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            ...(user.is_active && {
                              '@keyframes chipPulse': {
                                '0%, 100%': { boxShadow: '0 0 0 0 rgba(1, 181, 116, 0.3)' },
                                '50%': { boxShadow: '0 0 0 4px rgba(1, 181, 116, 0)' },
                              },
                              animation: 'chipPulse 2s ease-in-out infinite',
                            }),
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>
      ) : (
        /* Vista de Tabla para desktop */
        <TableContainer component={Paper} sx={{
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          overflowX: 'auto'
        }}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1) }}>
                <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rol(es)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ubicación</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 0 }}>
                    <EmptyState
                      icon={<PersonIcon />}
                      title="No se encontraron usuarios"
                      subtitle="Crea un nuevo usuario para comenzar"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const primaryRole = user.roles?.[0];
                  const roleConfig = getRoleConfig(primaryRole?.name || 'vendedor');
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: roleConfig.color }}>
                            {user.first_name[0]}{user.last_name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.first_name} {user.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.phone || 'Sin teléfono'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {user.roles?.map((role) => {
                            const config = getRoleConfig(role.name);
                            return (
                              <Chip
                                key={role.id}
                                label={config.label}
                                size="small"
                                sx={{
                                  bgcolor: alpha(config.color, 0.1),
                                  color: config.color,
                                  border: 'none',
                                }}
                              />
                            );
                          })}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.location?.name || '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Activo' : 'Inactivo'}
                          icon={user.is_active ? <CheckIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                          size="small"
                          color={user.is_active ? 'success' : 'default'}
                          sx={{
                            ...(user.is_active && {
                              '@keyframes chipPulse': {
                                '0%, 100%': { boxShadow: '0 0 0 0 rgba(1, 181, 116, 0.3)' },
                                '50%': { boxShadow: '0 0 0 4px rgba(1, 181, 116, 0)' },
                              },
                              animation: 'chipPulse 2s ease-in-out infinite',
                            }),
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenDialog(selectedUser!)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Editar
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleToggleStatus(selectedUser.id)}>
          {selectedUser?.is_active ? (
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
        <MenuItem onClick={handleOpenPasswordDialog}>
          <LockIcon sx={{ mr: 1, fontSize: 20 }} />
          Restablecer Contraseña
        </MenuItem>
      </Menu>

      {/* User Dialog - RESPONSIVE */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isMobile ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
        }}>
          {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          {isMobile && (
            <IconButton onClick={handleCloseDialog} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: isMobile ? 3 : 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.roles[0] || 'vendedor'}
                  onChange={(e) => setFormData({ ...formData, roles: [e.target.value] })}
                  label="Rol"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {getRoleConfig(role.name).label}
                    </MenuItem>
                  ))}
                  {roles.length === 0 && (
                    <>
                      <MenuItem value="admin">Administrador</MenuItem>
                      <MenuItem value="director_general">Director General</MenuItem>
                      <MenuItem value="jefe_inventarios">Jefe Inventarios</MenuItem>
                      <MenuItem value="jefe_ventas">Jefe Ventas</MenuItem>
                      <MenuItem value="jefe_finanzas">Jefe Finanzas</MenuItem>
                      <MenuItem value="jefe_admin">Jefe Admin</MenuItem>
                      <MenuItem value="vendedor">Vendedor</MenuItem>
                      <MenuItem value="tecnico">Técnico</MenuItem>
                      <MenuItem value="contador">Contador</MenuItem>
                      <MenuItem value="cajero">Cajero</MenuItem>
                      <MenuItem value="encargado_inventario">Encargado Inventario</MenuItem>
                      <MenuItem value="asistente_admin">Asistente Admin</MenuItem>
                    </>
                  )}
                </Select>
              </FormControl>
            </Grid>
            {!selectedUser && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    )
                  }}
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 2 },
          borderTop: isMobile ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
        }}>
          <Button onClick={handleCloseDialog} fullWidth={isMobile} sx={{ minHeight: { xs: 48, sm: 36 } }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 48, sm: 36 },
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            {selectedUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog - RESPONSIVE */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isMobile ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
        }}>
          Restablecer Contraseña
          {isMobile && (
            <IconButton onClick={() => setPasswordDialogOpen(false)} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: isMobile ? 3 : 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa la nueva contraseña para {selectedUser?.first_name} {selectedUser?.last_name}
          </Typography>
          <TextField
            fullWidth
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              )
            }}
            helperText="Mínimo 6 caracteres"
          />
        </DialogContent>
        <DialogActions sx={{
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 },
          p: { xs: 2, sm: 2 },
          borderTop: isMobile ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none'
        }}>
          <Button onClick={() => setPasswordDialogOpen(false)} fullWidth={isMobile} sx={{ minHeight: { xs: 48, sm: 36 } }}>
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={!newPassword || newPassword.length < 6}
            fullWidth={isMobile}
            sx={{
              minHeight: { xs: 48, sm: 36 },
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Restablecer
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

export default Users;
