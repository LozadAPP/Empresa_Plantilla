import React, { useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  SwipeableDrawer,
  Collapse,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import FPSCounter from './FPSCounter';
import GlobalSearch from './GlobalSearch';
import { AlertBadge } from '../alerts';
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
  NotificationImportant as AlertsIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Email as EmailIcon,
  Inventory2 as InventoryManagementIcon,
  Group as PeopleIcon,
  ExpandMore as ExpandMoreIcon,
  SpaceDashboard as DashboardInventoryIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  RequestQuote as QuotesIcon,
  MoneyOff as ExpensesIcon,
  Business as SuppliersIcon,
  CalendarMonth as CalendarIcon,
  Storefront as CatalogIcon,
  Description as DocumentsIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useLocation as useLocationContext } from '../../contexts/LocationContext';
import { useNotificationToasts } from '../../hooks/useNotificationToasts';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import CommandPalette from './CommandPalette';
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog';
import { useGuidedTour } from '../../hooks/useGuidedTour';

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

// Estructura del sidebar organizada por departamentos de la empresa
const navSections: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' }
    ]
  },
  {
    title: 'VENTAS',
    items: [
      { icon: <CalendarIcon />, label: 'Calendario', path: '/calendar' },
      { icon: <CatalogIcon />, label: 'Catálogo', path: '/catalog' },
      { icon: <QuotesIcon />, label: 'Cotizaciones', path: '/quotes', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor'] },
      { icon: <CustomersIcon />, label: 'Clientes', path: '/customers', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_finanzas', 'jefe_admin', 'cajero'] },
      { icon: <RentalsIcon />, label: 'Rentas', path: '/rentals', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_inventarios', 'encargado_inventario', 'jefe_finanzas', 'jefe_admin'] },
      { icon: <ReturnsIcon />, label: 'Devoluciones', path: '/returns', roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_inventarios', 'encargado_inventario'] }
    ]
  },
  {
    title: 'INVENTARIO',
    items: [
      {
        icon: <VehiclesIcon />,
        label: 'Inventario',
        roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'encargado_inventario', 'tecnico', 'vendedor'],
        subItems: [
          { icon: <DashboardInventoryIcon />, label: 'Dashboard de Inventario', path: '/inventory', roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'] },
          { icon: <InventoryManagementIcon />, label: 'Gestión de Inventario', path: '/inventory-management', roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'] }
        ]
      },
      { icon: <MaintenanceIcon />, label: 'Mantenimiento', path: '/maintenance', roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario', 'tecnico', 'jefe_admin'] }
    ]
  },
  {
    title: 'FINANZAS',
    items: [
      { icon: <PaymentsIcon />, label: 'Pagos', path: '/payments', roles: ['admin', 'director_general', 'jefe_finanzas', 'cajero', 'jefe_ventas', 'jefe_admin', 'contador'] },
      { icon: <InvoicesIcon />, label: 'Facturas', path: '/invoices', roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_ventas', 'vendedor', 'contador', 'cajero', 'jefe_admin'] },
      { icon: <ExpensesIcon />, label: 'Gastos', path: '/expenses', roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'contador', 'cajero'] },
      { icon: <SuppliersIcon />, label: 'Proveedores', path: '/suppliers', roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'jefe_inventarios', 'contador', 'cajero'] },
      { icon: <AccountingIcon />, label: 'Contabilidad', path: '/accounting', roles: ['admin', 'director_general', 'jefe_finanzas', 'contador', 'jefe_admin'] },
      { icon: <ReportsIcon />, label: 'Reportes', path: '/reports', roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'contador', 'encargado_inventario'] }
    ]
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { icon: <DocumentsIcon />, label: 'Documentos', path: '/documents', roles: ['admin', 'director_general', 'jefe_admin', 'jefe_ventas', 'jefe_finanzas', 'jefe_inventarios', 'asistente_admin', 'contador'] },
      { icon: <PeopleIcon />, label: 'Usuarios', path: '/users', roles: ['admin', 'director_general', 'jefe_admin', 'asistente_admin'] },
      { icon: <AlertsIcon />, label: 'Alertas', path: '/alerts', roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'encargado_inventario', 'tecnico', 'vendedor', 'contador', 'asistente_admin'] },
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
  const theme = useTheme();
  const { selectedLocationId, selectedLocationName, locations, setLocationId, canChangeLocation, loading: locationLoading } = useLocationContext();

  // WebSocket toast notifications (reacts to lastEvent from NotificationContext)
  useNotificationToasts();

  // Media queries para responsive
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.down('md')); // < 900px

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [locationAnchorEl, setLocationAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Inventario']); // Inventario expandido por defecto
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    openCommandPalette: useCallback(() => setCommandPaletteOpen(true), []),
    openShortcutsDialog: useCallback(() => setShortcutsDialogOpen(true), []),
    toggleDarkMode: toggleTheme,
    navigate,
    closeModals: useCallback(() => {
      setCommandPaletteOpen(false);
      setShortcutsDialogOpen(false);
    }, []),
  });

  // Guided tour (auto-launches on first Dashboard visit)
  useGuidedTour(isDarkMode);

  // Handler para toggle del drawer móvil
  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Handler para navegación desde móvil (cierra drawer)
  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

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
      {/* FPS Counter - Desactivado. Para reactivar, descomentar la línea siguiente */}
      {/* {import.meta.env.DEV && <FPSCounter isDarkMode={isDarkMode} />} */}

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
          zIndex: 5, // Menor que header (10) para evitar conflictos
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
        <Box sx={{ mb: 4, px: 2 }} data-tour="logo">
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
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }} data-tour="sidebar-nav">
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
                <Box sx={{ px: 2, mb: 1.5 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Box
                    sx={{
                      width: 24,
                      height: 2,
                      borderRadius: '1px',
                      background: isDarkMode
                        ? 'linear-gradient(90deg, #0075ff, rgba(33, 212, 253, 0.3))'
                        : 'linear-gradient(90deg, #0075ff, rgba(0, 117, 255, 0.2))',
                    }}
                  />
                </Box>

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
                          transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.2s ease',
                          position: 'relative',
                          color: isMenuActive(item) ? '#fff' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'),
                          background: isMenuActive(item)
                            ? 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)'
                            : 'transparent',
                          boxShadow: isMenuActive(item)
                            ? '0 2px 12px rgba(0, 117, 255, 0.25)'
                            : 'none',
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
                            width: isMenuActive(item) ? '3px' : '0px',
                            height: isMenuActive(item) ? '20px' : '0px',
                            bgcolor: '#21d4fd',
                            borderRadius: '0 3px 3px 0',
                            transition: 'height 0.2s ease, width 0.2s ease',
                            boxShadow: isMenuActive(item) ? '0 0 6px rgba(33, 212, 253, 0.4)' : 'none',
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
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 18,
                            transition: 'transform 0.2s ease',
                            transform: expandedMenus.includes(item.label) ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}>
                            <ExpandMoreIcon fontSize="small" />
                          </Box>
                        )}
                      </Box>

                      {/* SubItems - Animacion Collapse */}
                      {item.subItems && (
                        <Collapse in={expandedMenus.includes(item.label)} timeout={200} unmountOnExit>
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
                                    transition: 'background-color 0.15s ease, color 0.15s ease',
                                    color: isActive(subItem.path) ? '#21d4fd' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'),
                                    bgcolor: isActive(subItem.path) ? (isDarkMode ? 'rgba(0, 117, 255, 0.15)' : '#eff6ff') : 'transparent',
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
                        </Collapse>
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
            data-tour="user-profile"
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
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #0075ff 0%, #21d4fd 100%)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </Avatar>
              {/* Online indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  border: `2px solid ${isDarkMode ? 'rgba(6, 11, 40, 0.98)' : '#ffffff'}`,
                }}
              />
            </Box>
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
              <Box
                sx={{
                  display: 'inline-flex',
                  px: 1,
                  py: 0.125,
                  borderRadius: '6px',
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#eff6ff',
                  border: isDarkMode ? '1px solid rgba(0, 117, 255, 0.2)' : '1px solid #dbeafe',
                  mt: 0.25,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: isDarkMode ? '#21d4fd' : '#0075ff',
                    textTransform: 'capitalize',
                  }}
                >
                  {(user?.roles?.[0] || 'Usuario').replace(/_/g, ' ')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Drawer - SwipeableDrawer para mejor UX táctil */}
      <SwipeableDrawer
        variant="temporary"
        anchor="left"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        onOpen={handleDrawerToggle}
        disableBackdropTransition={false}
        disableDiscovery={false}
        swipeAreaWidth={20}
        ModalProps={{
          keepMounted: true, // Mejor rendimiento en móvil
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: { xs: 'calc(100vw - 56px)', sm: 280 },
            maxWidth: 320,
            bgcolor: isDarkMode ? 'rgba(6, 11, 40, 0.98)' : '#ffffff',
            borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
            // Safe area insets para iPhone
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
        }}
      >
        {/* Header del Drawer con botón cerrar */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb'
        }}>
          {/* Logo en Drawer */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
            }}
            onClick={() => handleMobileNavigation('/dashboard')}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #0075ff 0%, #21d4fd 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body1" fontWeight="bold" sx={{ color: '#fff' }}>
                M
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight="700" sx={{ color: isDarkMode ? '#fff' : '#111827', fontSize: '1.125rem' }}>
              MOVICAR
            </Typography>
          </Box>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Contenido de navegación del Drawer */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100% - 72px)',
          py: 2,
          px: 1.5,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.3)' : '#d1d5db',
            borderRadius: '2px',
          }
        }}>
          {/* Navigation Sections - Móvil */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item) => {
                if (!item.roles) return true;
                return hasAnyRole(...item.roles);
              });

              if (visibleItems.length === 0) return null;

              return (
                <Box key={`mobile-${section.title}`}>
                  <Box sx={{ px: 1.5, mb: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {section.title}
                    </Typography>
                    <Box
                      sx={{
                        width: 20,
                        height: 1.5,
                        borderRadius: '1px',
                        background: isDarkMode
                          ? 'linear-gradient(90deg, #0075ff, rgba(33, 212, 253, 0.3))'
                          : 'linear-gradient(90deg, #0075ff, rgba(0, 117, 255, 0.2))',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {visibleItems.map((item) => (
                      <Box key={`mobile-${item.label}`}>
                        <Box
                          onClick={() => {
                            if (item.subItems) {
                              toggleMenu(item.label);
                            } else if (item.path) {
                              handleMobileNavigation(item.path);
                            }
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1.5,
                            py: 1.25,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            color: isMenuActive(item) ? '#fff' : (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151'),
                            background: isMenuActive(item)
                              ? 'linear-gradient(90deg, #0075ff 0%, #21d4fd 100%)'
                              : 'transparent',
                            '&:hover': {
                              bgcolor: isMenuActive(item) ? '#0075ff' : (isDarkMode ? 'rgba(0, 117, 255, 0.1)' : '#f3f4f6'),
                            },
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
                            <Box sx={{
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'transform 0.2s ease',
                              transform: expandedMenus.includes(item.label) ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}>
                              <ExpandMoreIcon fontSize="small" />
                            </Box>
                          )}
                        </Box>

                        {/* SubItems móvil - Animacion Collapse */}
                        {item.subItems && (
                          <Collapse in={expandedMenus.includes(item.label)} timeout={200} unmountOnExit>
                            <Box sx={{ pl: 1.5, mt: 0.25 }}>
                              {item.subItems
                                .filter(subItem => !subItem.roles || hasAnyRole(...subItem.roles))
                                .map((subItem) => (
                                  <Box
                                    key={`mobile-${subItem.path}`}
                                    onClick={() => subItem.path && handleMobileNavigation(subItem.path)}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.5,
                                      px: 1.5,
                                      py: 1,
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.15s ease',
                                      color: isActive(subItem.path) ? '#21d4fd' : (isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'),
                                      bgcolor: isActive(subItem.path) ? (isDarkMode ? 'rgba(0, 117, 255, 0.15)' : '#eff6ff') : 'transparent',
                                      '&:hover': {
                                        bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.08)' : '#f9fafb',
                                      }
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 18 }}>
                                      {subItem.icon}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: isActive(subItem.path) ? 600 : 500, fontSize: '0.8125rem' }}>
                                      {subItem.label}
                                    </Typography>
                                  </Box>
                                ))}
                            </Box>
                          </Collapse>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* User Info en Drawer móvil */}
          <Box sx={{ mt: 'auto', pt: 2, borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb' }}>
            <Box
              onClick={handleMenuOpen}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.5,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.1)' : '#f3f4f6' }
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    background: 'linear-gradient(135deg, #0075ff 0%, #21d4fd 100%)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    border: `2px solid ${isDarkMode ? 'rgba(6, 11, 40, 0.98)' : '#ffffff'}`,
                  }}
                />
              </Box>
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
                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1,
                    py: 0.125,
                    borderRadius: '6px',
                    bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#eff6ff',
                    border: isDarkMode ? '1px solid rgba(0, 117, 255, 0.2)' : '1px solid #dbeafe',
                    mt: 0.25,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: isDarkMode ? '#21d4fd' : '#0075ff',
                      textTransform: 'capitalize',
                    }}
                  >
                    {(user?.roles?.[0] || 'Usuario').replace(/_/g, ' ')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* Header - RESPONSIVE */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 1.5, sm: 2 },
            // Safe area inset para iPhone con notch
            paddingTop: { xs: 'max(env(safe-area-inset-top), 12px)', sm: 'max(env(safe-area-inset-top), 16px)' },
            position: 'sticky',
            top: 0,
            // OPTIMIZADO AGRESIVO: color sólido sin backdrop-filter
            bgcolor: isDarkMode ? 'rgba(6, 11, 40, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            // REMOVIDO: backdrop-filter causa lag durante scroll
            borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
            zIndex: 10,
            gap: { xs: 1, sm: 2 }
          }}
        >
          {/* Left: Hamburger (mobile) + Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flex: 1 }}>
            {/* Hamburger button - Solo visible en móvil/tablet */}
            <IconButton
              onClick={handleDrawerToggle}
              aria-label="Abrir menú de navegación"
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151',
                p: 1,
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6',
                }
              }}
            >
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>

            {/* Global Search - Búsqueda funcional en todas las entidades */}
            <Box data-tour="global-search" sx={{ flex: 1 }}>
              <GlobalSearch />
            </Box>
          </Box>

          {/* Location Selector - Sucursal activa */}
          <Box
            data-tour="location-selector"
            onClick={canChangeLocation ? (e: React.MouseEvent<HTMLElement>) => setLocationAnchorEl(e.currentTarget) : undefined}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: { xs: 1, sm: 1.5 },
              py: 0.75,
              borderRadius: '12px',
              cursor: canChangeLocation ? 'pointer' : 'default',
              bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.06)',
              border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.15)'}`,
              transition: 'all 0.2s ease',
              flexShrink: 0,
              maxWidth: { xs: 160, sm: 220, md: 260 },
              ...(canChangeLocation && {
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                  borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.3)',
                },
              }),
            }}
          >
            <LocationOnIcon sx={{
              fontSize: { xs: 18, sm: 20 },
              color: '#8b5cf6',
              flexShrink: 0,
            }} />
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                fontWeight: 600,
                color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : '#374151',
                display: { xs: 'none', sm: 'block' },
                lineHeight: 1.2,
              }}
            >
              {locationLoading ? '...' : selectedLocationName}
            </Typography>
            {canChangeLocation && (
              <ExpandMoreIcon sx={{
                fontSize: 16,
                color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#9ca3af',
                display: { xs: 'none', sm: 'block' },
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                transform: locationAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
              }} />
            )}
          </Box>
          <Menu
            anchorEl={locationAnchorEl}
            open={Boolean(locationAnchorEl)}
            onClose={() => setLocationAnchorEl(null)}
            PaperProps={{
              sx: {
                mt: 1,
                bgcolor: isDarkMode ? '#1c1c2e' : '#ffffff',
                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.08)'}`,
                borderRadius: '12px',
                minWidth: 240,
                boxShadow: isDarkMode
                  ? '0 8px 32px rgba(0,0,0,0.4)'
                  : '0 8px 32px rgba(0,0,0,0.1)',
              },
            }}
          >
            <MenuItem
              onClick={() => { setLocationId(null); setLocationAnchorEl(null); }}
              selected={selectedLocationId === null}
              sx={{
                borderRadius: '8px',
                mx: 0.5,
                my: 0.25,
                fontSize: '0.85rem',
                fontWeight: selectedLocationId === null ? 700 : 400,
                color: selectedLocationId === null
                  ? '#8b5cf6'
                  : isDarkMode ? 'rgba(255,255,255,0.8)' : '#374151',
                '&.Mui-selected': {
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
                },
              }}
            >
              Todas las sucursales
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
            {locations.map((loc) => (
              <MenuItem
                key={loc.id}
                onClick={() => { setLocationId(loc.id); setLocationAnchorEl(null); }}
                selected={selectedLocationId === loc.id}
                sx={{
                  borderRadius: '8px',
                  mx: 0.5,
                  my: 0.25,
                  fontSize: '0.85rem',
                  fontWeight: selectedLocationId === loc.id ? 700 : 400,
                  color: selectedLocationId === loc.id
                    ? '#8b5cf6'
                    : isDarkMode ? 'rgba(255,255,255,0.8)' : '#374151',
                  '&.Mui-selected': {
                    bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
                  },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: 'inherit' }}>
                    {loc.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af', fontSize: '0.7rem' }}>
                    {loc.city}, {loc.state}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* Right: Controls - RESPONSIVE */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, md: 2 } }}>
            {/* Theme Toggle - Pill Premium (desktop) */}
            <Box
              data-tour="theme-toggle"
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDarkMode}
              aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } }}
              sx={{
                width: 52,
                height: 28,
                borderRadius: '14px',
                cursor: 'pointer',
                position: 'relative',
                background: isDarkMode
                  ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)'
                  : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                border: isDarkMode
                  ? '1px solid rgba(33, 212, 253, 0.3)'
                  : '1px solid rgba(245, 158, 11, 0.4)',
                transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.3s ease',
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                p: '2px',
                flexShrink: 0,
                '&:hover': {
                  borderColor: isDarkMode ? 'rgba(33, 212, 253, 0.5)' : 'rgba(245, 158, 11, 0.6)',
                  boxShadow: isDarkMode
                    ? '0 0 8px rgba(33, 212, 253, 0.2)'
                    : '0 0 8px rgba(245, 158, 11, 0.2)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${isDarkMode ? '#21d4fd' : '#f59e0b'}`,
                  outlineOffset: '2px',
                },
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isDarkMode ? 'translateX(24px)' : 'translateX(0px)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isDarkMode
                    ? '0 1px 4px rgba(0,0,0,0.3)'
                    : '0 1px 4px rgba(245, 158, 11, 0.3)',
                }}
              >
                {isDarkMode ? (
                  <DarkModeIcon sx={{ fontSize: 14, color: '#1e3a5f' }} />
                ) : (
                  <LightModeIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                )}
              </Box>
            </Box>
            {/* Theme Toggle - Mobile (icon only) */}
            <IconButton
              onClick={toggleTheme}
              aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                color: isDarkMode ? '#21d4fd' : '#f59e0b',
                p: 0.75,
              }}
            >
              {isDarkMode ? <DarkModeIcon sx={{ fontSize: 20 }} /> : <LightModeIcon sx={{ fontSize: 20 }} />}
            </IconButton>

            {/* Divider - Gradiente vertical */}
            <Box
              sx={{
                width: '1px',
                height: '24px',
                background: isDarkMode
                  ? 'linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)'
                  : 'linear-gradient(180deg, transparent, #d1d5db, transparent)',
                display: { xs: 'none', sm: 'block' },
              }}
              aria-hidden="true"
            />

            {/* Notifications - AlertBadge con conteo real */}
            <Tooltip title="Alertas" arrow>
              <Box data-tour="alerts" sx={{ display: 'flex' }}>
                <AlertBadge />
              </Box>
            </Tooltip>

            {/* Email */}
            <Tooltip title="Mensajes" arrow>
            <IconButton
              aria-label="Mensajes"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                p: 1,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '10px',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6',
                  color: isDarkMode ? '#21d4fd' : '#0075ff',
                }
              }}
            >
              <EmailIcon sx={{ fontSize: 22 }} />
            </IconButton>
            </Tooltip>

            {/* Divider - Gradiente vertical */}
            <Box
              sx={{
                width: '1px',
                height: '24px',
                background: isDarkMode
                  ? 'linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)'
                  : 'linear-gradient(180deg, transparent, #d1d5db, transparent)',
                display: { xs: 'none', sm: 'block' },
              }}
              aria-hidden="true"
            />

            {/* Settings - Con rotacion al hover */}
            <Tooltip title="Configuración" arrow>
            <IconButton
              data-tour="settings"
              onClick={() => navigate('/settings')}
              aria-label="Configuración"
              sx={{
                display: { xs: 'none', sm: 'flex' },
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : '#6b7280',
                p: 1,
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '10px',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                '& svg': {
                  transition: 'transform 0.4s ease',
                },
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(0, 117, 255, 0.12)' : '#f3f4f6',
                  color: isDarkMode ? '#21d4fd' : '#0075ff',
                  '& svg': {
                    transform: 'rotate(90deg)',
                  },
                }
              }}
            >
              <SettingsIcon sx={{ fontSize: 22 }} />
            </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Page Content - VISION UI RESPONSIVE */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
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

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenShortcuts={() => setShortcutsDialogOpen(true)}
      />

      {/* Keyboard Shortcuts Dialog (Ctrl+/) */}
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onClose={() => setShortcutsDialogOpen(false)}
      />
    </Box>
  );
};

export default Layout;
