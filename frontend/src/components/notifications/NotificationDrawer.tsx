import React, { useState, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Button,
  Chip,
  Divider,
  alpha,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  OpenInNew as OpenIcon,
  NotificationsNone as EmptyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { AlertListItem } from '../../types/alert';
import { getSeverityColor, formatTimeAgo } from '../../utils/alertUtils';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

// ── Entity navigation map ──────────────────────────────────

const ENTITY_PATHS: Record<string, (id: string) => string> = {
  rental: (id) => `/rentals/${id}`,
  vehicle: (id) => `/inventory/${id}`,
  customer: (id) => `/customers/${id}`,
  invoice: (id) => `/invoices/${id}`,
  quote: (id) => `/quotes/${id}`,
};

// ── Tab filter ─────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'critical';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { isDarkMode } = useCustomTheme();
  const { recentNotifications, unreadCount, markAsRead, markAllAsRead, refreshAlerts } = useNotifications();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // ── Filtered notifications ───────────────────────────────

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return recentNotifications.filter(a => !a.isRead);
      case 'critical':
        return recentNotifications.filter(a => a.severity === 'critical');
      default:
        return recentNotifications;
    }
  }, [activeTab, recentNotifications]);

  const unreadInList = recentNotifications.filter(a => !a.isRead).length;
  const criticalCount = recentNotifications.filter(a => a.severity === 'critical').length;

  // ── Handlers ─────────────────────────────────────────────

  const handleMarkAsRead = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await markAsRead(id);
    } catch {
      enqueueSnackbar('Error al marcar como leída', { variant: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      enqueueSnackbar('Todas las alertas marcadas como leídas', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al marcar alertas', { variant: 'error' });
    }
  };

  const handleNavigate = (alert: AlertListItem) => {
    if (alert.entityType && alert.entityId && ENTITY_PATHS[alert.entityType]) {
      const path = ENTITY_PATHS[alert.entityType](alert.entityId);
      navigate(path);
      onClose();
    }
  };

  const handleViewAll = () => {
    navigate('/alerts');
    onClose();
  };

  // ── Severity icon helper ─────────────────────────────────

  const getSeverityIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    const icons: Record<string, JSX.Element> = {
      critical: <ErrorIcon fontSize="small" sx={{ color }} />,
      warning: <WarningIcon fontSize="small" sx={{ color }} />,
      info: <InfoIcon fontSize="small" sx={{ color }} />,
    };
    return icons[severity] || icons.info;
  };

  // ── Colors ───────────────────────────────────────────────

  const bg = isDarkMode ? '#13131f' : '#ffffff';
  const headerBg = isDarkMode ? '#1c1c2e' : '#f8f9fa';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
  const textPrimary = isDarkMode ? 'rgba(255,255,255,0.95)' : '#111827';
  const textSecondary = isDarkMode ? 'rgba(255,255,255,0.5)' : '#6b7280';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 400,
          bgcolor: bg,
          borderLeft: `1px solid ${borderColor}`,
        }
      }}
    >
      {/* ── Header ────────────────────────────────────────── */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: headerBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: textPrimary, fontSize: '1.1rem' }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={unreadCount}
              size="small"
              sx={{
                bgcolor: '#ef4444',
                color: '#fff',
                fontWeight: 700,
                height: 22,
                minWidth: 22,
                fontSize: '0.75rem',
              }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: textSecondary }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <Box sx={{ borderBottom: `1px solid ${borderColor}` }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: textSecondary,
              '&.Mui-selected': {
                color: '#8b5cf6',
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#8b5cf6',
            },
          }}
        >
          <Tab value="all" label="Todas" />
          <Tab
            value="unread"
            label={`No leídas${unreadInList > 0 ? ` (${unreadInList})` : ''}`}
          />
          <Tab
            value="critical"
            label={`Críticas${criticalCount > 0 ? ` (${criticalCount})` : ''}`}
          />
        </Tabs>
      </Box>

      {/* ── Notification list ─────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredNotifications.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            {activeTab === 'all' ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 56, color: '#10b981', mb: 1.5 }} />
                <Typography variant="body1" fontWeight={500} sx={{ color: textPrimary, mb: 0.5 }}>
                  Todo en orden
                </Typography>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  No hay alertas pendientes
                </Typography>
              </>
            ) : (
              <>
                <EmptyIcon sx={{ fontSize: 56, color: textSecondary, mb: 1.5, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  {activeTab === 'unread' ? 'No hay alertas sin leer' : 'No hay alertas críticas'}
                </Typography>
              </>
            )}
          </Box>
        ) : (
          filteredNotifications.map((alert) => {
            const hasEntity = alert.entityType && alert.entityId && ENTITY_PATHS[alert.entityType];
            const severityColor = getSeverityColor(alert.severity);

            return (
              <Box
                key={alert.id}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderBottom: `1px solid ${borderColor}`,
                  borderLeft: `3px solid ${severityColor}`,
                  bgcolor: alert.isRead ? 'transparent' : alpha(severityColor, 0.04),
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(severityColor, 0.08),
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  {/* Icon */}
                  <Box sx={{ mt: 0.3, flexShrink: 0 }}>
                    {getSeverityIcon(alert.severity)}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                      <Typography
                        variant="body2"
                        fontWeight={alert.isRead ? 400 : 600}
                        sx={{
                          color: textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          mr: 1,
                        }}
                      >
                        {alert.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: textSecondary, flexShrink: 0, fontSize: '0.7rem' }}
                      >
                        {formatTimeAgo(alert.createdAt)}
                      </Typography>
                    </Box>

                    {/* Message */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: textSecondary,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}
                    >
                      {alert.message}
                    </Typography>

                    {/* Actions row */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.75 }}>
                      {!alert.isRead && (
                        <Button
                          size="small"
                          startIcon={<DoneIcon sx={{ fontSize: '14px !important' }} />}
                          onClick={(e) => handleMarkAsRead(e, alert.id)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            color: '#3b82f6',
                            p: '2px 8px',
                            minWidth: 0,
                            borderRadius: '8px',
                            '&:hover': { bgcolor: alpha('#3b82f6', 0.1) },
                          }}
                        >
                          Leído
                        </Button>
                      )}
                      {hasEntity && (
                        <Button
                          size="small"
                          endIcon={<OpenIcon sx={{ fontSize: '12px !important' }} />}
                          onClick={() => handleNavigate(alert)}
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.7rem',
                            color: '#8b5cf6',
                            p: '2px 8px',
                            minWidth: 0,
                            borderRadius: '8px',
                            '&:hover': { bgcolor: alpha('#8b5cf6', 0.1) },
                          }}
                        >
                          Ver
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* ── Footer ────────────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${borderColor}`,
          bgcolor: headerBg,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {unreadInList > 0 && (
          <Button
            fullWidth
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllAsRead}
            sx={{
              textTransform: 'none',
              color: '#3b82f6',
              borderRadius: '10px',
              '&:hover': { bgcolor: alpha('#3b82f6', 0.08) },
            }}
          >
            Marcar todas como leídas
          </Button>
        )}
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={handleViewAll}
          sx={{
            textTransform: 'none',
            borderRadius: '10px',
            borderColor: '#8b5cf6',
            color: '#8b5cf6',
            '&:hover': {
              borderColor: '#8b5cf6',
              bgcolor: alpha('#8b5cf6', 0.08),
            },
          }}
        >
          Ver todas las alertas
        </Button>
      </Box>
    </Drawer>
  );
};

export default NotificationDrawer;
