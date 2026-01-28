import React, { useMemo } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface OccupancyData {
  available: number;
  rented: number;
  maintenance: number;
  reserved?: number;
}

interface OccupancyChartProps {
  data: OccupancyData;
  title?: string;
  chartType?: 'doughnut' | 'bar';
}

const OccupancyChart: React.FC<OccupancyChartProps> = ({
  data,
  title = 'Ocupación de Flota',
  chartType = 'doughnut'
}) => {
  const { isDarkMode } = useCustomTheme();

  // OPTIMIZADO: Memoizar cálculos de datos
  const { labels, values, colors, borderColors, total, occupancyRate } = useMemo(() => {
    const _labels = ['Disponibles', 'Rentados', 'Mantenimiento'];
    const _values = [data.available, data.rented, data.maintenance];
    const _colors = ['#10b981', '#3b82f6', '#f59e0b'];
    const _borderColors = ['#059669', '#2563eb', '#d97706'];

    if (data.reserved !== undefined) {
      _labels.push('Reservados');
      _values.push(data.reserved);
      _colors.push('#8b5cf6');
      _borderColors.push('#7c3aed');
    }

    const _total = _values.reduce((sum, val) => sum + val, 0);
    const _occupancyRate = _total > 0 ? ((data.rented / _total) * 100).toFixed(1) : '0';

    return {
      labels: _labels,
      values: _values,
      colors: _colors,
      borderColors: _borderColors,
      total: _total,
      occupancyRate: _occupancyRate
    };
  }, [data.available, data.rented, data.maintenance, data.reserved]);

  // OPTIMIZADO: Memoizar chartData
  const chartData = useMemo(() => ({
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: 2
    }]
  }), [labels, values, colors, borderColors]);

  // OPTIMIZADO: Memoizar doughnutOptions
  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#374151',
          usePointStyle: true,
          padding: 15,
          generateLabels: function(chart: any) {
            const chartData = chart.data;
            return chartData.labels.map((label: string, i: number) => ({
              text: `${label}: ${chartData.datasets[0].data[i]}`,
              fillStyle: chartData.datasets[0].backgroundColor[i],
              strokeStyle: chartData.datasets[0].borderColor[i],
              lineWidth: 2,
              pointStyle: 'circle',
              hidden: false,
              index: i
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        titleColor: isDarkMode ? '#fff' : '#1f2937',
        bodyColor: isDarkMode ? '#e5e7eb' : '#4b5563',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  }), [isDarkMode, total]);

  // OPTIMIZADO: Memoizar barOptions
  const barOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1f2937' : '#fff',
        titleColor: isDarkMode ? '#fff' : '#1f2937',
        bodyColor: isDarkMode ? '#e5e7eb' : '#4b5563',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280'
        }
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#6b7280'
        }
      }
    }
  }), [isDarkMode]);

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 600
            }}
          >
            {occupancyRate}% ocupado
          </Box>
        </Box>
        <Box sx={{ height: 280 }}>
          {chartType === 'doughnut' ? (
            <Doughnut data={chartData} options={doughnutOptions} />
          ) : (
            <Bar data={chartData} options={barOptions} />
          )}
        </Box>

        {/* Stats below chart */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>
                {data.available}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Disponibles
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#3b82f6' }}>
                {data.rented}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Rentados
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#f59e0b' }}>
                {data.maintenance}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mantenimiento
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold">
                {total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OccupancyChart;
