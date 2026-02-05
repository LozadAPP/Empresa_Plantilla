import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  alpha,
  Badge,
  Pagination,
  FormControlLabel,
  Switch,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import alertService from '../services/alertService';
import { getSeverityColor, getSeverityLabel } from '../utils/alertUtils';
import { Alert as AlertType, AlertStats } from '../types/alert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import { StatCardSkeleton, AlertCardSkeleton, ChartSkeleton } from '../components/common/CardSkeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendData {
  labels: string[];
  datasets: {
    critical: number[];
    warning: number[];
    info: number[];
    total: number[];
  };
}

const Alerts: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setPage(1); // Reset page when filter or showResolved changes
  }, [filter, showResolved]);

  useEffect(() => {
    loadAlerts();
    loadStats();
    loadTrends();
  }, [filter, page, showResolved]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: ITEMS_PER_PAGE
      };
      // Only filter by isResolved when showResolved is false
      if (!showResolved) {
        params.isResolved = false;
      }
      if (filter !== 'all') params.severity = filter;

      const response = await alertService.getAlerts(params);
      setAlerts(response.data);

      // Set pagination from response
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las alertas';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await alertService.getAlertStats();
      setStats(response.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las estadísticas';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const loadTrends = async () => {
    try {
      const response = await alertService.getAlertTrends(7);
      setTrendData(response.data);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al cargar las tendencias';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await alertService.markAsRead(id);
      enqueueSnackbar('Alerta marcada como leída', { variant: 'success' });
      loadAlerts();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al marcar la alerta como leída';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertService.resolveAlert(id);
      enqueueSnackbar('Alerta resuelta exitosamente', { variant: 'success' });
      loadAlerts();
      loadStats();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al resolver la alerta';
      enqueueSnackbar(message, { variant: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadAlerts = alerts.filter(a => !a.isRead);
    if (unreadAlerts.length === 0) return;

    setMarkingAll(true);
    try {
      // Use Promise.all for parallel execution (much faster)
      await Promise.all(
        unreadAlerts.map(alert => alertService.markAsRead(alert.id))
      );
      enqueueSnackbar(`${unreadAlerts.length} alertas marcadas como leídas`, { variant: 'success' });
      loadAlerts();
      loadStats();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Error al marcar las alertas como leídas';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setMarkingAll(false);
    }
  };

  const getSeverityConfig = (severity: string) => {
    const color = getSeverityColor(severity);
    const icons: Record<string, JSX.Element> = {
      critical: <ErrorIcon />,
      warning: <WarningIcon />,
      info: <InfoIcon />
    };
    return {
      color,
      bgcolor: alpha(color, 0.1),
      icon: icons[severity] || icons.info,
      label: getSeverityLabel(severity)
    };
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: any = {
      rental_expiring: 'Renta Próxima a Vencer',
      rental_overdue: 'Renta Vencida',
      payment_pending: 'Pago Pendiente',
      maintenance_due: 'Mantenimiento Programado',
      insurance_expiring: 'Seguro por Vencer',
      low_inventory: 'Inventario Bajo',
      system: 'Sistema',
      custom: 'Personalizada'
    };

    return labels[type] || type;
  };

  if (loading && alerts.length === 0) {
    return (
      <Box>
        {/* Header Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Alertas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Centro de notificaciones y alertas del sistema
          </Typography>
        </Box>

        {/* Stats Cards Skeleton */}
        <Box sx={{ mb: 4 }}>
          <StatCardSkeleton count={4} />
        </Box>

        {/* Chart Skeleton */}
        <Box sx={{ mb: 4 }}>
          <ChartSkeleton height={250} />
        </Box>

        {/* Alerts List Skeleton */}
        <AlertCardSkeleton count={5} />
      </Box>
    );
  }

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Typography variant="h3" fontWeight="700" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, letterSpacing: '-0.02em' }}>
              Alertas
            </Typography>
            {stats && stats.unread > 0 && (
              <Badge badgeContent={stats.unread} color="error" max={99}>
                <NotificationsIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
              </Badge>
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', display: { xs: 'none', sm: 'block' } }}>
            Centro de notificaciones y alertas del sistema
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.5, sm: 2 }
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#10b981'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#10b981'
                  }
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Mostrar resueltas
              </Typography>
            }
          />
          {alerts.some(a => !a.isRead) && (
            <Button
              variant="outlined"
              startIcon={markingAll ? <CircularProgress size={16} /> : <DoneAllIcon />}
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              size="small"
              sx={{
                width: { xs: '100%', sm: 'auto' },
                py: { xs: 1, sm: 0.5 }
              }}
            >
              {markingAll ? 'Procesando...' : isMobile ? 'Marcar leídas' : 'Marcar todas como leídas'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              bgcolor: filter === 'all' ? (isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1)) : 'transparent',
              border: `2px solid ${filter === 'all' ? '#8b5cf6' : 'transparent'}`
            }}
            onClick={() => setFilter('all')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Alertas
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.total || 0}
                  </Typography>
                </Box>
                <NotificationsIcon sx={{ fontSize: 40, opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              bgcolor: filter === 'critical' ? alpha('#ef4444', 0.1) : 'transparent',
              border: `2px solid ${filter === 'critical' ? '#ef4444' : 'transparent'}`
            }}
            onClick={() => setFilter('critical')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Críticas
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444' }}>
                    {stats?.critical || 0}
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, color: '#ef4444', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              bgcolor: filter === 'warning' ? alpha('#f59e0b', 0.1) : 'transparent',
              border: `2px solid ${filter === 'warning' ? '#f59e0b' : 'transparent'}`
            }}
            onClick={() => setFilter('warning')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Advertencias
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b' }}>
                    {stats?.bySeverity.find(s => s.severity === 'warning')?.count || 0}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: '#f59e0b', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              cursor: 'pointer',
              bgcolor: filter === 'info' ? alpha('#3b82f6', 0.1) : 'transparent',
              border: `2px solid ${filter === 'info' ? '#3b82f6' : 'transparent'}`
            }}
            onClick={() => setFilter('info')}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Información
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6' }}>
                    {stats?.bySeverity.find(s => s.severity === 'info')?.count || 0}
                  </Typography>
                </Box>
                <InfoIcon sx={{ fontSize: 40, color: '#3b82f6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Chart */}
      {trendData && (
        <Card sx={{
          mb: 4,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimelineIcon sx={{ color: '#8b5cf6' }} />
              <Typography variant="h6" fontWeight={600}>
                Tendencia de Alertas (Últimos 7 días)
              </Typography>
            </Box>
            <Box sx={{ height: { xs: 200, sm: 250 } }}>
              <Line
                data={{
                  labels: trendData.labels.map(date => {
                    const d = new Date(date);
                    return format(d, 'd MMM', { locale: es });
                  }),
                  datasets: [
                    {
                      label: 'Críticas',
                      data: trendData.datasets.critical,
                      borderColor: filter === 'all' || filter === 'critical' ? '#ef4444' : alpha('#ef4444', 0.3),
                      backgroundColor: filter === 'all' || filter === 'critical' ? alpha('#ef4444', 0.1) : alpha('#ef4444', 0.02),
                      fill: true,
                      tension: 0.4,
                      pointRadius: filter === 'critical' ? 6 : 4,
                      pointHoverRadius: 6,
                      borderWidth: filter === 'critical' ? 3 : 2,
                      hidden: filter !== 'all' && filter !== 'critical'
                    },
                    {
                      label: 'Advertencias',
                      data: trendData.datasets.warning,
                      borderColor: filter === 'all' || filter === 'warning' ? '#f59e0b' : alpha('#f59e0b', 0.3),
                      backgroundColor: filter === 'all' || filter === 'warning' ? alpha('#f59e0b', 0.1) : alpha('#f59e0b', 0.02),
                      fill: true,
                      tension: 0.4,
                      pointRadius: filter === 'warning' ? 6 : 4,
                      pointHoverRadius: 6,
                      borderWidth: filter === 'warning' ? 3 : 2,
                      hidden: filter !== 'all' && filter !== 'warning'
                    },
                    {
                      label: 'Información',
                      data: trendData.datasets.info,
                      borderColor: filter === 'all' || filter === 'info' ? '#3b82f6' : alpha('#3b82f6', 0.3),
                      backgroundColor: filter === 'all' || filter === 'info' ? alpha('#3b82f6', 0.1) : alpha('#3b82f6', 0.02),
                      fill: true,
                      tension: 0.4,
                      pointRadius: filter === 'info' ? 6 : 4,
                      pointHoverRadius: 6,
                      borderWidth: filter === 'info' ? 3 : 2,
                      hidden: filter !== 'all' && filter !== 'info'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        usePointStyle: true,
                        padding: 20
                      }
                    },
                    tooltip: {
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
                      titleColor: isDarkMode ? '#fff' : '#000',
                      bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      borderWidth: 1,
                      padding: 12,
                      cornerRadius: 8
                    }
                  },
                  scales: {
                    x: {
                      grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
                      }
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      },
                      ticks: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        stepSize: 1
                      }
                    }
                  }
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No hay alertas {filter !== 'all' && `de tipo ${filter}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ¡Todo está en orden!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);

            return (
              <Card
                key={alert.id}
                sx={{
                  borderLeft: `4px solid ${severityConfig.color}`,
                  bgcolor: alert.isRead ? (isDarkMode ? 'transparent' : 'rgba(0, 0, 0, 0.02)') : severityConfig.bgcolor,
                  opacity: alert.isResolved ? 0.6 : 1,
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  borderLeftWidth: '4px'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                      <Box sx={{ color: severityConfig.color, mt: 0.5 }}>
                        {severityConfig.icon}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" fontWeight="600">
                            {alert.title}
                          </Typography>
                          {!alert.isRead && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: theme.palette.info.main
                              }}
                            />
                          )}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {alert.message}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={getAlertTypeLabel(alert.alertType)}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={severityConfig.label}
                            size="small"
                            sx={{
                              bgcolor: severityConfig.bgcolor,
                              color: severityConfig.color,
                              border: 'none'
                            }}
                          />
                          <Chip
                            label={format(new Date(alert.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                            size="small"
                            variant="outlined"
                          />
                          {alert.isResolved && (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                              label="Resuelta"
                              size="small"
                              sx={{
                                bgcolor: alpha('#10b981', 0.1),
                                color: '#10b981',
                                border: 'none'
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!alert.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(alert.id)}
                          title="Marcar como leída"
                        >
                          <DoneIcon fontSize="small" />
                        </IconButton>
                      )}

                      {!alert.isResolved && (
                        <IconButton
                          size="small"
                          onClick={() => handleResolve(alert.id)}
                          title="Resolver alerta"
                          sx={{ color: '#10b981' }}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: isDarkMode ? '#fff' : 'inherit'
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Alerts;
