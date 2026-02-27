/**
 * Vista de detalle de Cliente
 * Muestra información completa, KPIs, historial de rentas, facturas y cotizaciones
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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalance as GovIcon,
  AttachMoney as MoneyIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CompletedIcon,
  PlayArrow as ActiveIcon,
  Receipt as ReceiptIcon,
  RequestQuote as QuoteIcon,
  Notes as NotesIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { Customer } from '../types';
import customerService from '../services/customerService';
import invoiceService from '../services/invoiceService';
import quoteService from '../services/quoteService';
import { DocumentPanel } from '../components/documents';

// ========== Status configs ==========
const rentalStatusConfig: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Pendiente', color: '#f59e0b' },
  reserved: { label: 'Reservada', color: '#3b82f6' },
  active: { label: 'Activa', color: '#10b981' },
  completed: { label: 'Completada', color: '#6b7280' },
  cancelled: { label: 'Cancelada', color: '#ef4444' },
  overdue: { label: 'Vencida', color: '#dc2626' },
};

const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: '#6b7280' },
  sent: { label: 'Enviada', color: '#3b82f6' },
  paid: { label: 'Pagada', color: '#10b981' },
  overdue: { label: 'Vencida', color: '#ef4444' },
  cancelled: { label: 'Cancelada', color: '#9ca3af' },
};

const quoteStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: '#6b7280' },
  sent: { label: 'Enviada', color: '#3b82f6' },
  accepted: { label: 'Aceptada', color: '#10b981' },
  rejected: { label: 'Rechazada', color: '#ef4444' },
  expired: { label: 'Expirada', color: '#f59e0b' },
  converted: { label: 'Convertida', color: '#8b5cf6' },
};

const customerTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  individual: { label: 'Individual', icon: <PersonIcon sx={{ fontSize: 18 }} /> },
  corporate: { label: 'Empresarial', icon: <BusinessIcon sx={{ fontSize: 18 }} /> },
  government: { label: 'Gobierno', icon: <GovIcon sx={{ fontSize: 18 }} /> },
};

const CustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { enqueueSnackbar } = useSnackbar();
  const { hasAnyRole } = useAuth();

  // Customer data
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Rentals
  const [rentals, setRentals] = useState<any[]>([]);
  const [rentalSummary, setRentalSummary] = useState<any>(null);
  const [rentalPage, setRentalPage] = useState(0);
  const [rentalTotal, setRentalTotal] = useState(0);
  const [rentalsLoading, setRentalsLoading] = useState(true);

  // Invoices & Quotes
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);

  const paperSx = {
    p: 3,
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: 2,
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  };

  const loadCustomer = async () => {
    try {
      const response = await customerService.getById(Number(id));
      if (response.success && response.data) {
        setCustomer(response.data);
      }
    } catch {
      enqueueSnackbar('Error al cargar cliente', { variant: 'error' });
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const loadRentals = async (page: number = 0) => {
    setRentalsLoading(true);
    try {
      const response = await customerService.getRentals(Number(id), page + 1, 10);
      if (response.success) {
        setRentals(response.data || []);
        setRentalSummary(response.summary || null);
        setRentalTotal(response.pagination?.total || 0);
      }
    } catch {
      setRentals([]);
      enqueueSnackbar('Error al cargar historial de rentas', { variant: 'warning' });
    } finally {
      setRentalsLoading(false);
    }
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const response = await invoiceService.getByCustomer(Number(id));
      setInvoices(response.data?.invoices || []);
    } catch {
      setInvoices([]);
      enqueueSnackbar('Error al cargar facturas', { variant: 'warning' });
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadQuotes = async () => {
    setQuotesLoading(true);
    try {
      const response = await quoteService.getAll({ customer_id: Number(id) });
      setQuotes(response.data?.quotes || []);
    } catch {
      setQuotes([]);
      enqueueSnackbar('Error al cargar cotizaciones', { variant: 'warning' });
    } finally {
      setQuotesLoading(false);
    }
  };

  useEffect(() => {
    const numId = Number(id);
    if (!id || isNaN(numId) || numId <= 0) {
      navigate('/customers');
      return;
    }
    loadCustomer();
    loadRentals(0);
    loadInvoices();
    loadQuotes();
  }, [id]);

  const handleToggleActive = async () => {
    if (!customer) return;
    setActionLoading(true);
    try {
      await customerService.toggleActive(customer.id);
      enqueueSnackbar(
        customer.is_active ? 'Cliente desactivado' : 'Cliente activado',
        { variant: 'success' }
      );
      loadCustomer();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al cambiar estado', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRentalPageChange = (_: unknown, newPage: number) => {
    setRentalPage(newPage);
    loadRentals(newPage);
  };

  // Loading state
  if (loading || !customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const typeConfig = customerTypeConfig[customer.customer_type] || customerTypeConfig.individual;

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
            onClick={() => navigate('/customers')}
            variant="outlined"
            size="small"
            sx={{ borderRadius: '12px', borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
          >
            Volver
          </Button>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {customer.name}
              </Typography>
              <Chip
                icon={typeConfig.icon as React.ReactElement}
                label={typeConfig.label}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={customer.is_active ? 'Activo' : 'Inactivo'}
                size="small"
                sx={{
                  fontWeight: 600,
                  bgcolor: customer.is_active
                    ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                    : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
                  color: customer.is_active ? '#10b981' : '#ef4444',
                }}
              />
            </Box>
            {customer.contact_person && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Contacto: {customer.contact_person}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {hasAnyRole('director_general', 'jefe_ventas', 'vendedor') && (
            <Button
              startIcon={<QuoteIcon />}
              variant="outlined"
              size="small"
              onClick={() => navigate('/quotes/new')}
              sx={{ borderRadius: '12px', borderColor: '#8b5cf6', color: '#8b5cf6' }}
            >
              Nueva Cotización
            </Button>
          )}
          {hasAnyRole('director_general', 'jefe_ventas', 'jefe_admin') && (
            <Button
              startIcon={customer.is_active ? <ToggleOffIcon /> : <ToggleOnIcon />}
              variant="outlined"
              size="small"
              disabled={actionLoading}
              onClick={handleToggleActive}
              sx={{
                borderRadius: '12px',
                borderColor: customer.is_active ? '#f59e0b' : '#10b981',
                color: customer.is_active ? '#f59e0b' : '#10b981',
              }}
            >
              {customer.is_active ? 'Desactivar' : 'Activar'}
            </Button>
          )}
          {hasAnyRole('director_general', 'jefe_ventas', 'vendedor') && (
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              size="small"
              onClick={() => navigate('/customers')}
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
          { label: 'Total Gastado', value: formatCurrency(rentalSummary?.totalSpent || 0), color: '#8b5cf6', icon: <MoneyIcon /> },
          { label: 'Total Rentas', value: rentalSummary?.totalRentals ?? 0, color: '#3b82f6', icon: <CarIcon /> },
          { label: 'Rentas Activas', value: rentalSummary?.activeRentals ?? 0, color: '#10b981', icon: <ActiveIcon /> },
          { label: 'Completadas', value: rentalSummary?.completedRentals ?? 0, color: '#06b6d4', icon: <CompletedIcon /> },
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
                  {rentalsLoading ? <CircularProgress size={18} /> : kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {kpi.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ========== CUSTOMER INFO ========== */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 20, color: '#8b5cf6' }} /> Información de Contacto
            </Typography>
            <InfoRow label="Nombre" value={customer.name} />
            <InfoRow label="Persona de Contacto" value={customer.contact_person} />
            <InfoRow label="Email" value={
              customer.email ? (
                <Typography component="a" href={`mailto:${customer.email}`} variant="body2"
                  sx={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                  {customer.email}
                </Typography>
              ) : 'N/A'
            } />
            <InfoRow label="Teléfono" value={customer.phone} />
            <InfoRow label="RFC" value={customer.tax_id} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MoneyIcon sx={{ fontSize: 20, color: '#10b981' }} /> Información Comercial
            </Typography>
            <InfoRow label="Tipo de Cliente" value={
              <Chip icon={typeConfig.icon as React.ReactElement} label={typeConfig.label} size="small" />
            } />
            <InfoRow label="Dirección" value={
              [customer.address, customer.city, customer.country].filter(Boolean).join(', ') || 'N/A'
            } />
            <InfoRow label="Límite de Crédito" value={formatCurrency(customer.credit_limit || 0)} />
            <InfoRow label="Términos de Pago" value={`${customer.payment_terms || 30} días`} />
            <InfoRow label="Descuento" value={`${customer.discount_percentage || 0}%`} />
          </Paper>
        </Grid>
      </Grid>

      {/* ========== RENTAL HISTORY ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CarIcon sx={{ fontSize: 20, color: '#3b82f6' }} /> Historial de Rentas ({rentalTotal})
        </Typography>
        {rentalsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : rentals.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Este cliente no tiene rentas registradas
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Inicio</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fin</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rentals.map((rental: any) => {
                    const statusCfg = rentalStatusConfig[rental.status] || { label: rental.status, color: '#6b7280' };
                    return (
                      <TableRow
                        key={rental.id}
                        hover
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.04)' } }}
                        onClick={() => navigate(`/rentals/${rental.id}`)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{rental.rental_code}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            component="span"
                            onClick={(e) => { e.stopPropagation(); if (rental.vehicle?.id) navigate(`/inventory/${rental.vehicle.id}`); }}
                            sx={{ cursor: 'pointer', color: '#8b5cf6', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {rental.vehicle ? `${rental.vehicle.make} ${rental.vehicle.model}` : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(rental.start_date)}</TableCell>
                        <TableCell>{formatDate(rental.end_date)}</TableCell>
                        <TableCell>
                          <Chip label={statusCfg.label} size="small" sx={{ bgcolor: `${statusCfg.color}22`, color: statusCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(rental.total_amount || 0)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={rentalTotal}
              page={rentalPage}
              onPageChange={handleRentalPageChange}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>

      {/* ========== INVOICES ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon sx={{ fontSize: 20, color: '#f59e0b' }} /> Facturas ({invoices.length})
        </Typography>
        {invoicesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : invoices.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Este cliente no tiene facturas
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vencimiento</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv: any) => {
                  const statusCfg = invoiceStatusConfig[inv.status] || { label: inv.status, color: '#6b7280' };
                  return (
                    <TableRow
                      key={inv.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.04)' } }}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{inv.invoice_code}</TableCell>
                      <TableCell>{formatDate(inv.issue_date || inv.created_at)}</TableCell>
                      <TableCell>{formatDate(inv.due_date)}</TableCell>
                      <TableCell>
                        <Chip label={statusCfg.label} size="small" sx={{ bgcolor: `${statusCfg.color}22`, color: statusCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(inv.total_amount || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ========== QUOTES ========== */}
      <Paper sx={{ ...paperSx, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuoteIcon sx={{ fontSize: 20, color: '#8b5cf6' }} /> Cotizaciones ({quotes.length})
        </Typography>
        {quotesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : quotes.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Este cliente no tiene cotizaciones
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Vehículo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.map((q: any) => {
                  const statusCfg = quoteStatusConfig[q.status] || { label: q.status, color: '#6b7280' };
                  return (
                    <TableRow
                      key={q.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.04)' } }}
                      onClick={() => navigate(`/quotes/${q.id}`)}
                    >
                      <TableCell sx={{ fontWeight: 600 }}>{q.quote_code}</TableCell>
                      <TableCell>
                        {q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : 'Sin vehículo'}
                      </TableCell>
                      <TableCell>{formatDate(q.created_at)}</TableCell>
                      <TableCell>
                        <Chip label={statusCfg.label} size="small" sx={{ bgcolor: `${statusCfg.color}22`, color: statusCfg.color, fontWeight: 600, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(q.total_amount || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ========== NOTES ========== */}
      {customer.notes && (
        <Paper sx={{ ...paperSx, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotesIcon sx={{ fontSize: 20, color: '#6b7280' }} /> Notas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {customer.notes}
          </Typography>
        </Paper>
      )}

      {/* ========== DOCUMENTS ========== */}
      <DocumentPanel entityType="customer" entityId={customer.id} />
    </Box>
  );
};

export default CustomerDetail;
