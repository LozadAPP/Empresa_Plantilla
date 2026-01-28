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
  Alert
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

const AuditLog: React.FC = () => {
  const { isDarkMode } = useCustomTheme();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
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

  const handleExport = () => {
    // TODO: Implement export functionality
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
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" sx={{ fontSize: '2rem', letterSpacing: '-0.02em', mb: 0.5 }}>
            Auditoría
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
            Registro de todas las acciones realizadas en el sistema
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Exportar Logs
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de Acciones
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {totalActions}
                  </Typography>
                </Box>
                <HistoryIcon sx={{ fontSize: 40, color: '#8b5cf6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Hoy
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#3b82f6' }}>
                    {todayActions}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 40, color: '#3b82f6', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Creaciones
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                    {createActions}
                  </Typography>
                </Box>
                <CreateIcon sx={{ fontSize: 40, color: '#10b981', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Modificaciones
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b' }}>
                    {updateActions}
                  </Typography>
                </Box>
                <EditIcon sx={{ fontSize: 40, color: '#f59e0b', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{
        mb: 3,
        p: 3,
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterIcon />
          <Typography variant="h6" fontWeight={600}>
            Filtros
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por usuario, entidad o acción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
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
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
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
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Audit Logs Table */}
      <TableContainer component={Paper} sx={{
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}>
        <Table>
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
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  Valores Anteriores
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : alpha('#ef4444', 0.05) }}>
                                  <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(log.oldValues, null, 2)}
                                  </pre>
                                </Paper>
                              </Grid>
                            )}
                            {log.newValues && (
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  Valores Nuevos
                                </Typography>
                                <Paper sx={{ p: 2, bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : alpha('#10b981', 0.05) }}>
                                  <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(log.newValues, null, 2)}
                                  </pre>
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
