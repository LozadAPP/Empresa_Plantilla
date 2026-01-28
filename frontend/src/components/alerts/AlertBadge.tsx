import React, { useEffect, useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  alpha
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Done as DoneIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import alertService from '../../services/alertService';
import { getSeverityColor, formatTimeAgo } from '../../utils/alertUtils';
import { AlertListItem } from '../../types/alert';

const AlertBadge: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<AlertListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();

    // OPTIMIZADO: Solo hacer polling cuando la pestaña está visible
    const loadIfVisible = () => {
      if (!document.hidden) {
        loadStats();
      }
    };

    // Refresh every 30 seconds (solo si tab visible)
    const interval = setInterval(loadIfVisible, 30000);

    // También cargar cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadStats = async () => {
    try {
      const response = await alertService.getAlertStats();
      setUnreadCount(response.data?.unread || 0);
    } catch (error) {
      console.error('Error loading alert stats:', error);
    }
  };

  const loadRecentAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertService.getAlerts({ isResolved: false, limit: 5 });
      // Map response to AlertListItem type (convert Date to string if needed)
      const mappedAlerts: AlertListItem[] = (response.data || []).map((a: any) => ({
        id: a.id,
        alertType: a.alertType,
        severity: a.severity,
        title: a.title,
        message: a.message,
        isRead: a.isRead,
        createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date(a.createdAt).toISOString()
      }));
      setRecentAlerts(mappedAlerts);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las alertas';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    loadRecentAlerts();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  const handleViewAll = () => {
    handleClose();
    navigate('/alerts');
  };

  const handleMarkAsRead = async (e: React.MouseEvent, alertId: number) => {
    e.stopPropagation(); // Prevent menu item click
    try {
      await alertService.markAsRead(alertId);
      // Update local state
      setRecentAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, isRead: true } : a
      ));
      // Refresh stats to update badge count
      loadStats();
      enqueueSnackbar('Alerta marcada como leída', { variant: 'success' });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al marcar la alerta como leída';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const getSeverityIcon = (severity: string) => {
    const color = getSeverityColor(severity);
    const icons: Record<string, JSX.Element> = {
      critical: <ErrorIcon fontSize="small" sx={{ color }} />,
      warning: <WarningIcon fontSize="small" sx={{ color }} />,
      info: <InfoIcon fontSize="small" sx={{ color }} />
    };
    return icons[severity] || icons.info;
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{ color: 'inherit' }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              minWidth: 18,
              height: 18
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Alertas
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} sin leer`}
              size="small"
              color="error"
              sx={{ height: 22 }}
            />
          )}
        </Box>
        <Divider />

        {/* Alerts List */}
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Cargando alertas...
            </Typography>
          </Box>
        ) : recentAlerts.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No hay alertas pendientes
            </Typography>
          </Box>
        ) : (
          recentAlerts.map((alert) => (
            <MenuItem
              key={alert.id}
              onClick={() => {
                handleClose();
                navigate('/alerts');
              }}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: `3px solid ${getSeverityColor(alert.severity)}`,
                bgcolor: alert.isRead ? 'transparent' : alpha(getSeverityColor(alert.severity), 0.05),
                '&:hover': {
                  bgcolor: alpha(getSeverityColor(alert.severity), 0.1)
                }
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                <Box sx={{ mt: 0.5 }}>
                  {getSeverityIcon(alert.severity)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography
                      variant="body2"
                      fontWeight={alert.isRead ? 400 : 600}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200
                      }}
                    >
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, flexShrink: 0 }}>
                      {formatTimeAgo(alert.createdAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {alert.message}
                  </Typography>
                </Box>
                {!alert.isRead && (
                  <IconButton
                    size="small"
                    onClick={(e) => handleMarkAsRead(e, alert.id)}
                    title="Marcar como leída"
                    sx={{
                      p: 0.5,
                      flexShrink: 0,
                      color: '#3b82f6',
                      '&:hover': {
                        bgcolor: alpha('#3b82f6', 0.1)
                      }
                    }}
                  >
                    <DoneIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                )}
              </Box>
            </MenuItem>
          ))
        )}

        <Divider />

        {/* Footer */}
        <Box sx={{ p: 1 }}>
          <Button
            fullWidth
            onClick={handleViewAll}
            sx={{ textTransform: 'none' }}
          >
            Ver todas las alertas
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default AlertBadge;
