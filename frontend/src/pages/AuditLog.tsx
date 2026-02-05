import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
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
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  alpha,
  Pagination,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Create as CreateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Event as EventIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { auditService, AuditLogEntry, AuditStats } from '../services/auditService';
import { exportToCSV, formatDateForCSV } from '../utils/exportCSV';

// Columnas para exportación CSV
const AUDIT_LOG_COLUMNS = [
  { key: 'createdAt', label: 'Fecha y Hora', formatter: formatDateForCSV },
  { key: 'userName', label: 'Usuario' },
  { key: 'action', label: 'Accion' },
  { key: 'entityType', label: 'Entidad' },
  { key: 'entityId', label: 'ID Entidad' },
  { key: 'ipAddress', label: 'Direccion IP' },
];

const AuditLog: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const theme = useTheme();

  // RESPONSIVE: Media queries
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, entityFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await auditService.getAuditStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading audit stats:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditService.getAuditLogs({
        search: searchTerm || undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        entityType: entityFilter !== 'all' ? entityFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 20
      });

      if (response.success && response.data) {
        setLogs(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los registros de auditoría',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const icons: any = {
      CREATE: <CreateIcon fontSize="small" sx={{ color: '#10b981' }} />,
      UPDATE: <EditIcon fontSize="small" sx={{ color: '#3b82f6' }} />,
      DELETE: <DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} />,
      VIEW: <ViewIcon fontSize="small" sx={{ color: '#8b5cf6' }} />
    };
    return icons[action] || icons.VIEW;
  };

  const getActionChip = (action: string) => {
    const configs: any = {
      CREATE: { label: 'Crear', color: '#10b981' },
      UPDATE: { label: 'Actualizar', color: '#3b82f6' },
      DELETE: { label: 'Eliminar', color: '#ef4444' },
      VIEW: { label: 'Ver', color: '#8b5cf6' }
    };
    const config = configs[action] || configs.VIEW;

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: alpha(config.color, 0.1),
          color: config.color,
          border: 'none',
          fontWeight: 600
        }}
      />
    );
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: any = {
      rental: 'Renta',
      vehicle: 'Vehículo',
      customer: 'Cliente',
      payment: 'Pago',
      user: 'Usuario',
      invoice: 'Factura',
      maintenance: 'Mantenimiento',
      transaction: 'Transacción'
    };
    return labels[entityType] || entityType;
  };

  // Helper para formatear valores JSON de forma legible
  const formatJsonValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'number') return value.toLocaleString('es-MX');
    if (typeof value === 'string') {
      // Intentar parsear como fecha
      const dateMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        try {
          return format(new Date(value), "d MMM yyyy HH:mm", { locale: es });
        } catch { return value; }
      }
      return value;
    }
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Renderiza valores JSON como lista de key-value
  const renderJsonValues = (values: Record<string, any> | null) => {
    if (!values || typeof values !== 'object') return null;
    return Object.entries(values).map(([key, value]) => (
      <Box key={key} sx={{ display: 'flex', gap: 1, py: 0.5, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
        <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 100, color: 'text.secondary' }}>
          {key.replace(/_/g, ' ')}:
        </Typography>
        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {formatJsonValue(value)}
        </Typography>
      </Box>
    ));
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      setSnackbar({
        open: true,
        message: 'No hay registros para exportar',
        severity: 'error'
      });
      return;
    }

    try {
      exportToCSV(filteredLogs, AUDIT_LOG_COLUMNS, 'MOVICAR_Auditoria');
      setSnackbar({
        open: true,
        message: `Exportación completada: ${filteredLogs.length} registros`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      setSnackbar({
        open: true,
        message: 'Error al exportar los registros',
        severity: 'error'
      });
    }
  };

  // Client-side search filter (API already handles action and entity filters)
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return log.userName.toLowerCase().includes(searchLower) ||
           log.entityType.toLowerCase().includes(searchLower) ||
           log.action.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Use stats from API or fallback to local calculation
  const totalActions = stats?.total || logs.length;
  const todayActions = stats?.today || logs.filter(log =>
    new Date(log.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const createActions = stats?.byAction?.create || logs.filter(log => log.action === 'CREATE').length;
  const updateActions = stats?.byAction?.update || logs.filter(log => log.action === 'UPDATE').length;

  return (
    <Box>
      {/* Header - RESPONSIVE */}
      <Box sx={{
        mb: { xs: 3, sm: 4 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, letterSpacing: '-0.02em', mb: 0.5 }}>
            Auditoría
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Registro de acciones del sistema
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          fullWidth={isMobile}
          sx={{ minHeight: { xs: 48, sm: 40 } }}
        >
          Exportar
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {isMobile ? 'Total' : 'Total de Acciones'}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {totalActions}
                  </Typography>
                </Box>
                <HistoryIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#8b5cf6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    Hoy
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {todayActions}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#3b82f6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {isMobile ? 'Creados' : 'Creaciones'}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {createActions}
                  </Typography>
                </Box>
                <CreateIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#10b981', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    {isMobile ? 'Modific.' : 'Modificaciones'}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
                    {updateActions}
                  </Typography>
                </Box>
                <EditIcon sx={{ fontSize: { xs: 28, sm: 40 }, color: '#f59e0b', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters - RESPONSIVE */}
      <Card sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="h6" fontWeight={600}>
              Filtros
            </Typography>
          </Box>
          {isMobile && (
            <Button
              size="small"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              endIcon={<ExpandMoreIcon sx={{ transform: filtersExpanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
            >
              {filtersExpanded ? 'Menos' : 'Más'}
            </Button>
          )}
        </Box>

        {/* Búsqueda siempre visible */}
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: { xs: 1.5, sm: 2 },
            '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />

        {/* Filtros adicionales - colapsables en móvil */}
        <Collapse in={!isMobile || filtersExpanded}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, sm: 2 }
          }}>
            <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } } }}>
              <InputLabel>Acción</InputLabel>
              <Select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                label="Acción"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="CREATE">Crear</MenuItem>
                <MenuItem value="UPDATE">Actualizar</MenuItem>
                <MenuItem value="DELETE">Eliminar</MenuItem>
                <MenuItem value="VIEW">Ver</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } } }}>
              <InputLabel>Entidad</InputLabel>
              <Select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                label="Entidad"
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="rental">Rentas</MenuItem>
                <MenuItem value="vehicle">Vehículos</MenuItem>
                <MenuItem value="customer">Clientes</MenuItem>
                <MenuItem value="payment">Pagos</MenuItem>
                <MenuItem value="user">Usuarios</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              sx={{ '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } } }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              sx={{ '& .MuiInputBase-root': { minHeight: { xs: 48, sm: 40 } } }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Collapse>
      </Card>

      {/* RESPONSIVE: Cards en móvil, Tabla en desktop */}
      {isMobile ? (
        /* Vista de Cards para móvil */
        <Box>
          {filteredLogs.length === 0 ? (
            <Paper sx={{
              p: 4,
              textAlign: 'center',
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'
            }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No hay registros</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {filteredLogs.map((log) => (
                <Card
                  key={log.id}
                  sx={{
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header: Fecha + Acción */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight="700">
                          {format(new Date(log.createdAt), "d MMM yyyy", { locale: es })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(log.createdAt), "HH:mm:ss", { locale: es })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getActionIcon(log.action)}
                        {getActionChip(log.action)}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

                    {/* Info Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          Usuario
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <PersonIcon fontSize="small" sx={{ color: '#8b5cf6', fontSize: 16 }} />
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{log.userName}</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                          Entidad
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {getEntityTypeLabel(log.entityType)} #{log.entityId || '-'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Expandir detalles */}
                    {(log.oldValues || log.newValues) && (
                      <>
                        <Button
                          size="small"
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          endIcon={<ExpandMoreIcon sx={{ transform: expandedRow === log.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
                          sx={{ mt: 1.5, width: '100%' }}
                        >
                          {expandedRow === log.id ? 'Ocultar' : 'Ver cambios'}
                        </Button>
                        <Collapse in={expandedRow === log.id}>
                          <Box sx={{ mt: 1.5 }}>
                            {log.oldValues && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" fontWeight={600} sx={{ color: '#ef4444' }}>Anterior:</Typography>
                                <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : alpha('#ef4444', 0.05) }}>
                                  {renderJsonValues(log.oldValues)}
                                </Paper>
                              </Box>
                            )}
                            {log.newValues && (
                              <Box>
                                <Typography variant="caption" fontWeight={600} sx={{ color: '#10b981' }}>Nuevo:</Typography>
                                <Paper sx={{ p: 1.5, mt: 0.5, bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : alpha('#10b981', 0.05) }}>
                                  {renderJsonValues(log.newValues)}
                                </Paper>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        /* Vista de Tabla para desktop */
        <TableContainer component={Paper} sx={{
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          overflowX: 'auto'
        }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : alpha('#8b5cf6', 0.1) }}>
                <TableCell sx={{ fontWeight: 700 }}>Fecha y Hora</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entidad</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Detalles</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron registros de auditoría
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(log.createdAt), "d MMM yyyy", { locale: es })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(log.createdAt), "HH:mm:ss", { locale: es })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon fontSize="small" sx={{ color: '#8b5cf6' }} />
                          <Typography variant="body2">{log.userName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getActionIcon(log.action)}
                          {getActionChip(log.action)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getEntityTypeLabel(log.entityType)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          #{log.entityId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          endIcon={<ExpandMoreIcon sx={{ transform: expandedRow === log.id ? 'rotate(180deg)' : 'none' }} />}
                        >
                          {expandedRow === log.id ? 'Ocultar' : 'Ver'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ bgcolor: isDarkMode ? 'rgba(139, 92, 246, 0.05)' : alpha('#8b5cf6', 0.05) }}>
                          <Box sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                              {log.oldValues && (
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#ef4444' }}>
                                    Valores Anteriores
                                  </Typography>
                                  <Paper sx={{ p: 2, bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : alpha('#ef4444', 0.05) }}>
                                    {renderJsonValues(log.oldValues)}
                                  </Paper>
                                </Grid>
                              )}
                              {log.newValues && (
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: '#10b981' }}>
                                    Valores Nuevos
                                  </Typography>
                                  <Paper sx={{ p: 2, bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : alpha('#10b981', 0.05) }}>
                                    {renderJsonValues(log.newValues)}
                                  </Paper>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

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

export default AuditLog;
