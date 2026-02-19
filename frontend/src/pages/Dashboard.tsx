import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  alpha,
  Chip,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Button,
  IconButton,
  Alert,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Build as MaintenanceIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as AvailableIcon,
  Info as RentedIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  DirectionsCar as DirectionsCarIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { dashboardService } from '../services/dashboardService';
import { inventoryService } from '../services/inventoryService';
import { DashboardData, InventoryItem, ItemCategory } from '../types';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { StyledKPI, StyledSection } from '../components/styled';
import { useCurrency } from '../contexts/CurrencyContext';
import { Doughnut, Line } from 'react-chartjs-2';
import InventoryMap from '../components/maps/InventoryMap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const { isDarkMode, text, chart, tooltip, background, border, purple, status } = useThemeStyles();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState<DashboardData | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodTab, setPeriodTab] = useState(2); // 0: Hoy, 1: Semana, 2: Mes, 3: Año
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [showAllInventory, setShowAllInventory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Estados para modal de imagen del inventario
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedItemForImage, setSelectedItemForImage] = useState<InventoryItem | null>(null);

  // Estados para datos reales del backend (Fase 2.3)
  const [recentRentals, setRecentRentals] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);

  // Moneda global desde CurrencyContext (persistida en localStorage)
  const { currency, currencies, setCurrency, formatCompactCurrency, formatExactCurrency, formatChartValue } = useCurrency();
  const [currencyMenuAnchor, setCurrencyMenuAnchor] = useState<null | HTMLElement>(null);

  // Límite de tarjetas visibles antes de "Ver más"
  const VISIBLE_CARDS = 3;

  // Filtrar items por categoría seleccionada
  const filteredInventoryItems = useMemo(() => {
    if (selectedCategory === 'all') return inventoryItems;
    return inventoryItems.filter(item => item.categoryName === selectedCategory);
  }, [inventoryItems, selectedCategory]);

  // OPTIMIZADO: useCallback para handler de click en inventario (movido antes de returns)
  const handleInventoryItemClick = useCallback((item: InventoryItem) => {
    setSelectedInventoryItem(item);
  }, []);

  // Callback para abrir modal de imagen desde el mapa
  const handleViewItemDetails = useCallback((item: InventoryItem) => {
    setSelectedItemForImage(item);
    setImageModalOpen(true);
  }, []);

  // OPTIMIZADO: Calcular totalVehicles con useMemo (movido antes de returns)
  const totalVehicles = useMemo(() => {
    const types = data?.charts?.vehiclesByType || [];
    return types.reduce((sum, t) => sum + (t.count || 0), 0);
  }, [data?.charts?.vehiclesByType]);

  // Performance Chart Data - OPTIMIZADO con useMemo (movido antes de returns)
  const performanceChartData = useMemo(() => {
    // Si tenemos datos reales del backend, usarlos
    if (performanceData && performanceData.length > 0) {
      const labels = performanceData.map((d: any) => {
        const date = new Date(d.timeBucket);
        if (periodTab === 0) return date.getHours() + ':00';
        if (periodTab === 1) return date.toLocaleDateString('es-ES', { weekday: 'short' });
        if (periodTab === 2) {
          const day = date.getDate();
          const weekNum = Math.ceil(day / 7);
          return `Sem ${weekNum}`;
        }
        return date.toLocaleDateString('es-ES', { month: 'short' });
      });

      return {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: performanceData.map((d: any) => d.revenue),
            borderColor: isDarkMode ? '#a78bfa' : '#7c3aed',
            backgroundColor: isDarkMode ? alpha('#a78bfa', 0.15) : alpha('#7c3aed', 0.08),
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Ocupación %',
            data: performanceData.map((d: any) => d.occupancy),
            borderColor: isDarkMode ? '#34d399' : '#059669',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      };
    }

    // FALLBACK: datos demo
    const periods = {
      0: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      1: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      2: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      3: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    };
    const revenueData = {
      0: [0, 0, 0, 0, 0, 0],
      1: [0, 0, 0, 0, 0, 0, 0],
      2: [0, 0, 0, 0],
      3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
    const occupancyData = {
      0: [0, 0, 0, 0, 0, 0],
      1: [0, 0, 0, 0, 0, 0, 0],
      2: [0, 0, 0, 0],
      3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };

    return {
      labels: periods[periodTab as keyof typeof periods],
      datasets: [
        {
          label: 'Ingresos',
          data: revenueData[periodTab as keyof typeof revenueData],
          borderColor: isDarkMode ? '#a78bfa' : '#7c3aed',
          backgroundColor: isDarkMode ? alpha('#a78bfa', 0.15) : alpha('#7c3aed', 0.08),
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Ocupación %',
          data: occupancyData[periodTab as keyof typeof occupancyData],
          borderColor: isDarkMode ? '#34d399' : '#059669',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [performanceData, periodTab, isDarkMode]);

  // OPTIMIZADO: chartOptions memoizado (movido antes de returns)
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !isMobile,
        position: 'top' as const,
        labels: {
          color: text.primary,
          usePointStyle: true,
          padding: isMobile ? 8 : 15
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        ticks: {
          color: chart.tickColor,
          callback: (value: number | string) => formatChartValue(Number(value)),
          font: { size: isMobile ? 10 : 12 }
        },
        grid: { color: chart.gridColor }
      },
      y1: {
        type: 'linear' as const,
        display: !isMobile,
        position: 'right' as const,
        beginAtZero: true,
        max: 100,
        ticks: {
          color: chart.tickColor,
          callback: (value: number | string) => Number(value) + '%',
          font: { size: isMobile ? 10 : 12 }
        },
        grid: { drawOnChartArea: false }
      },
      x: {
        ticks: {
          color: chart.tickColor,
          font: { size: isMobile ? 10 : 12 },
          maxRotation: isMobile ? 45 : 0
        },
        grid: { color: chart.gridColor }
      }
    }
  }), [text.primary, chart.tickColor, chart.gridColor, isMobile, formatChartValue]);

  // OPTIMIZADO: doughnutOptions memoizado (movido antes de returns)
  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#ffffff' : '#1f2937',
          padding: 8,
          font: { size: 10, family: 'Poppins', weight: 500 },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / totalVehicles) * 100).toFixed(0);
                return {
                  text: `${label} ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  fontColor: isDarkMode ? '#ffffff' : '#1f2937',
                  hidden: false,
                  index: i,
                  pointStyle: 'circle'
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: tooltip.backgroundColor,
        titleColor: tooltip.titleColor,
        bodyColor: tooltip.bodyColor,
        borderColor: tooltip.borderColor,
        borderWidth: 1,
        padding: 10,
        bodyFont: { size: 12, family: 'Poppins', weight: 500 },
        titleFont: { size: 13, family: 'Poppins', weight: 600 },
        callbacks: {
          label: (context: any) => {
            const value = context.parsed;
            const percentage = ((value / totalVehicles) * 100).toFixed(1);
            return ` ${value} vehículos (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  }), [isDarkMode, tooltip.backgroundColor, tooltip.titleColor, tooltip.bodyColor, tooltip.borderColor, totalVehicles]);

  // OPTIMIZADO: Fleet Distribution Chart Data - Memoizado para evitar re-creación (movido antes de returns)
  const fleetTypes = useMemo(() => {
    const types = data?.charts?.vehiclesByType || [];
    const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];
    return types.map((t, i) => ({
      label: t.type,
      value: t.count || 0,
      color: colors[i % colors.length]
    }));
  }, [data?.charts?.vehiclesByType]);

  const fleetDistributionData = useMemo(() => ({
    labels: fleetTypes.map(t => t.label),
    datasets: [{
      data: fleetTypes.map(t => t.value),
      backgroundColor: fleetTypes.map(t => t.color),
      borderWidth: 4,
      borderColor: isDarkMode ? '#1c1c2e' : '#ffffff',
      hoverBorderWidth: 6,
      hoverOffset: 12,
      spacing: 3,
      offset: 5,
    }]
  }), [fleetTypes, isDarkMode]);

  // Calcular fechas según el periodo seleccionado
  const getDateRange = (period: number): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;

    switch (period) {
      case 0: // Hoy
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 1: // Semana
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        start = new Date(now);
        start.setDate(now.getDate() + diffToMonday);
        start.setHours(0, 0, 0, 0);
        break;
      case 2: // Mes
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case 3: // Año
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    return { start, end };
  };

  // Carga inicial: todos los endpoints (solo una vez)
  useEffect(() => {
    loadAllData();
  }, []);

  // Cambio de periodo: solo endpoints que dependen del periodo
  useEffect(() => {
    if (!initialLoading) {
      refreshPeriodData();
    }
  }, [periodTab]);

  const getPeriodParam = (tab: number): 'day' | 'week' | 'month' | 'year' => {
    const map: { [key: number]: 'day' | 'week' | 'month' | 'year' } = { 0: 'day', 1: 'week', 2: 'month', 3: 'year' };
    return map[tab] || 'month';
  };

  // Carga completa inicial (8 endpoints en paralelo)
  const loadAllData = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const { start, end } = getDateRange(periodTab);
      const selectedPeriod = getPeriodParam(periodTab);

      const [
        mainResponse,
        rentalsResponse,
        customersResponse,
        alertsResponse,
        performanceResponse,
        maintenanceResponse,
        categoriesData,
        itemsData
      ] = await Promise.all([
        dashboardService.getMain({ start_date: start.toISOString(), end_date: end.toISOString() }),
        dashboardService.getRecentRentals(5).catch(() => ({ data: [] })),
        dashboardService.getTopCustomers(5).catch(() => ({ data: [] })),
        dashboardService.getCriticalAlerts().catch(() => ({ data: [] })),
        dashboardService.getPerformanceData(selectedPeriod).catch(() => ({ data: [] })),
        dashboardService.getMaintenanceSchedule().catch(() => ({ data: { overdue: [], upcoming: [] } })),
        inventoryService.getAllCategories().catch(() => ({ data: [] })),
        inventoryService.getAllItems().catch(() => ({ data: [] }))
      ]);

      setData(mainResponse.data || null);
      setRecentRentals(rentalsResponse.data || []);
      setTopCustomers(customersResponse.data || []);
      setAlerts(alertsResponse.data || []);
      setPerformanceData(performanceResponse.data || []);
      setMaintenanceData(maintenanceResponse.data || { overdue: [], upcoming: [] });
      setCategories(categoriesData.data?.length > 0 ? categoriesData.data : []);
      setInventoryItems(itemsData.data?.length > 0 ? itemsData.data : []);

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al cargar el dashboard';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setInitialLoading(false);
    }
  };

  // Refresh suave: solo datos que dependen del periodo (KPIs + gráfica)
  const refreshPeriodData = async () => {
    try {
      setRefreshing(true);

      const { start, end } = getDateRange(periodTab);
      const selectedPeriod = getPeriodParam(periodTab);

      const [mainResponse, performanceResponse] = await Promise.all([
        dashboardService.getMain({ start_date: start.toISOString(), end_date: end.toISOString() }),
        dashboardService.getPerformanceData(selectedPeriod).catch(() => ({ data: [] }))
      ]);

      setData(mainResponse.data || null);
      setPerformanceData(performanceResponse.data || []);

    } catch (error: any) {
      console.error('Error refreshing period data:', error);
      enqueueSnackbar('Error al actualizar datos del periodo', { variant: 'warning' });
    } finally {
      setRefreshing(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 10 }}>
        <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Error al cargar dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            setError(null);
            loadAllData();
          }}
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  // KPIs reales del backend
  const kpiData = {
    // Vehículos
    fleetOccupancy: data?.kpis?.vehicles?.occupancyRate || 0,
    occupancyGoal: 75, // Meta configurada
    availableVehicles: data?.kpis?.vehicles?.available || 0,
    rentedVehicles: data?.kpis?.vehicles?.rented || 0,
    maintenanceVehicles: data?.kpis?.vehicles?.maintenance || 0,
    totalVehicles: data?.kpis?.vehicles?.total || 0,

    // Finanzas reales
    todayIncome: data?.kpis?.financial?.todayIncome || 0,
    monthRevenue: data?.kpis?.financial?.monthIncome || 0,
    pendingPayments: data?.kpis?.financial?.pendingPayments || 0,

    // Clientes
    totalCustomers: data?.kpis?.customers?.total || 0,
    activeCustomers: data?.kpis?.customers?.active || 0,
  };

  // Datos eliminados - ahora vienen del backend (recentRentals, topCustomers, alerts) - Fase 2.3

  const getOccupancyColor = (value: number, goal: number) => {
    if (value >= goal) return '#10b981'; // Green
    if (value >= goal * 0.8) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <Box sx={{ position: 'relative', maxWidth: 1400, mx: 'auto' }}>
      {/* Barra de progreso sutil al cambiar periodo */}
      {refreshing && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            height: 3,
            borderRadius: 2,
            '& .MuiLinearProgress-bar': { backgroundColor: '#8b5cf6' },
            backgroundColor: alpha('#8b5cf6', 0.15),
          }}
        />
      )}
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h2" sx={{ mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Dashboard Ejecutivo
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Resumen del negocio en tiempo real
        </Typography>
      </Box>

      {/* Currency Menu (anclado al chip dentro del KPI de Pagos Pendientes) */}
      <Menu
        anchorEl={currencyMenuAnchor}
        open={Boolean(currencyMenuAnchor)}
        onClose={() => setCurrencyMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: '12px',
            minWidth: 220,
            ...(isDarkMode ? {
              background: 'rgba(6, 11, 40, 0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
            } : {}),
          }
        }}
      >
        {Object.entries(currencies).map(([code, { symbol, name }]) => (
          <MenuItem
            key={code}
            onClick={() => { setCurrency(code); setCurrencyMenuAnchor(null); }}
            sx={{
              fontSize: '0.85rem',
              gap: 1.5,
              py: 1,
              ...(currency === code ? {
                bgcolor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                fontWeight: 700,
              } : {}),
            }}
          >
            <Typography sx={{
              fontWeight: 700,
              minWidth: 40,
              textAlign: 'center',
              pr: 1.5,
              borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
              color: currency === code ? '#f59e0b' : 'inherit',
            }}>
              {symbol}
            </Typography>
            <Typography sx={{
              fontSize: '0.85rem',
              fontWeight: currency === code ? 700 : 400,
            }}>
              {code} — {name}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* KPI Grid - 3 columnas (2 filas de 3) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: { xs: 3, sm: 4 } }}>
        {/* KPI 1: Ocupación de Flota con barra de progreso */}
        <StyledKPI
          icon={<TrendingUpIcon />}
          label="Ocupación de Flota"
          value={`${kpiData.fleetOccupancy}%`}
          subtitle={`Meta: ${kpiData.occupancyGoal}%`}
          color={getOccupancyColor(kpiData.fleetOccupancy, kpiData.occupancyGoal)}
          index={0}
          extra={
            <Box sx={{ mt: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min((kpiData.fleetOccupancy / kpiData.occupancyGoal) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(getOccupancyColor(kpiData.fleetOccupancy, kpiData.occupancyGoal), 0.15),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: getOccupancyColor(kpiData.fleetOccupancy, kpiData.occupancyGoal),
                  },
                }}
              />
            </Box>
          }
        />

        {/* KPI 2: Disponibles */}
        <StyledKPI
          icon={<AvailableIcon />}
          label="Vehículos Disponibles"
          value={kpiData.availableVehicles}
          subtitle="unidades listas"
          color="#10b981"
          index={1}
        />

        {/* KPI 3: En Renta */}
        <StyledKPI
          icon={<RentedIcon />}
          label="Vehículos en Renta"
          value={kpiData.rentedVehicles}
          subtitle="unidades activas"
          color="#3b82f6"
          index={2}
        />

        {/* KPI 4: Mantenimiento */}
        <StyledKPI
          icon={<MaintenanceIcon />}
          label="En Mantenimiento"
          value={kpiData.maintenanceVehicles}
          subtitle="unidades en servicio"
          color="#f59e0b"
          index={3}
        />

        {/* KPI 5: Ingresos del Periodo */}
        <Tooltip title={formatExactCurrency(kpiData.monthRevenue)} arrow placement="top">
          <Box sx={{ height: '100%' }}>
            <StyledKPI
              icon={<MoneyIcon />}
              label={
                periodTab === 0 ? "Ingresos de Hoy" :
                periodTab === 1 ? "Ingresos de la Semana" :
                periodTab === 2 ? "Ingresos del Mes" :
                "Ingresos del Año"
              }
              value={formatCompactCurrency(kpiData.monthRevenue)}
              color="#8b5cf6"
              subtitle={
                periodTab === 0 && kpiData.todayIncome > 0
                  ? `Hoy: ${formatCompactCurrency(kpiData.todayIncome)}`
                  : 'desde pagos completados'
              }
              index={4}
            />
          </Box>
        </Tooltip>

        {/* KPI 6: Pagos Pendientes + Currency Switcher (top-right) */}
        <Tooltip title={formatExactCurrency(kpiData.pendingPayments)} arrow placement="top">
          <Box sx={{ height: '100%' }}>
            <StyledKPI
              icon={<ReceiptIcon />}
              label="Pagos Pendientes"
              value={formatCompactCurrency(kpiData.pendingPayments)}
              color="#f59e0b"
              subtitle="de rentas activas"
              index={5}
              action={
                <Chip
                  label={`${currencies[currency].symbol} ${currency} ▾`}
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setCurrencyMenuAnchor(e.currentTarget); }}
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    bgcolor: 'rgba(245, 158, 11, 0.12)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(245, 158, 11, 0.2)',
                    },
                  }}
                />
              }
            />
          </Box>
        </Tooltip>
      </Box>

      {/* Fila 1: Desempeño (75%) + Distribución Flota (25%) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' }, gap: 3, mb: 3 }}>

        {/* Gráfica Izquierda: Desempeño del Negocio - 75% */}
        <StyledSection
          title="Desempeño del Negocio"
          subtitle={isMobile ? undefined : "Ingresos y ocupación en el tiempo"}
          action={
            <Tabs
              value={periodTab}
              onChange={(_e, v: number) => setPeriodTab(v)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
              sx={{ minHeight: 36 }}
            >
              <Tab label="Hoy" sx={{ minHeight: 36, py: 0.5, px: { xs: 1, sm: 2 }, fontSize: '0.75rem', minWidth: 'auto' }} />
              <Tab label="Semana" sx={{ minHeight: 36, py: 0.5, px: { xs: 1, sm: 2 }, fontSize: '0.75rem', minWidth: 'auto' }} />
              <Tab label="Mes" sx={{ minHeight: 36, py: 0.5, px: { xs: 1, sm: 2 }, fontSize: '0.75rem', minWidth: 'auto' }} />
              <Tab label="Año" sx={{ minHeight: 36, py: 0.5, px: { xs: 1, sm: 2 }, fontSize: '0.75rem', minWidth: 'auto' }} />
            </Tabs>
          }
        >
          <Box sx={{ height: { xs: 250, sm: 300, md: 400 } }}>
            <Line data={performanceChartData} options={chartOptions} />
          </Box>
        </StyledSection>

        {/* Gráfica Derecha: Distribución de Flota Compacta - 25% */}
        <StyledSection title="Distribución de Flota" subtitle={isMobile ? undefined : `${totalVehicles} vehículos totales`}>
          <Box sx={{ height: { xs: 280, sm: 350, md: 400 }, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              key={`fleet-distribution-${isDarkMode ? 'dark' : 'light'}`}
              data={fleetDistributionData}
              options={{
                ...doughnutOptions,
                plugins: {
                  ...doughnutOptions.plugins,
                  legend: {
                    display: true,
                    position: 'right' as const,
                    labels: {
                      color: isDarkMode ? '#ffffff' : '#1f2937',
                      padding: 20,
                      font: {
                        size: 13,
                        family: 'Poppins',
                        weight: 500
                      },
                      usePointStyle: true,
                      pointStyle: 'circle',
                      boxWidth: 10,
                      boxHeight: 10,
                      generateLabels: (chart: any) => {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                          return data.labels.map((label: string, i: number) => {
                            const value = data.datasets[0].data[i];
                            const percentage = ((value / totalVehicles) * 100).toFixed(1);
                            return {
                              text: `${label}: ${value} (${percentage}%)`,
                              fillStyle: data.datasets[0].backgroundColor[i],
                              fontColor: isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
                              hidden: false,
                              index: i,
                              pointStyle: 'circle'
                            };
                          });
                        }
                        return [];
                      }
                    }
                  }
                }
              }}
                plugins={[{
                  id: 'centerText',
                  beforeDraw: (chart: any) => {
                    const { ctx, chartArea: { width, height } } = chart;
                    ctx.save();

                    const centerX = width / 2;
                    const centerY = height / 2;

                    // Total number
                    ctx.font = `700 2rem Poppins`;
                    ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(totalVehicles.toString(), centerX, centerY - 8);

                    // Label text
                    ctx.font = `500 0.75rem Poppins`;
                    ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.65)';
                    ctx.fillText('Vehículos', centerX, centerY + 18);

                    ctx.restore();
                  }
                }]}
              />
            </Box>
          </StyledSection>
      </Box>

      {/* Fila 2: Mapa (75%) + Panel de Mantenimiento (25%) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' }, gap: 3, mb: 3 }}>

        {/* Mapa de Inventario - 75% ancho */}
        <StyledSection
          title="Mapa de Inventario"
          subtitle={isMobile ? undefined : `${inventoryItems.length} artículos en tiempo real`}
        >
          {/* Mobile: Filtro y selector de item antes del mapa */}
          {isMobile && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.04)',
                    borderRadius: '12px',
                    minHeight: 48,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                    },
                  }}
                >
                  <MenuItem value="all">
                    <Typography variant="body2" fontWeight={600}>Todas las categorías</Typography>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: category.color }} />
                        <Typography variant="body2">{category.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <Select
                  value={selectedInventoryItem?.id || ''}
                  onChange={(e) => {
                    const item = filteredInventoryItems.find(i => i.id === e.target.value);
                    if (item) setSelectedInventoryItem(item);
                  }}
                  displayEmpty
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.04)',
                    borderRadius: '12px',
                    minHeight: 48,
                  }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">Seleccionar vehículo...</Typography>
                  </MenuItem>
                  {filteredInventoryItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      <Typography variant="body2">{item.name} - {item.currentLocationCity}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box sx={{
            height: showAllInventory ? 'auto' : { xs: 300, sm: 400, md: 500 },
            minHeight: { xs: 300, sm: 400, md: 500 },
            display: 'flex',
            gap: 2,
          }}>
            {/* Sidebar List - Hidden on mobile */}
            <Box
              sx={{
                width: 280,
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
              }}
            >
              {/* Filtro de categorías */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.04)',
                    borderRadius: '12px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#8b5cf6',
                    },
                  }}
                >
                  <MenuItem value="all">
                    <Typography variant="body2" fontWeight={600}>Todas las categorías</Typography>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: category.color,
                          }}
                        />
                        <Typography variant="body2">{category.name}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Lista de items */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  position: 'relative',
                }}
              >
              {(showAllInventory ? filteredInventoryItems : filteredInventoryItems.slice(0, VISIBLE_CARDS)).map((item) => {
                // Usar color por defecto si categoryColor no está definido
                const itemColor = item.categoryColor || '#8b5cf6';
                const itemIcon = item.categoryIcon || '🚗';
                return (
                <Paper
                  key={item.id}
                  onClick={() => handleInventoryItemClick(item)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderLeft: 4,
                    borderColor: itemColor,
                    background: selectedInventoryItem?.id === item.id
                      ? isDarkMode ? 'rgba(139, 92, 246, 0.15)' : alpha('#8b5cf6', 0.08)
                      : isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha(itemColor, 0.03),
                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      background: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : alpha('#8b5cf6', 0.06),
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        fontSize: '1.5rem',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        bgcolor: alpha(itemColor, 0.15),
                      }}
                    >
                      {itemIcon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {item.serialNumber}
                      </Typography>
                    </Box>
                    <Chip
                      label={
                        item.status === 'available' ? 'Disponible' :
                        item.status === 'rented' ? 'Rentado' :
                        item.status === 'maintenance' ? 'Mant.' :
                        item.status
                      }
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor:
                          item.status === 'available' ? alpha('#10b981', 0.15) :
                          item.status === 'rented' ? alpha('#f59e0b', 0.15) :
                          item.status === 'maintenance' ? alpha('#ef4444', 0.15) :
                          alpha('#6b7280', 0.15),
                        color:
                          item.status === 'available' ? '#10b981' :
                          item.status === 'rented' ? '#f59e0b' :
                          item.status === 'maintenance' ? '#ef4444' :
                          '#6b7280',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.7rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.currentLocationCity}, {item.currentLocationState}
                    </Typography>
                  </Box>
                  {item.currentCustomerName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.currentCustomerName}
                      </Typography>
                    </Box>
                  )}
                </Paper>
                );
              })}
              {/* Fade overlay cuando hay más items */}
              {!showAllInventory && filteredInventoryItems.length > VISIBLE_CARDS && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    background: isDarkMode
                      ? 'linear-gradient(to bottom, transparent, rgba(6, 11, 40, 0.95))'
                      : 'linear-gradient(to bottom, transparent, #ffffff)',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />
              )}
              </Box>

              {/* Botón Ver más / Ver menos para inventario */}
              {filteredInventoryItems.length > VISIBLE_CARDS && (
                <Box
                  component="button"
                  onClick={() => setShowAllInventory(!showAllInventory)}
                  sx={{
                    mt: 1,
                    py: 1,
                    px: 2,
                    width: '100%',
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                    bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                    color: isDarkMode ? '#a78bfa' : '#8b5cf6',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                      borderColor: isDarkMode ? '#a78bfa' : '#8b5cf6',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {showAllInventory
                    ? '▲ Ver menos'
                    : `▼ Ver más (${filteredInventoryItems.length - VISIBLE_CARDS} más)`
                  }
                </Box>
              )}
            </Box>

            {/* Map */}
            <Box sx={{ flex: 1 }}>
              <InventoryMap
                items={filteredInventoryItems}
                categories={categories}
                selectedItem={selectedInventoryItem}
                onItemClick={handleInventoryItemClick}
                onViewItemDetails={handleViewItemDetails}
              />
            </Box>
          </Box>
        </StyledSection>

        {/* Panel de Mantenimiento Próximo/Vencido - ACTUALIZADO con datos reales (Fase 2.3) */}
        <StyledSection
          title="Mantenimiento Próximo"
          subtitle="Equipos que requieren atención"
          action={
            <Chip
              label={`${maintenanceData?.overdue?.length || 0} Vencidos`}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: isDarkMode ? 'rgba(255, 82, 82, 0.2)' : 'rgba(220, 38, 38, 0.12)',
                color: isDarkMode ? '#ff8a80' : '#dc2626',
                border: `1px solid ${isDarkMode ? 'rgba(255, 82, 82, 0.4)' : 'rgba(220, 38, 38, 0.3)'}`,
              }}
            />
          }
        >
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {/* Mantenimiento Vencido */}
            <Box sx={{ mb: showAllMaintenance ? 3 : 0 }}>
              <Typography variant="body2" fontWeight={700} color="error.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon sx={{ fontSize: 18 }} />
                Mantenimiento Vencido
              </Typography>
              {maintenanceData?.overdue && maintenanceData.overdue.length > 0 ? (
                (showAllMaintenance
                  ? maintenanceData.overdue
                  : maintenanceData.overdue.slice(0, VISIBLE_CARDS)
                ).map((item: any) => (
                  <Paper
                    key={item.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      borderLeft: 4,
                      borderColor: '#ef4444',
                      background: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : alpha('#ef4444', 0.03),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {item.vehicleName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.licensePlate}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${item.daysOverdue} días vencido`}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: isDarkMode ? 'rgba(255, 82, 82, 0.2)' : 'rgba(220, 38, 38, 0.12)',
                          color: isDarkMode ? '#ff8a80' : '#dc2626',
                          border: `1px solid ${isDarkMode ? 'rgba(255, 82, 82, 0.4)' : 'rgba(220, 38, 38, 0.3)'}`,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Programado: {new Date(item.scheduledDate).toLocaleDateString('es-ES')}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No hay mantenimientos vencidos
                </Typography>
              )}
            </Box>

            {/* Fade overlay para overdue colapsado */}
            {!showAllMaintenance && maintenanceData?.overdue?.length > VISIBLE_CARDS && (
              <Box
                sx={{
                  height: 60,
                  mt: -6,
                  mb: 1,
                  background: isDarkMode
                    ? 'linear-gradient(to bottom, transparent, rgba(6, 11, 40, 0.95))'
                    : 'linear-gradient(to bottom, transparent, #ffffff)',
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Mantenimiento Próximo - Solo visible cuando está expandido */}
            {showAllMaintenance && (
              <Box>
                <Typography variant="body2" fontWeight={700} color="warning.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ fontSize: 18 }} />
                  Próximos 15 días
                </Typography>
                {maintenanceData?.upcoming && maintenanceData.upcoming.length > 0 ? (
                  maintenanceData.upcoming.map((item: any) => (
                    <Paper
                      key={item.id}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderLeft: 4,
                        borderColor: '#f59e0b',
                        background: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : alpha('#f59e0b', 0.03),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {item.vehicleName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.licensePlate}
                          </Typography>
                        </Box>
                        <Chip
                          label={`En ${item.daysUntil} días`}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: isDarkMode ? 'rgba(255, 181, 71, 0.2)' : 'rgba(180, 83, 9, 0.12)',
                            color: isDarkMode ? '#ffb547' : '#92400e',
                            border: `1px solid ${isDarkMode ? 'rgba(255, 181, 71, 0.4)' : 'rgba(180, 83, 9, 0.3)'}`,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Próximo mantenimiento: {new Date(item.scheduledDate).toLocaleDateString('es-ES')}
                      </Typography>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay mantenimientos próximos
                  </Typography>
                )}
              </Box>
            )}

            {/* Botón Ver más / Ver menos */}
            <Box
              component="button"
              onClick={() => setShowAllMaintenance(!showAllMaintenance)}
              sx={{
                mt: 2,
                py: 1.5,
                px: 2,
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                color: isDarkMode ? '#a78bfa' : '#8b5cf6',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                '&:hover': {
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                  borderColor: isDarkMode ? '#a78bfa' : '#8b5cf6',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              {showAllMaintenance ? '▲ Ver menos' : `▼ Ver más (${maintenanceData?.upcoming?.length || 0} programados)`}
            </Box>
          </Box>
        </StyledSection>
      </Box>

      {/* Fila 3: Cards de Resumen - 3 Columnas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: { xs: 2, sm: 3 } }}>

        {/* Recent Rentals - ACTUALIZADO con datos reales (Fase 2.3) */}
        <StyledSection title="Últimas Rentas">
          {isMobile ? (
            // Mobile Cards View
            <Stack spacing={1.5} sx={{ maxHeight: 280, overflowY: 'auto' }}>
              {recentRentals.length > 0 ? (
                recentRentals.map((rental) => (
                  <Box
                    key={rental.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha('#8b5cf6', 0.03),
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="600">RNT-{rental.id}</Typography>
                      <Typography variant="caption" color="text.secondary">{rental.customerName}</Typography>
                    </Box>
                    <Chip
                      label={rental.status === 'active' ? 'Activa' : 'Completada'}
                      size="small"
                      color={rental.status === 'active' ? 'success' : 'default'}
                    />
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No hay rentas recientes
                </Typography>
              )}
            </Stack>
          ) : (
            // Desktop Table View
            <TableContainer sx={{ maxHeight: 280 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Código</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRentals.length > 0 ? (
                    recentRentals.map((rental) => (
                      <TableRow key={rental.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            RNT-{rental.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                            {rental.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rental.vehicleName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={rental.status === 'active' ? 'Activa' : 'Completada'}
                            size="small"
                            color={rental.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No hay rentas recientes
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </StyledSection>

        {/* Top Customers - ACTUALIZADO con datos reales (Fase 2.3) */}
        <StyledSection title="Top 5 Clientes">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topCustomers.length > 0 ? (
              topCustomers.map((customer) => (
                <Box key={customer.id} sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha('#8b5cf6', 0.03)
                }}>
                  <Box>
                    <Typography variant="body2" fontWeight="600">
                      {customer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {customer.totalRentals} rentas
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>
                      {formatCompactCurrency(customer.totalRevenue)}
                    </Typography>
                    {customer.trend === 'up' ? (
                      <TrendingUpIcon sx={{ fontSize: 14, color: '#10b981' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                    )}
                  </Box>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No hay datos de clientes
              </Typography>
            )}
          </Box>
        </StyledSection>

        {/* Critical Alerts - ACTUALIZADO con datos reales (Fase 2.3) */}
        <StyledSection
          title="Alertas Críticas"
          action={<Chip label={alerts.filter((a: any) => a.severity === 'high' || a.severity === 'critical').length} color="error" size="small" />}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {alerts.length > 0 ? (
              alerts.map((alert: any) => {
                const alertColor =
                  alert.severity === 'critical' ? '#ef4444' :
                  alert.severity === 'high' ? '#f59e0b' :
                  alert.severity === 'medium' ? '#3b82f6' :
                  '#6b7280';

                const alertIcon =
                  alert.severity === 'critical' ? <ErrorIcon /> :
                  alert.severity === 'high' ? <WarningIcon /> :
                  <AssessmentIcon />;

                return (
                  <Box key={alert.id} sx={{
                    display: 'flex',
                    alignItems: 'start',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: isDarkMode ? alpha(alertColor, 0.1) : alpha(alertColor, 0.05),
                    border: `1px solid ${alpha(alertColor, 0.2)}`
                  }}>
                    <Box sx={{ color: alertColor, mt: 0.25 }}>
                      {React.cloneElement(alertIcon, { sx: { fontSize: 18 } })}
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {alert.message}
                    </Typography>
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No hay alertas críticas
              </Typography>
            )}
          </Box>
        </StyledSection>
      </Box>

      {/* Fila 4: Autos Ociosos - Movido al final */}
      <Box sx={{ mt: { xs: 2, sm: 3 } }}>
        <Paper sx={{
          p: { xs: 2, sm: 3 },
          background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : alpha('#ef4444', 0.05),
          borderRadius: 2,
          border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: '12px',
              bgcolor: alpha('#f59e0b', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <WarningIcon sx={{ color: '#f59e0b', fontSize: { xs: 20, sm: 24 } }} />
            </Box>
            <Box>
              <Typography variant="h3" sx={{ color: '#f59e0b', mb: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {data?.kpis?.vehicles?.available ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Autos Ociosos
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.78rem' }, fontWeight: 400, lineHeight: 1.5 }}>
            Vehículos disponibles sin rentar por más de 15 días
          </Typography>
        </Paper>
      </Box>

      {/* Modal de Imagen del Artículo de Inventario */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${border.default}`,
          pb: 2,
        }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {selectedItemForImage?.name || 'Detalle del Artículo'}
            </Typography>
            {selectedItemForImage && (
              <Typography variant="body2" color="text.secondary">
                {selectedItemForImage.categoryName} • {selectedItemForImage.serialNumber}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => setImageModalOpen(false)}
            sx={{
              bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
              },
            }}
          >
            <CloseIcon sx={{ color: '#ef4444' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedItemForImage?.images && selectedItemForImage.images.length > 0 ? (
            <Box
              component="img"
              src={selectedItemForImage.images[0]}
              alt={selectedItemForImage.name}
              sx={{
                width: '100%',
                maxHeight: '50vh',
                objectFit: 'contain',
                borderRadius: '12px',
                bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
              }}
            />
          ) : (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
              borderRadius: '12px',
              border: `1px dashed ${border.default}`,
            }}>
              <DirectionsCarIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Sin imagen disponible
              </Typography>
            </Box>
          )}

          {/* Información adicional del artículo */}
          {selectedItemForImage && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2,
              }}>
                <Box sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
                }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Estado
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: isDarkMode ? '#a78bfa' : '#8b5cf6' }}>
                    {selectedItemForImage.status === 'available' ? 'Disponible' :
                     selectedItemForImage.status === 'rented' ? 'Rentado' :
                     selectedItemForImage.status === 'maintenance' ? 'Mantenimiento' :
                     selectedItemForImage.status === 'sold' ? 'Vendido' : 'Retirado'}
                  </Typography>
                </Box>
                <Box sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Ubicación
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: isDarkMode ? '#34d399' : '#10b981' }}>
                    {selectedItemForImage.currentLocationCity}, {selectedItemForImage.currentLocationState}
                  </Typography>
                </Box>
                <Box sx={{
                  p: 2,
                  borderRadius: '12px',
                  bgcolor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
                  border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)'}`,
                }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Condición
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: isDarkMode ? '#fbbf24' : '#f59e0b' }}>
                    {selectedItemForImage.condition === 'excellent' ? 'Excelente' :
                     selectedItemForImage.condition === 'good' ? 'Bueno' :
                     selectedItemForImage.condition === 'fair' ? 'Regular' : 'Malo'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default Dashboard;
