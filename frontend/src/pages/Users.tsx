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
  Snackbar
} from '@mui/material';
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
import { userService, User, Role } from '../services/userService';

const Users: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
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
    roles: ['operator'] as string[],
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
      // Error loading roles silently handled
    }
  };

  const loadStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      // Error loading stats silently handled
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
        roles: user.roles?.map(r => r.name) || ['operator'],
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
        roles: ['operator'],
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
      admin: { label: 'Administrador', color: '#8b5cf6', icon: <AdminIcon fontSize="small" /> },
      director: { label: 'Director', color: '#ef4444', icon: <AdminIcon fontSize="small" /> },
      manager: { label: 'Gerente', color: '#3b82f6', icon: <ManagerIcon fontSize="small" /> },
      seller: { label: 'Vendedor', color: '#f59e0b', icon: <OperatorIcon fontSize="small" /> },
      accountant: { label: 'Contador', color: '#10b981', icon: <OperatorIcon fontSize="small" /> },
      inventory: { label: 'Inventario', color: '#06b6d4', icon: <OperatorIcon fontSize="small" /> },
      operator: { label: 'Operador', color: '#64748b', icon: <OperatorIcon fontSize="small" /> }
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
  const managerCount = stats.byRole.find(r => r.role === 'manager')?.count || users.filter(u => u.roles?.some(r => r.name === 'manager')).length;
  const operatorCount = stats.byRole.find(r => r.role === 'operator')?.count || users.filter(u => u.roles?.some(r => r.name === 'operator')).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
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
          sx={{
            bgcolor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
            color: '#fff',
            '&:hover': {
              bgcolor: isDarkMode ? '#7c3aed' : '#7c3aed'
            }
          }}
        >
          Nuevo Usuario
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
                    Total Usuarios
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total || users.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeUsers} activos
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 40, color: '#8b5cf6', opacity: 0.5 }} />
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
                    Administradores
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#8b5cf6' }}>
                    {adminCount}
                  </Typography>
                </Box>
                <AdminIcon sx={{ fontSize: 40, color: '#8b5cf6', opacity: 0.5 }} />
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
                    Gerentes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6' }}>
                    {managerCount}
                  </Typography>
                </Box>
                <ManagerIcon sx={{ fontSize: 40, color: '#3b82f6', opacity: 0.5 }} />
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
                    Operadores
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                    {operatorCount}
                  </Typography>
                </Box>
                <OperatorIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{
        mb: 3,
        p: 2,
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o email..."
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
          </Grid>
          <Grid item xs={12} md={6}>
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
                Administradores
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'manager' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('manager')}
              >
                Gerentes
              </Button>
              <Button
                size="small"
                variant={roleFilter === 'operator' ? 'contained' : 'outlined'}
                onClick={() => setRoleFilter('operator')}
              >
                Operadores
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Table>
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
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron usuarios
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const primaryRole = user.roles?.[0];
                const roleConfig = getRoleConfig(primaryRole?.name || 'operator');
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

      {/* User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
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
                  value={formData.roles[0] || 'operator'}
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
                      <MenuItem value="manager">Gerente</MenuItem>
                      <MenuItem value="operator">Operador</MenuItem>
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
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' }
            }}
          >
            {selectedUser ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Restablecer Contraseña</DialogTitle>
        <DialogContent>
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
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={!newPassword || newPassword.length < 6}
            sx={{
              bgcolor: '#8b5cf6',
              '&:hover': { bgcolor: '#7c3aed' }
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
