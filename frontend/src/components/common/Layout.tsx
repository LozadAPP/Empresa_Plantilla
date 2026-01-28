import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  TextField,
  InputAdornment,
  Switch
} from '@mui/material';
import FPSCounter from './FPSCounter';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as VehiclesIcon,
  People as CustomersIcon,
  Assignment as RentalsIcon,
  Replay as ReturnsIcon,
  Payment as PaymentsIcon,
  Receipt as InvoicesIcon,
  Build as MaintenanceIcon,
  Assessment as ReportsIcon,
  AccountBalance as AccountingIcon,
  Notifications as NotificationsIcon,
  NotificationImportant as AlertsIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Email as EmailIcon,
  Inventory2 as InventoryManagementIcon,
  Group as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SpaceDashboard as DashboardInventoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  roles?: string[];
  subItems?: NavItem[]; // Para submenús expandibles
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Estructura del sidebar organizada por secciones
const navSections: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' },
      {
        icon: <VehiclesIcon />,
        label: 'Inventario',
        roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'encargado_inventario', 'tecnico', 'vendedor'],
        subItems: [
          { icon: <DashboardInventoryIcon />, label: 'Dashboard de Inventario', path: '/inventory', roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'] },
          { icon: <InventoryManagementIcon />, label: 'Gestión de Inventario', path: '/inventory-management', roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'] }
        ]
      },
      { icon: <CustomersIcon />, label: 'Clientes', path: '/customers', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_finanzas', 'jefe_admin', 'cajero'] }
    ]
  },
  {
    title: 'OPERACIONES',
    items: [
      { icon: <RentalsIcon />, label: 'Rentas', path: '/rentals', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_inventarios', 'encargado_inventario', 'jefe_finanzas', 'jefe_admin'] },
      { icon: <ReturnsIcon />, label: 'Devoluciones', path: '/returns', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_inventarios', 'encargado_inventario'] },
      { icon: <PaymentsIcon />, label: 'Pagos', path: '/payments', roles: ['admin', 'director_general', 'jefe_finanzas', 'cajero', 'jefe_ventas', 'jefe_admin', 'contador'] },
      { icon: <InvoicesIcon />, label: 'Facturas', path: '/invoices', roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_ventas', 'vendedor', 'contador', 'cajero', 'jefe_admin'] }
    ]
  },
  {
    title: 'FINANZAS',
    items: [
      { icon: <ReportsIcon />, label: 'Reportes', path: '/reports', roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'contador', 'encargado_inventario'] },
      { icon: <AccountingIcon />, label: 'Contabilidad', path: '/accounting', roles: ['admin', 'director_general', 'jefe_finanzas', 'contador', 'jefe_admin'] },
      { icon: <AlertsIcon />, label: 'Alertas', path: '/alerts', roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'encargado_inventario', 'tecnico', 'vendedor', 'contador', 'asistente_admin'] }
    ]
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { icon: <MaintenanceIcon />, label: 'Mantenimiento', path: '/maintenance', roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario', 'tecnico', 'jefe_admin'] },
      { icon: <PeopleIcon />, label: 'Usuarios', path: '/users', roles: ['admin', 'director_general', 'jefe_admin', 'asistente_admin'] },
      { icon: <SettingsIcon />, label: 'Configuración', path: '/settings', roles: ['admin', 'director_general', 'jefe_admin', 'jefe_finanzas', 'asistente_admin'] },
      { icon: <AdminIcon />, label: 'Auditoría', path: '/audit', roles: ['admin', 'director_general', 'jefe_admin', 'asistente_admin'] }
    ]
  }
];

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasAnyRole } = useAuth();
  const { isDarkMode, toggleTheme } = useCustomTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Inventario']); // Inventario expandido por defecto

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  const toggleMenu = (menuLabel: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuLabel)
        ? prev.filter(m => m !== menuLabel)
        : [...prev, menuLabel]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isMenuActive = (item: NavItem): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(subItem => isActive(subItem.path));
    }
    return false;
  };

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      // OPTIMIZADO: Color sólido en lugar de gradient fixed
      bgcolor: isDarkMode ? '#060b28' : '#f8fafc',
    }}>
      {/* FPS Counter - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && <FPSCounter isDarkMode={isDarkMode} />}

      {/* Sidebar - OPTIMIZADO */}
      <Box
        sx={{
          width: 260,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          py: 3,
          px: 2,
          borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
          // OPTIMIZADO AGRESIVO: Color sólido sin backdrop-filter para mejor FPS
          bgcolor: isDarkMode ? 'rgba(6, 11, 40, 0.98)' : '#ffffff',
          // REMOVIDO: backdrop-filter causa lag durante scroll
          zIndex: 20,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.3)' : '#d1d5db',
            borderRadius: '3px',
            '&:hover': {
              bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.5)' : '#9ca3af'
            }
          }
        }}
      >
        {/* Logo */}
        <Box sx={{ mb: 4, px: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateX(4px)'
              }
            }}
            onClick={() => navigate('/dashboard')}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #0075ff 0%, #21d4fd 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // OPTIMIZADO: shadow simplificado
                boxShadow: isDarkMode
                  ? '0 4px 12px rgba(0, 117, 255, 0.3)'
                  : '0 4px 12px rgba(0, 117, 255, 0.2)',
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                M
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="700" sx={{ color: isDarkMode ? '#fff' : '#111827' }}>
              MOVICAR
            </Typography>
          </Box>
        </Box>

        {/* Navigation Sections */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navSections.map((section) => {
            // Filter items based on roles
            const visibleItems = section.items.filter((item) => {
              if (!item.roles) return true;
              return hasAnyRole(...item.roles);
            });

            // Don't show section if no items are visible
            if (visibleItems.length === 0) return null;

            return (
              <Box key={section.title}>
                {/* Section Title */}
                <Typography
                  variant="overline"
                  sx={{
                    px: 2,
                    mb: 1,
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#6b7280'
                  }}
                >
                  {section.title}
                </Typography>

                {/* Section Items */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {visibleItems.map((item) => (
                    <Box key={item.label}>
                      {/* Item Principal */}
                      <Box
                        onClick={() => {
                          if (item.subItems) {
                            toggleMenu(item.label);
                          } else if (item.path) {
                            navigate(item.path);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          px: 2,
                          py: 1.25,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          // OPTIMIZADO: transition específica
                          transition: 'background-color 0.15s ease, color 0.15s ease',
                          position: 'relative',
                          color: isMenuActive(item) ? '#fff' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'),
                          background: isMenuActive(item)
                            ? 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)'
                            : 'transparent',
                          // OPTIMIZADO: removidos glows
                          '&:hover': {
                            bgcolor: isMenuActive(item) ? '#0075ff' : (isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6'),
                            color: isMenuActive(item) ? '#fff' : (isDarkMode ? 'rgba(255, 255, 255, 0.95)' : '#111827'),
                          },
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '3px',
                            height: isMenuActive(item) ? '20px' : '0px',
                            bgcolor: '#21d4fd',
                            borderRadius: '0 2px 2px 0',
                            transition: 'height 0.15s ease',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>
                          {item.icon}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            fontWeight: isMenuActive(item) ? 600 : 500,
                            fontSize: '0.875rem'
                          }}
                        >
                          {item.label}
                        </Typography>
                        {item.subItems && (
                          <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
                            {expandedMenus.includes(item.label) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </Box>
                        )}
                      </Box>

                      {/* SubItems - Solo si tiene y está expandido */}
                      {item.subItems && expandedMenus.includes(item.label) && (
                        <Box sx={{ pl: 2, mt: 0.5 }}>
                          {item.subItems
                            .filter(subItem => !subItem.roles || hasAnyRole(...subItem.roles))
                            .map((subItem) => (
                              <Box
                                key={subItem.path}
                                onClick={() => subItem.path && navigate(subItem.path)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  px: 2,
                                  py: 1,
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  // OPTIMIZADO: transition específica
                                  transition: 'background-color 0.15s ease, color 0.15s ease',
                                  color: isActive(subItem.path) ? '#21d4fd' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'),
                                  bgcolor: isActive(subItem.path) ? (isDarkMode ? 'rgba(0, 117, 255, 0.15)' : '#eff6ff') : 'transparent',
                                  // OPTIMIZADO: removido glow
                                  '&:hover': {
                                    bgcolor: isActive(subItem.path) ? (isDarkMode ? 'rgba(0, 117, 255, 0.2)' : '#dbeafe') : (isDarkMode ? 'rgba(0, 117, 255, 0.08)' : '#f9fafb'),
                                    color: isActive(subItem.path) ? '#21d4fd' : (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#6b7280')
                                  }
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
                                  {subItem.icon}
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: isActive(subItem.path) ? 600 : 500,
                                    fontSize: '0.8125rem'
                                  }}
                                >
                                  {subItem.label}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* User Info at Bottom */}
        <Box
          sx={{
            mt: 'auto',
            pt: 3,
            // VISION UI - Borde más visible
            borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e5e7eb'
          }}
        >
          <Box
            data-testid="user-menu-trigger"
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              borderRadius: '12px',
              cursor: 'pointer',
              // OPTIMIZADO: transition específica
              transition: 'background-color 0.15s ease',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.1)' : '#f3f4f6',
              }
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #0075ff 0%, #21d4fd 100%)',
                fontSize: '0.875rem',
                fontWeight: 600,
                // OPTIMIZADO: removido glow
              }}
            >
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : '#6b7280'
                }}
              >
                {user?.roles?.[0] || 'Usuario'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* Header - OPTIMIZADO */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 4,
            py: 2,
            position: 'sticky',
            top: 0,
            // OPTIMIZADO AGRESIVO: color sólido sin backdrop-filter
            bgcolor: isDarkMode ? 'rgba(6, 11, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            // REMOVIDO: backdrop-filter causa lag durante scroll
            borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
            zIndex: 10
          }}
        >
          {/* Left: Search Bar */}
          <TextField
            placeholder="Buscar..."
            size="small"
            inputProps={{ 'aria-label': 'Buscar en el sistema' }}
            sx={{
              maxWidth: 280,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                height: '40px',
                fontSize: '0.875rem',
                '& fieldset': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb'
                },
                '&:hover fieldset': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#d1d5db'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0075ff',
                  borderWidth: '1px',
                  // OPTIMIZADO: removido glow
                }
              },
              '& .MuiInputBase-input': {
                color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#111827',
                '&::placeholder': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af',
                  opacity: 1
                }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : '#9ca3af', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          {/* Right: Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Dark/Light Mode Toggle */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: '10px',
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6'
              }}
            >
              <LightModeIcon sx={{ fontSize: 16, color: isDarkMode ? '#6b7280' : '#f59e0b' }} aria-hidden="true" />
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                size="small"
                inputProps={{ 'aria-label': `Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}` }}
                sx={{
                  width: 40,
                  height: 20,
                  padding: 0,
                  '& .MuiSwitch-switchBase': {
                    padding: '2px',
                    '&.Mui-checked': {
                      transform: 'translateX(20px)',
                      color: '#fff',
                      '& + .MuiSwitch-track': {
                        bgcolor: '#0075ff',
                        opacity: 1,
                        // OPTIMIZADO: removido glow
                      }
                    }
                  },
                  '& .MuiSwitch-thumb': {
                    width: 16,
                    height: 16
                  },
                  '& .MuiSwitch-track': {
                    borderRadius: 10,
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db',
                    opacity: 1
                  }
                }}
              />
              <DarkModeIcon sx={{ fontSize: 16, color: isDarkMode ? '#21d4fd' : '#6b7280' }} aria-hidden="true" />
            </Box>

            {/* Divider */}
            <Box sx={{ width: '1px', height: '24px', bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} />

            {/* Notifications */}
            <IconButton
              onClick={() => navigate('/alerts')}
              aria-label="Alertas y notificaciones"
              title="Alertas"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                p: 1,
                // OPTIMIZADO: transition específica
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6',
                  color: isDarkMode ? '#21d4fd' : '#0075ff',
                }
              }}
            >
              <NotificationsIcon sx={{ fontSize: 22 }} />
            </IconButton>

            {/* Email */}
            <IconButton
              aria-label="Mensajes"
              title="Mensajes"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                p: 1,
                // OPTIMIZADO: transition específica
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6',
                  color: isDarkMode ? '#21d4fd' : '#0075ff',
                }
              }}
            >
              <EmailIcon sx={{ fontSize: 22 }} />
            </IconButton>

            {/* Divider */}
            <Box sx={{ width: '1px', height: '24px', bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb' }} aria-hidden="true" />

            {/* Settings */}
            <IconButton
              onClick={() => navigate('/settings')}
              aria-label="Configuración"
              title="Configuración"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                p: 1,
                // OPTIMIZADO: transition específica
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6',
                  color: isDarkMode ? '#21d4fd' : '#0075ff',
                }
              }}
            >
              <SettingsIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Page Content - VISION UI */}
        <Box
          sx={{
            flex: 1,
            p: 4,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: isDarkMode ? 'rgba(6, 11, 40, 0.5)' : '#f9fafb'
            },
            '&::-webkit-scrollbar-thumb': {
              // VISION UI - Scrollbar cyan
              bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.3)' : '#d1d5db',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.5)' : '#9ca3af'
              }
            }
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: -1,
            minWidth: 220,
            borderRadius: '16px',
            // OPTIMIZADO AGRESIVO: color sólido sin backdrop-filter
            bgcolor: isDarkMode ? 'rgba(6, 11, 40, 0.98)' : '#ffffff',
            // REMOVIDO: backdrop-filter causa lag
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
            boxShadow: isDarkMode
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Box>
            <Typography variant="body2" fontWeight="600" sx={{ color: isDarkMode ? '#fff' : '#111827' }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280' }}>
              {user?.email}
            </Typography>
          </Box>
        </MenuItem>
        <Divider sx={{ my: 1, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e5e7eb' }} />
        <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
          <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Configuración
        </MenuItem>
        <MenuItem data-testid="logout-button" onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
