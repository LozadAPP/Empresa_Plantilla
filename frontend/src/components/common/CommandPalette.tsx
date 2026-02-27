/**
 * Command Palette (Ctrl+K) — Navegación rápida y acciones con cmdk.
 * Filtrado por RBAC: solo muestra rutas accesibles al usuario actual.
 */
import React, { useCallback } from 'react';
import { Command } from 'cmdk';
import { Box, Dialog } from '@mui/material';
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
  AdminPanelSettings as AuditIcon,
  Group as UsersIcon,
  MoneyOff as ExpensesIcon,
  Business as SuppliersIcon,
  CalendarMonth as CalendarIcon,
  Storefront as CatalogIcon,
  Description as DocumentsIcon,
  RequestQuote as QuotesIcon,
  Add as AddIcon,
  DarkMode as ThemeIcon,
  Keyboard as ShortcutsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
}

interface CommandDef {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  roles?: string[];
}

const CommandPalette: React.FC<Props> = ({ open, onClose, onOpenShortcuts }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { hasAnyRole } = useAuth();

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const navCommands: CommandDef[] = [
    { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} />, action: () => go('/dashboard') },
    { label: 'Calendario', icon: <CalendarIcon sx={{ fontSize: 18 }} />, action: () => go('/calendar') },
    { label: 'Catálogo', icon: <CatalogIcon sx={{ fontSize: 18 }} />, action: () => go('/catalog') },
    { label: 'Cotizaciones', icon: <QuotesIcon sx={{ fontSize: 18 }} />, action: () => go('/quotes'), roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor'] },
    { label: 'Clientes', icon: <CustomersIcon sx={{ fontSize: 18 }} />, action: () => go('/customers'), roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_finanzas', 'jefe_admin', 'cajero'] },
    { label: 'Rentas', icon: <RentalsIcon sx={{ fontSize: 18 }} />, action: () => go('/rentals'), roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_inventarios', 'encargado_inventario', 'jefe_finanzas', 'jefe_admin'] },
    { label: 'Devoluciones', icon: <ReturnsIcon sx={{ fontSize: 18 }} />, action: () => go('/returns'), roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor', 'jefe_inventarios', 'encargado_inventario'] },
    { label: 'Inventario', icon: <VehiclesIcon sx={{ fontSize: 18 }} />, action: () => go('/inventory'), roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario'] },
    { label: 'Mantenimiento', icon: <MaintenanceIcon sx={{ fontSize: 18 }} />, action: () => go('/maintenance'), roles: ['admin', 'director_general', 'jefe_inventarios', 'encargado_inventario', 'tecnico', 'jefe_admin'] },
    { label: 'Pagos', icon: <PaymentsIcon sx={{ fontSize: 18 }} />, action: () => go('/payments'), roles: ['admin', 'director_general', 'jefe_finanzas', 'cajero', 'jefe_ventas', 'jefe_admin', 'contador'] },
    { label: 'Facturas', icon: <InvoicesIcon sx={{ fontSize: 18 }} />, action: () => go('/invoices'), roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_ventas', 'vendedor', 'contador', 'cajero', 'jefe_admin'] },
    { label: 'Gastos', icon: <ExpensesIcon sx={{ fontSize: 18 }} />, action: () => go('/expenses'), roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'contador', 'cajero'] },
    { label: 'Proveedores', icon: <SuppliersIcon sx={{ fontSize: 18 }} />, action: () => go('/suppliers'), roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'jefe_inventarios', 'contador', 'cajero'] },
    { label: 'Contabilidad', icon: <AccountingIcon sx={{ fontSize: 18 }} />, action: () => go('/accounting'), roles: ['admin', 'director_general', 'jefe_finanzas', 'contador', 'jefe_admin'] },
    { label: 'Reportes', icon: <ReportsIcon sx={{ fontSize: 18 }} />, action: () => go('/reports'), roles: ['admin', 'director_general', 'jefe_inventarios', 'jefe_ventas', 'jefe_finanzas', 'jefe_admin', 'contador', 'encargado_inventario'] },
    { label: 'Documentos', icon: <DocumentsIcon sx={{ fontSize: 18 }} />, action: () => go('/documents'), roles: ['admin', 'director_general', 'jefe_admin', 'jefe_ventas', 'jefe_finanzas', 'jefe_inventarios', 'asistente_admin', 'contador'] },
    { label: 'Usuarios', icon: <UsersIcon sx={{ fontSize: 18 }} />, action: () => go('/users'), roles: ['admin', 'director_general', 'jefe_admin', 'asistente_admin'] },
    { label: 'Alertas', icon: <AlertsIcon sx={{ fontSize: 18 }} />, action: () => go('/alerts') },
    { label: 'Configuración', icon: <SettingsIcon sx={{ fontSize: 18 }} />, action: () => go('/settings'), roles: ['admin', 'director_general', 'jefe_admin', 'jefe_finanzas', 'asistente_admin'] },
    { label: 'Auditoría', icon: <AuditIcon sx={{ fontSize: 18 }} />, action: () => go('/audit'), roles: ['admin', 'director_general', 'jefe_admin', 'asistente_admin'] },
  ];

  const actionCommands: CommandDef[] = [
    { label: 'Nueva Renta', icon: <AddIcon sx={{ fontSize: 18 }} />, action: () => go('/rentals/new'), roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor'] },
    { label: 'Nueva Cotización', icon: <AddIcon sx={{ fontSize: 18 }} />, action: () => go('/quotes/new'), roles: ['admin', 'director_general', 'jefe_ventas', 'vendedor'] },
    { label: 'Nuevo Gasto', icon: <AddIcon sx={{ fontSize: 18 }} />, action: () => go('/expenses/new'), roles: ['admin', 'director_general', 'jefe_finanzas', 'jefe_admin', 'contador'] },
  ];

  const prefCommands: CommandDef[] = [
    { label: isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro', icon: <ThemeIcon sx={{ fontSize: 18 }} />, action: () => { toggleTheme(); onClose(); } },
    { label: 'Ver Atajos de Teclado', icon: <ShortcutsIcon sx={{ fontSize: 18 }} />, action: () => { onClose(); onOpenShortcuts(); } },
  ];

  const filterByRole = (commands: CommandDef[]) =>
    commands.filter(cmd => !cmd.roles || hasAnyRole(...cmd.roles));

  const bgColor = isDarkMode ? '#1c1c2e' : '#fff';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const hoverBg = isDarkMode ? 'rgba(0, 117, 255, 0.12)' : 'rgba(0, 117, 255, 0.06)';
  const activeBg = isDarkMode ? 'rgba(0, 117, 255, 0.2)' : 'rgba(0, 117, 255, 0.1)';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: bgColor,
          border: `1px solid ${borderColor}`,
          overflow: 'hidden',
          mt: -10,
        },
      }}
    >
      <Command
        label="Paleta de comandos"
        style={{ fontFamily: '"Poppins", system-ui, sans-serif' }}
      >
        <Box
          sx={{
            p: 1.5,
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          <Command.Input
            placeholder="Buscar comando..."
            autoFocus
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '0.9375rem',
              fontFamily: '"Poppins", system-ui, sans-serif',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: isDarkMode ? 'rgba(255,255,255,0.95)' : '#111827',
            }}
          />
        </Box>
        <Command.List
          style={{
            maxHeight: 360,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          <Command.Empty
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: isDarkMode ? 'rgba(255,255,255,0.5)' : '#9ca3af',
              fontSize: '0.875rem',
            }}
          >
            No se encontraron comandos
          </Command.Empty>

          <Command.Group
            heading="Navegación"
            style={{ marginBottom: 8 }}
          >
            <Box
              component="span"
              sx={{
                display: 'block',
                px: 1.5,
                py: 0.75,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                textTransform: 'uppercase',
              }}
            >
              Navegación
            </Box>
            {filterByRole(navCommands).map(cmd => (
              <Command.Item
                key={cmd.label}
                value={cmd.label}
                onSelect={cmd.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#374151',
                  fontSize: '0.875rem',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                data-active-bg={activeBg}
              >
                {cmd.icon}
                {cmd.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Acciones" style={{ marginBottom: 8 }}>
            <Box
              component="span"
              sx={{
                display: 'block',
                px: 1.5,
                py: 0.75,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                textTransform: 'uppercase',
              }}
            >
              Acciones
            </Box>
            {filterByRole(actionCommands).map(cmd => (
              <Command.Item
                key={cmd.label}
                value={cmd.label}
                onSelect={cmd.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#374151',
                  fontSize: '0.875rem',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {cmd.icon}
                {cmd.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Preferencias">
            <Box
              component="span"
              sx={{
                display: 'block',
                px: 1.5,
                py: 0.75,
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: isDarkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                textTransform: 'uppercase',
              }}
            >
              Preferencias
            </Box>
            {prefCommands.map(cmd => (
              <Command.Item
                key={cmd.label}
                value={cmd.label}
                onSelect={cmd.action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#374151',
                  fontSize: '0.875rem',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {cmd.icon}
                {cmd.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        {/* Footer hint */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Box component="span" sx={{ fontSize: '0.7rem', color: isDarkMode ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>
            ↑↓ navegar &nbsp; ↵ seleccionar &nbsp; esc cerrar
          </Box>
        </Box>
      </Command>
    </Dialog>
  );
};

export default CommandPalette;
