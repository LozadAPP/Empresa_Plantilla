import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Tabs,
  Tab,
  alpha,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import reportService from '../services/reportService';
import { locationService } from '../services/locationService';
import {
  DashboardSummary,
  IncomeReport,
  ProfitabilityReport,
  TopCustomer,
  ReportFilters
} from '../types/reports';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Reports: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incomeReport, setIncomeReport] = useState<IncomeReport | null>(null);
  const [profitabilityReport, setProfitabilityReport] = useState<ProfitabilityReport | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    groupBy: 'month',
    limit: 10
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [summaryRes, locationsRes] = await Promise.all([
        reportService.getDashboardSummary(),
        locationService.getLocationsDropdown()
      ]);

      setSummary(summaryRes.data);
      setLocations(locationsRes.data);

      // Load reports with initial filters
      await loadReports();
    } catch (error) {
      // Error loading initial data silently handled
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const [incomeRes, profitRes, customersRes] = await Promise.all([
        reportService.getIncomeReport(filters),
        reportService.getProfitabilityReport(filters),
        reportService.getTopCustomers(filters)
      ]);

      setIncomeReport(incomeRes.data);
      setProfitabilityReport(profitRes.data);
      setTopCustomers(customersRes.data);
    } catch (error) {
      // Error loading reports silently handled
    }
  };

  const handleApplyFilters = async () => {
    await loadReports();
    setShowFilters(false);
  };

  const handleExport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Income Report Sheet
      if (incomeReport) {
        const incomeData = [
          ['REPORTE DE INGRESOS'],
          [],
          ['Período', 'Total Ingresos', 'Cantidad de Rentas'],
          ...incomeReport.grouped.map(item => [
            item.period,
            item.totalIncome,
            item.rentalCount
          ]),
          [],
          ['RESUMEN'],
          ['Total de Ingresos', incomeReport.summary.totalIncome],
          ['Total de Rentas', incomeReport.summary.totalRentals],
          ['Promedio por Renta', incomeReport.summary.averageIncome]
        ];
        const wsIncome = XLSX.utils.aoa_to_sheet(incomeData);
        XLSX.utils.book_append_sheet(wb, wsIncome, 'Ingresos');
      }

      // Profitability Report Sheet
      if (profitabilityReport) {
        const profitData = [
          ['REPORTE DE RENTABILIDAD'],
          [],
          ['Concepto', 'Monto'],
          ['Ingresos Totales', profitabilityReport.summary.totalRevenue],
          ['Gastos de Mantenimiento', profitabilityReport.summary.totalMaintenanceCost],
          ['Otros Gastos', profitabilityReport.summary.totalExpenses],
          ['Costos Totales', profitabilityReport.summary.totalCosts],
          ['Ganancia Neta', profitabilityReport.summary.netProfit],
          ['Margen de Ganancia', profitabilityReport.summary.profitMargin + '%']
        ];
        const wsProfit = XLSX.utils.aoa_to_sheet(profitData);
        XLSX.utils.book_append_sheet(wb, wsProfit, 'Rentabilidad');
      }

      // Top Customers Sheet
      if (topCustomers.length > 0) {
        const customersData = [
          ['TOP CLIENTES'],
          [],
          ['Cliente', 'Email', 'Teléfono', 'Rentas', 'Ingresos Totales'],
          ...topCustomers.map(c => [
            c.customer?.name || '',
            c.customer?.email || '',
            c.customer?.phone || '',
            c.rentalCount,
            c.totalRevenue
          ])
        ];
        const wsCustomers = XLSX.utils.aoa_to_sheet(customersData);
        XLSX.utils.book_append_sheet(wb, wsCustomers, 'Top Clientes');
      }

      // Generate file
      const fileName = `MOVICAR_Reportes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      alert('Error al exportar reportes');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Prepare chart data from real API data
  const incomeChartData = {
    labels: incomeReport?.grouped.map(item => item.period) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: incomeReport?.grouped.map(item => item.totalIncome) || [],
        borderColor: '#8b5cf6',
        backgroundColor: alpha('#8b5cf6', 0.1),
        fill: true,
        tension: 0.4
      }
    ]
  };

  const occupancyChartData = {
    labels: ['Disponibles', 'Rentados', 'Mantenimiento'],
    datasets: [
      {
        data: [
          summary?.vehicles.available || 0,
          summary?.vehicles.rented || 0,
          summary?.vehicles.maintenance || 0
        ],
        backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: isDarkMode ? '#fff' : '#000'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: isDarkMode ? '#fff' : '#000'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          color: isDarkMode ? '#fff' : '#000'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Today's income for display
  const todayIncome = summary?.today.income || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Reportes
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Análisis y estadísticas del negocio
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{
              bgcolor: isDarkMode ? '#8b5cf6' : '#8b5cf6',
              color: '#fff',
              '&:hover': {
                bgcolor: isDarkMode ? '#7c3aed' : '#7c3aed'
              }
            }}
          >
            Exportar Excel
          </Button>
        </Box>
      </Box>

      {/* Filters Panel */}
      {showFilters && (
        <Card sx={{
          mb: 4,
          p: 3,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}>
          <Typography variant="h6" gutterBottom>
            Filtros de Reportes
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fecha Inicio"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Fecha Fin"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ubicación</InputLabel>
                <Select
                  value={filters.locationId || ''}
                  onChange={(e) => setFilters({ ...filters, locationId: e.target.value ? Number(e.target.value) : undefined })}
                  label="Ubicación"
                >
                  <MenuItem value="">Todas las ubicaciones</MenuItem>
                  {locations.map(loc => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Agrupar por</InputLabel>
                <Select
                  value={filters.groupBy || 'month'}
                  onChange={(e) => setFilters({ ...filters, groupBy: e.target.value as any })}
                  label="Agrupar por"
                >
                  <MenuItem value="day">Día</MenuItem>
                  <MenuItem value="week">Semana</MenuItem>
                  <MenuItem value="month">Mes</MenuItem>
                  <MenuItem value="year">Año</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setShowFilters(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleApplyFilters}
                  sx={{
                    bgcolor: '#8b5cf6',
                    '&:hover': { bgcolor: '#7c3aed' }
                  }}
                >
                  Aplicar Filtros
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
              <MoneyIcon sx={{ fontSize: 80, color: '#10b981' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Ingresos Hoy
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
              ${summary?.today.income.toLocaleString() || 0}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
              <Typography variant="caption" sx={{ color: '#10b981' }}>
                {todayIncome > 0 ? `$${todayIncome.toLocaleString()}` : 'Sin datos previos'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
              <CarIcon sx={{ fontSize: 80, color: '#8b5cf6' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Ocupación
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#8b5cf6' }}>
              {((summary?.vehicles.rented || 0) / (summary?.vehicles.total || 1) * 100).toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary?.vehicles.rented || 0} de {summary?.vehicles.total || 0} vehículos
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
              <AssessmentIcon sx={{ fontSize: 80, color: '#3b82f6' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Rentas Activas
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6' }}>
              {summary?.rentals.active || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary?.today.rentals || 0} nuevas hoy
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
              borderRadius: 2,
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
              <PeopleIcon sx={{ fontSize: 80, color: '#f59e0b' }} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Alertas Críticas
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444' }}>
              {summary?.alerts.critical || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Requieren atención
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper
        sx={{
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          borderRadius: 2,
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Ingresos" />
          <Tab label="Ocupación" />
          <Tab label="Rentabilidad" />
          <Tab label="Top Clientes" />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Ingresos - {filters.groupBy === 'day' ? 'Diarios' : filters.groupBy === 'week' ? 'Semanales' : filters.groupBy === 'month' ? 'Mensuales' : 'Anuales'}
            </Typography>
            {incomeReport && incomeReport.grouped.length > 0 ? (
              <Line data={incomeChartData} options={chartOptions} />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">
                  No hay datos de ingresos para el período seleccionado
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 400 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Distribución de Flota
                </Typography>
                <Doughnut data={occupancyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Estadísticas de Ocupación
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Total Vehículos', value: summary?.vehicles.total || 0, color: '#8b5cf6' },
                  { label: 'Disponibles', value: summary?.vehicles.available || 0, color: '#10b981' },
                  { label: 'Rentados', value: summary?.vehicles.rented || 0, color: '#3b82f6' },
                  { label: 'En Mantenimiento', value: summary?.vehicles.maintenance || 0, color: '#f59e0b' }
                ].map((stat) => (
                  <Box
                    key={stat.label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 1
                    }}
                  >
                    <Typography>{stat.label}</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: stat.color }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Análisis de Rentabilidad
            </Typography>
            {profitabilityReport ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : alpha('#10b981', 0.1) }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Ingresos Totales
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                        ${profitabilityReport.summary.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#10b981' }}>
                        {profitabilityReport.breakdown.rentals} rentas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : alpha('#ef4444', 0.1) }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Costos Totales
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444' }}>
                        ${profitabilityReport.summary.totalCosts.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ef4444' }}>
                        Mantenimiento: ${profitabilityReport.summary.totalMaintenanceCost.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1) }}>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        Ganancia Neta
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#8b5cf6' }}>
                        ${profitabilityReport.summary.netProfit.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b5cf6' }}>
                        {profitabilityReport.summary.profitMargin}% margen
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center">
                No hay datos de rentabilidad para el período seleccionado
              </Typography>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Top {filters.limit || 10} Clientes
            </Typography>
            {topCustomers && topCustomers.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {topCustomers.map((customer, index) => (
                  <Paper
                    key={customer.customerId}
                    sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <Box>
                      <Typography fontWeight="600">
                        #{index + 1} - {customer.customer?.name || `Cliente ID: ${customer.customerId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.rentalCount} rentas • {customer.customer?.email || ''}
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#10b981' }}>
                      ${customer.totalRevenue.toLocaleString()}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" align="center">
                No hay datos de clientes para el período seleccionado
              </Typography>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports;
