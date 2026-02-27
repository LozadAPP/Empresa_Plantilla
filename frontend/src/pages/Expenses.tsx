/**
 * Página de Listado de Gastos/Egresos
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoneyOff as ExpensesIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  Category as CategoryIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { FileDownload as ExportIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import TableSkeleton from '../components/common/TableSkeleton';
import EmptyState from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';
import { exportToCSV, EXPENSES_COLUMNS } from '../utils/exportCSV';
import { Expense, ExpenseStatus, ExpenseCategory, ExpenseFilters, ExpenseSummary } from '../types/expense';
import expenseService from '../services/expenseService';

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; color: string }> = {
  operacion: { label: 'Operación', color: '#3b82f6' },
  vehiculos: { label: 'Vehículos', color: '#8b5cf6' },
  financieros: { label: 'Financieros', color: '#f59e0b' },
  otros: { label: 'Otros', color: '#6b7280' }
};

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: 'default' | 'warning' | 'success' | 'error'; icon: React.ReactElement }> = {
  pending: { label: 'Pendiente', color: 'warning', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
  approved: { label: 'Aprobado', color: 'success', icon: <ApproveIcon sx={{ fontSize: 16 }} /> },
  rejected: { label: 'Rechazado', color: 'error', icon: <RejectIcon sx={{ fontSize: 16 }} /> },
  cancelled: { label: 'Cancelado', color: 'default', icon: <RejectIcon sx={{ fontSize: 16 }} /> }
};

const Expenses: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { selectedLocationId } = useLocationContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);

  // Dialogs
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ExpenseFilters = {
        page: page + 1,
        limit: rowsPerPage
      };
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter as ExpenseStatus;
      if (categoryFilter) filters.category = categoryFilter as ExpenseCategory;
      if (selectedLocationId) filters.location_id = selectedLocationId;

      const response = await expenseService.getAll(filters);
      if (response.success) {
        setExpenses(response.data);
        setTotalCount(response.pagination.total);
      }
    } catch {
      enqueueSnackbar('Error al cargar gastos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, categoryFilter, selectedLocationId, enqueueSnackbar]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await expenseService.getSummary();
      if (response.success) {
        setSummary(response.data);
      }
    } catch {
      // Summary is non-critical, fail silently
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handlers
  const handleApprove = async (expense: Expense) => {
    try {
      await expenseService.approve(expense.id);
      enqueueSnackbar(`Gasto ${expense.expense_code} aprobado`, { variant: 'success' });
      fetchExpenses();
      fetchSummary();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al aprobar gasto', { variant: 'error' });
    }
  };

  const handleReject = async () => {
    if (!selectedExpense || !rejectionReason.trim()) return;
    try {
      await expenseService.reject(selectedExpense.id, rejectionReason);
      enqueueSnackbar(`Gasto ${selectedExpense.expense_code} rechazado`, { variant: 'success' });
      fetchExpenses();
      fetchSummary();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al rechazar gasto', { variant: 'error' });
    }
    setRejectDialogOpen(false);
    setSelectedExpense(null);
    setRejectionReason('');
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      await expenseService.delete(selectedExpense.id);
      enqueueSnackbar(`Gasto ${selectedExpense.expense_code} eliminado`, { variant: 'success' });
      fetchExpenses();
      fetchSummary();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al eliminar gasto', { variant: 'error' });
    }
    setDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(0);
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      enqueueSnackbar('No hay datos para exportar', { variant: 'warning' });
      return;
    }
    exportToCSV(expenses, EXPENSES_COLUMNS, 'gastos');
    enqueueSnackbar('CSV exportado exitosamente', { variant: 'success' });
  };

  // Get top category from summary
  const topCategory = summary?.byCategory?.reduce<{ category: string; total: number } | null>(
    (max, item) => (!max || item.total > max.total) ? item : max, null
  );

  // Mobile card view
  const renderMobileCard = (expense: Expense) => {
    const statusCfg = STATUS_CONFIG[expense.status];
    const catCfg = CATEGORY_CONFIG[expense.category];
    return (
      <Card
        key={expense.id}
        sx={{
          mb: 1.5,
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          borderRadius: '12px'
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
              {expense.expense_code}
            </Typography>
            <Chip
              label={statusCfg.label}
              color={statusCfg.color}
              size="small"
              icon={statusCfg.icon}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" noWrap>
            {expense.description}
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
            <Chip
              label={catCfg.label}
              size="small"
              sx={{ bgcolor: catCfg.color + '22', color: catCfg.color, fontSize: '0.7rem', height: 22 }}
            />
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#ef4444' }}>
              {formatCurrency(expense.total_amount)}
            </Typography>
          </Stack>
          {expense.status === 'pending' && (
            <Stack direction="row" spacing={1} mt={1.5} justifyContent="flex-end">
              <Button size="small" color="success" variant="outlined" startIcon={<ApproveIcon />}
                onClick={() => handleApprove(expense)} sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}>
                Aprobar
              </Button>
              <Button size="small" color="error" variant="outlined" startIcon={<RejectIcon />}
                onClick={() => { setSelectedExpense(expense); setRejectDialogOpen(true); }}
                sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}>
                Rechazar
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
            Gastos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalCount} gasto{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/expenses/new')}
            sx={{
              background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { background: 'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)' }
            }}
          >
            Nuevo Gasto
          </Button>
        </Box>
      </Box>

      {/* KPI Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(239,68,68,0.2)' : '#fecaca'}`
            }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ef444420' }}>
                <TrendingDownIcon sx={{ color: '#ef4444', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Gastos del Mes</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#ef4444' }}>
                  {formatCurrency(summary.monthTotal)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(139,92,246,0.2)' : '#ddd6fe'}`
            }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#8b5cf620' }}>
                <CalendarIcon sx={{ color: '#8b5cf6', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Gastos del Año</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#8b5cf6' }}>
                  {formatCurrency(summary.yearTotal)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(245,158,11,0.2)' : '#fed7aa'}`
            }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#f59e0b20' }}>
                <PendingIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Pendientes ({summary.pendingCount})</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#f59e0b' }}>
                  {formatCurrency(summary.pendingTotal)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 2, borderRadius: '16px', display: 'flex', alignItems: 'center', gap: 2,
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
              border: `1px solid ${isDarkMode ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`
            }}>
              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#3b82f620' }}>
                <CategoryIcon sx={{ color: '#3b82f6', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Top Categoría</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#3b82f6' }}>
                  {topCategory ? CATEGORY_CONFIG[topCategory.category as ExpenseCategory]?.label || topCategory.category : 'N/A'}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper
        sx={{
          p: 2, mb: 3, borderRadius: '16px',
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por código, descripción, proveedor..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              label="Categoría"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">Todas</MenuItem>
              <MenuItem value="operacion">Operación</MenuItem>
              <MenuItem value="vehiculos">Vehículos</MenuItem>
              <MenuItem value="financieros">Financieros</MenuItem>
              <MenuItem value="otros">Otros</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="approved">Aprobado</MenuItem>
              <MenuItem value="rejected">Rechazado</MenuItem>
              <MenuItem value="cancelled">Cancelado</MenuItem>
            </Select>
          </FormControl>
          {(search || statusFilter || categoryFilter) && (
            <IconButton onClick={clearFilters} size="small" title="Limpiar filtros">
              <ClearIcon />
            </IconButton>
          )}
        </Stack>
      </Paper>

      {/* Content */}
      {loading ? (
        <TableSkeleton rows={5} columns={7} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<ExpensesIcon sx={{ fontSize: 48 }} />}
          title="No hay gastos"
          subtitle={search || statusFilter || categoryFilter
            ? 'No se encontraron gastos con los filtros aplicados'
            : 'Registra tu primer gasto para empezar'}
        />
      ) : isMobile ? (
        <Box>
          {expenses.map(renderMobileCard)}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            labelRowsPerPage="Por página"
          />
        </Box>
      ) : (
        <Paper
          sx={{
            borderRadius: '16px', overflow: 'hidden',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(239,68,68,0.08)' : '#fef2f2' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Categoría</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Proveedor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Monto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => {
                  const statusCfg = STATUS_CONFIG[expense.status];
                  const catCfg = CATEGORY_CONFIG[expense.category];
                  return (
                    <TableRow
                      key={expense.id}
                      hover
                      sx={{ '&:hover': { bgcolor: isDarkMode ? 'rgba(239,68,68,0.04)' : '#fff5f5' } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#ef4444' }}>
                          {expense.expense_code}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(expense.expense_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={catCfg.label}
                          size="small"
                          sx={{ bgcolor: catCfg.color + '22', color: catCfg.color, fontSize: '0.75rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {expense.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {expense.supplier_name || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(expense.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusCfg.label}
                          color={statusCfg.color}
                          size="small"
                          icon={statusCfg.icon}
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {expense.status === 'pending' && (
                            <>
                              <Tooltip title="Aprobar">
                                <IconButton size="small" sx={{ color: '#10b981' }}
                                  onClick={() => handleApprove(expense)}>
                                  <ApproveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rechazar">
                                <IconButton size="small" sx={{ color: '#ef4444' }}
                                  onClick={() => { setSelectedExpense(expense); setRejectDialogOpen(true); }}>
                                  <RejectIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {expense.status === 'pending' && (
                            <Tooltip title="Editar">
                              <IconButton size="small" onClick={() => navigate(`/expenses/${expense.id}/edit`)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {expense.status === 'pending' && (
                            <Tooltip title="Eliminar">
                              <IconButton size="small" sx={{ color: '#ef4444' }}
                                onClick={() => { setSelectedExpense(expense); setDeleteDialogOpen(true); }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {expense.status !== 'pending' && (
                            <Tooltip title="Ver detalle">
                              <IconButton size="small" onClick={() => navigate(`/expenses/${expense.id}/edit`)}>
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            labelRowsPerPage="Por página"
          />
        </Paper>
      )}

      {/* Reject dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => { setRejectDialogOpen(false); setRejectionReason(''); }} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar gasto</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Indique la razón del rechazo para el gasto {selectedExpense?.expense_code}.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Razón del rechazo"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRejectDialogOpen(false); setRejectionReason(''); }}>Cancelar</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={!rejectionReason.trim()}>
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Eliminar gasto</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el gasto {selectedExpense?.expense_code}? Esta acción eliminará también la transacción contable vinculada.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Expenses;
