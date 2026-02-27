/**
 * Vista de detalle de Proveedor
 * Muestra información completa, KPIs, historial de gastos y mantenimientos vinculados
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Rating,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Business as SuppliersIcon,
  AttachMoney as MoneyIcon,
  Build as MaintenanceIcon,
  Star as StarIcon,
  MoneyOff as ExpenseIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Handshake as ServicesIcon,
  Inventory as ProductsIcon,
  SwapHoriz as BothIcon,
  AccountBalance as BankIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { Supplier } from '../types/supplier';
import { Expense } from '../types/expense';
import { supplierService } from '../services/supplierService';
import { expenseService } from '../services/expenseService';

// ========== Status / Type configs ==========
const expenseStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b' },
  approved: { label: 'Aprobado', color: '#10b981' },
  rejected: { label: 'Rechazado', color: '#ef4444' },
  cancelled: { label: 'Cancelado', color: '#9ca3af' },
};

const expenseCategoryConfig: Record<string, { label: string; color: string }> = {
  operacion: { label: 'Operación', color: '#3b82f6' },
  vehiculos: { label: 'Vehículos', color: '#8b5cf6' },
  financieros: { label: 'Financieros', color: '#f59e0b' },
  otros: { label: 'Otros', color: '#6b7280' },
};

const supplierTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  services: { label: 'Servicios', icon: <ServicesIcon sx={{ fontSize: 18 }} />, color: '#3b82f6' },
  products: { label: 'Productos', icon: <ProductsIcon sx={{ fontSize: 18 }} />, color: '#f59e0b' },
  both: { label: 'Ambos', icon: <BothIcon sx={{ fontSize: 18 }} />, color: '#10b981' },
};

const SupplierDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { enqueueSnackbar } = useSnackbar();
  const { hasAnyRole } = useAuth();

  // Supplier data
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensePage, setExpensePage] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  const paperSx = {
    p: 3,
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: 2,
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  };

  const loadSupplier = async () => {
    try {
      const response = await supplierService.getById(Number(id));
      if (response.success && response.data) {
        setSupplier(response.data);
      }
    } catch {
      enqueueSnackbar('Error al cargar proveedor', { variant: 'error' });
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async (page: number = 0) => {
    setExpensesLoading(true);
    try {
      const response = await expenseService.getAll({
        search: supplier?.name,
        page: page + 1,
        limit: 10,
      });
      setExpenses(response.data || []);
      setExpenseTotal(response.pagination?.total || 0);
    } catch {
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  useEffect(() => {
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0) {
      navigate('/suppliers');
      return;
    }
    loadSupplier();
  }, [id]);

  // Load expenses once supplier is loaded (we need supplier name for filtering)
  useEffect(() => {
    if (supplier) {
      loadExpenses(0);
    }
  }, [supplier]);

  const handleToggleActive = async () => {
    if (!supplier) return;
    setActionLoading(true);
    try {
      await supplierService.toggleActive(supplier.id);
      enqueueSnackbar(
        supplier.is_active ? 'Proveedor desactivado' : 'Proveedor activado',
        { variant: 'success' }
      );
      loadSupplier();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cambiar estado', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpensePageChange = (_: unknown, newPage: number) => {
    setExpensePage(newPage);
    loadExpenses(newPage);
  };

  // Loading state
  if (loading || !supplier) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const typeConfig = supplierTypeConfig[supplier.supplier_type] || supplierTypeConfig.services;

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{value || 'N/A'}</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>

      {/* ========== HEADER ========== */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/suppliers')}
            variant="outlined"
            size="small"
            sx={{ borderRadius: '12px', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
          >
            Volver
          </Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {supplier.name}
              </Typography>
              <Chip
                icon={typeConfig.icon as React.ReactElement}
                label={typeConfig.label}
                size="small"
                sx={{ fontWeight: 600, bgcolor: `${typeConfig.color}22`, color: typeConfig.color }}
              />
              <Chip
                label={supplier.is_active ? 'Activo' : 'Inactivo'}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: supplier.is_active
                    ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                    : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                  color: supplier.is_active ? '#10b981' : '#ef4444',
                }}
              />
            </Box>
            {supplier.supplier_code && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {supplier.supplier_code}
                {supplier.rfc ? ` · RFC: ${supplier.rfc}` : ''}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {hasAnyRole('director_general', 'jefe_finanzas', 'jefe_admin') && (
            <Button
              startIcon={supplier.is_active ? <ToggleOffIcon /> : <ToggleOnIcon />}
              variant="outlined"
              size="small"
              disabled={actionLoading}
              onClick={handleToggleActive}
              sx={{
                borderRadius: '12px',
                borderColor: supplier.is_active ? '#f59e0b' : '#10b981',
                color: supplier.is_active ? '#f59e0b' : '#10b981',
              }}
            >
              {supplier.is_active ? 'Desactivar' : 'Activar'}
            </Button>
          )}
          {hasAnyRole('director_general', 'jefe_finanzas', 'jefe_admin', 'jefe_inventarios') && (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
              sx={{ borderRadius: '12px' }}
            >
              Editar
            </Button>
          )}
        </Box>
      </Box>

      {/* ========== KPI CARDS ========== */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Gastado', value: formatCurrency(supplier.total_spent || 0), color: '#ef4444', icon: <MoneyIcon /> },
          { label: 'Gastos Vinculados', value: supplier.expenses_count ?? 0, color: '#3b82f6', icon: <ExpenseIcon /> },
          { label: 'Mantenimientos', value: supplier.maintenance_count ?? 0, color: '#f59e0b', icon: <MaintenanceIcon /> },
          {
            label: 'Calificación',
            value: supplier.rating ? (
              <Rating value={supplier.rating} readOnly size="small" />
            ) : 'Sin calificar',
            color: '#fbbf24',
            icon: <StarIcon />,
          },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <Paper sx={{
              ...paperSx,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '12px',
                bgcolor: isDarkMode ? `${kpi.color}22` : `${kpi.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {React.cloneElement(kpi.icon, { sx: { color: kpi.color, fontSize: 22 } })}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ========== SUPPLIER INFO ========== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Contact Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon sx={{ fontSize: 20, color: '#8b5cf6' }} /> Contacto
            </Typography>
            <InfoRow label="Persona de Contacto" value={supplier.contact_person} />
            <InfoRow label="Email" value={
              supplier.email ? (
                <Typography component="a" href={`mailto:${supplier.email}`} variant="body2"
                  sx={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  {supplier.email}
                </Typography>
              ) : 'N/A'
            } />
            <InfoRow label="Teléfono" value={supplier.phone} />
            <InfoRow label="Categoría" value={supplier.category} />
          </Paper>
        </Grid>

        {/* Address */}
        <Grid item xs={12} md={4}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon sx={{ fontSize: 20, color: '#10b981' }} /> Dirección
            </Typography>
            <InfoRow label="Dirección" value={supplier.address} />
            <InfoRow label="Ciudad" value={supplier.city} />
            <InfoRow label="Estado" value={supplier.state} />
            <InfoRow label="País" value={supplier.country} />
            <InfoRow label="C.P." value={supplier.zip_code} />
          </Paper>
        </Grid>

        {/* Banking & Commercial */}
        <Grid item xs={12} md={4}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BankIcon sx={{ fontSize: 20, color: '#f59e0b' }} /> Datos Bancarios y Comerciales
            </Typography>
            <InfoRow label="Banco" value={supplier.bank_name} />
            <InfoRow label="Cuenta" value={supplier.bank_account} />
            <InfoRow label="CLABE" value={supplier.clabe} />
            <InfoRow label="Días de Crédito" value={supplier.payment_terms ? `${supplier.payment_terms} días` : 'N/A'} />
            <InfoRow label="Límite de Crédito" value={supplier.credit_limit ? formatCurrency(supplier.credit_limit) : 'N/A'} />
          </Paper>
        </Grid>
      </Grid>

      {/* ========== NOTES ========== */}
      {supplier.notes && (
        <Paper sx={{ ...paperSx, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Notas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {supplier.notes}
          </Typography>
        </Paper>
      )}

      {/* ========== EXPENSES TABLE ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExpenseIcon sx={{ fontSize: 20, color: '#ef4444' }} /> Gastos Vinculados ({expenseTotal})
        </Typography>
        {expensesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : expenses.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Este proveedor no tiene gastos registrados
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Categoría</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((expense) => {
                    const statusCfg = expenseStatusConfig[expense.status] || { label: expense.status, color: '#6b7280' };
                    const catCfg = expenseCategoryConfig[expense.category] || { label: expense.category, color: '#6b7280' };
                    return (
                      <TableRow
                        key={expense.id}
                        hover
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.04)' } }}
                        onClick={() => navigate(`/expenses/${expense.id}/edit`)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{expense.expense_code}</TableCell>
                        <TableCell>{formatDate(expense.expense_date)}</TableCell>
                        <TableCell>
                          <Chip label={catCfg.label} size="small" sx={{ bgcolor: `${catCfg.color}22`, color: catCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Chip label={statusCfg.label} size="small" sx={{ bgcolor: `${statusCfg.color}22`, color: statusCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(expense.total_amount || 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={expenseTotal}
              page={expensePage}
              onPageChange={handleExpensePageChange}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      {/* ========== META INFO ========== */}
      <Paper sx={paperSx}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">Creado por</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {supplier.creator ? `${supplier.creator.firstName} ${supplier.creator.lastName}` : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">Fecha de Creación</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(supplier.created_at)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">Última Actualización</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatDate(supplier.updated_at)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default SupplierDetail;
