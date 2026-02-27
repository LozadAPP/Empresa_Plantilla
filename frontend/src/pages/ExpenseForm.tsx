/**
 * Formulario de Gasto (Crear/Editar)
 * Categorías dinámicas con auto-selección de cuenta contable
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  InputAdornment,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import expenseService from '../services/expenseService';
import { locationService } from '../services/locationService';
import { supplierService } from '../services/supplierService';
import { useLocation as useLocationContext } from '../contexts/LocationContext';
import { ExpenseCategory } from '../types/expense';
import { SupplierDropdown } from '../types/supplier';

interface LocationOption {
  id: number;
  name: string;
}

// Maps subcategory → account (IDs from seeded accounts table)
const SUBCATEGORY_ACCOUNTS: Record<string, { accountId: number; label: string }> = {
  sueldos: { accountId: 43, label: '5110 - Sueldos y Salarios' },
  imss: { accountId: 44, label: '5120 - Cuotas Patronales IMSS' },
  renta_oficinas: { accountId: 45, label: '5130 - Renta de Oficinas' },
  servicios: { accountId: 46, label: '5140 - Servicios Públicos' },
  papeleria: { accountId: 47, label: '5150 - Papelería y Útiles' },
  publicidad: { accountId: 48, label: '5160 - Publicidad y Marketing' },
  honorarios: { accountId: 49, label: '5170 - Honorarios Profesionales' },
  mantenimiento_vehiculos: { accountId: 51, label: '5210 - Mantenimiento de Vehículos' },
  combustible: { accountId: 52, label: '5220 - Combustible' },
  seguros_vehiculos: { accountId: 53, label: '5230 - Seguros de Vehículos' },
  tenencias: { accountId: 54, label: '5240 - Tenencias y Verificaciones' },
  depreciacion: { accountId: 55, label: '5250 - Depreciación de Vehículos' },
  lavado: { accountId: 56, label: '5260 - Lavado de Vehículos' },
  intereses: { accountId: 58, label: '5310 - Intereses Pagados' },
  comisiones_bancarias: { accountId: 59, label: '5320 - Comisiones Bancarias' },
  otros: { accountId: 60, label: '5400 - Otros Gastos' },
};

const CATEGORY_SUBCATEGORIES: Record<ExpenseCategory, { value: string; label: string }[]> = {
  operacion: [
    { value: 'sueldos', label: 'Sueldos y Salarios' },
    { value: 'imss', label: 'Cuotas Patronales IMSS' },
    { value: 'renta_oficinas', label: 'Renta de Oficinas' },
    { value: 'servicios', label: 'Servicios Públicos' },
    { value: 'papeleria', label: 'Papelería y Útiles' },
    { value: 'publicidad', label: 'Publicidad y Marketing' },
    { value: 'honorarios', label: 'Honorarios Profesionales' },
  ],
  vehiculos: [
    { value: 'mantenimiento_vehiculos', label: 'Mantenimiento de Vehículos' },
    { value: 'combustible', label: 'Combustible' },
    { value: 'seguros_vehiculos', label: 'Seguros de Vehículos' },
    { value: 'tenencias', label: 'Tenencias y Verificaciones' },
    { value: 'depreciacion', label: 'Depreciación de Vehículos' },
    { value: 'lavado', label: 'Lavado de Vehículos' },
  ],
  financieros: [
    { value: 'intereses', label: 'Intereses Pagados' },
    { value: 'comisiones_bancarias', label: 'Comisiones Bancarias' },
  ],
  otros: [
    { value: 'otros', label: 'Otros Gastos' },
  ],
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  operacion: 'Operación',
  vehiculos: 'Vehículos',
  financieros: 'Financieros',
  otros: 'Otros',
};

const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { selectedLocationId } = useLocationContext();
  const { enqueueSnackbar } = useSnackbar();

  // Form state
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [includeIVA, setIncludeIVA] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierDropdown | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierRfc, setSupplierRfc] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [locationId, setLocationId] = useState<number | null>(selectedLocationId);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState('');
  const [notes, setNotes] = useState('');

  // Data state
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDropdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsRes, suppliersRes] = await Promise.all([
          locationService.getLocationsDropdown(),
          supplierService.getDropdown(),
        ]);
        if (locationsRes.success) setLocations(locationsRes.data || []);
        if (suppliersRes.success) setSuppliers(suppliersRes.data || []);
      } catch {
        // Non-critical
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Load existing expense for editing
  useEffect(() => {
    if (isEditing && id) {
      const loadExpense = async () => {
        setLoading(true);
        try {
          const response = await expenseService.getById(Number(id));
          if (response.success) {
            const e = response.data;
            setCategory(e.category);
            setSubcategory(e.subcategory || '');
            setDescription(e.description);
            setAmount(Number(e.amount) || 0);
            setTaxAmount(Number(e.tax_amount) || 0);
            setIncludeIVA(Number(e.tax_amount) > 0);
            setPaymentMethod(e.payment_method || '');
            setSupplierId(e.supplier_id || null);
            setSupplierName(e.supplier_name || '');
            setSupplierRfc(e.supplier_rfc || '');
            setReceiptNumber(e.receipt_number || '');
            setExpenseDate(e.expense_date ? new Date(e.expense_date).toISOString().split('T')[0] : '');
            setDueDate(e.due_date ? new Date(e.due_date).toISOString().split('T')[0] : '');
            setLocationId(e.location_id || null);
            setIsRecurring(e.is_recurring);
            setRecurrencePeriod(e.recurrence_period || '');
            setNotes(e.notes || '');
            // If not pending, make form read-only
            if (e.status !== 'pending') {
              setIsReadOnly(true);
            }
          }
        } catch {
          enqueueSnackbar('Error al cargar gasto', { variant: 'error' });
          navigate('/expenses');
        } finally {
          setLoading(false);
        }
      };
      loadExpense();
    }
  }, [id, isEditing, navigate, enqueueSnackbar]);

  // Sync selectedSupplier from loaded suppliers when editing
  useEffect(() => {
    if (supplierId && suppliers.length > 0) {
      const found = suppliers.find(s => s.id === supplierId);
      if (found) setSelectedSupplier(found);
    }
  }, [supplierId, suppliers]);

  // Auto-calculate IVA when amount or toggle changes
  useEffect(() => {
    if (includeIVA) {
      setTaxAmount(parseFloat((amount * 0.16).toFixed(2)));
    } else {
      setTaxAmount(0);
    }
  }, [amount, includeIVA]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (category && !isEditing) {
      setSubcategory('');
    }
  }, [category, isEditing]);

  // Derived values
  const totalAmount = useMemo(() => {
    return parseFloat((amount + taxAmount).toFixed(2));
  }, [amount, taxAmount]);

  const accountLabel = subcategory && SUBCATEGORY_ACCOUNTS[subcategory]
    ? SUBCATEGORY_ACCOUNTS[subcategory].label
    : '—';

  const availableSubcategories = category ? CATEGORY_SUBCATEGORIES[category] || [] : [];

  const handleSave = async () => {
    if (!category) {
      enqueueSnackbar('Selecciona una categoría', { variant: 'warning' });
      return;
    }
    if (!description.trim()) {
      enqueueSnackbar('Ingresa una descripción', { variant: 'warning' });
      return;
    }
    if (amount <= 0) {
      enqueueSnackbar('El monto debe ser mayor a 0', { variant: 'warning' });
      return;
    }
    if (!expenseDate) {
      enqueueSnackbar('Selecciona la fecha del gasto', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      const accountId = subcategory && SUBCATEGORY_ACCOUNTS[subcategory]
        ? SUBCATEGORY_ACCOUNTS[subcategory].accountId
        : undefined;

      const data = {
        category,
        subcategory: subcategory || undefined,
        account_id: accountId,
        description,
        amount,
        tax_amount: taxAmount,
        payment_method: paymentMethod || undefined,
        supplier_id: supplierId || undefined,
        supplier_name: supplierName || undefined,
        supplier_rfc: supplierRfc || undefined,
        receipt_number: receiptNumber || undefined,
        expense_date: expenseDate,
        due_date: dueDate || undefined,
        location_id: locationId || undefined,
        is_recurring: isRecurring,
        recurrence_period: isRecurring ? recurrencePeriod || undefined : undefined,
        notes: notes || undefined,
      };

      if (isEditing) {
        await expenseService.update(Number(id), data);
        enqueueSnackbar('Gasto actualizado', { variant: 'success' });
      } else {
        await expenseService.create(data);
        enqueueSnackbar('Gasto registrado exitosamente', { variant: 'success' });
      }
      navigate('/expenses');
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.message || 'Error al guardar gasto', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const paperSx = {
    p: 3,
    borderRadius: '16px',
    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
  };

  if (loading || loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/expenses')}
          sx={{ color: 'text.secondary', textTransform: 'none' }}
        >
          Volver
        </Button>
        <Typography variant="h5" fontWeight={700} sx={{ color: isDarkMode ? '#fff' : '#111' }}>
          {isReadOnly ? 'Detalle del Gasto' : (isEditing ? 'Editar Gasto' : 'Nuevo Gasto')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left column - Form */}
        <Grid item xs={12} md={8}>
          {/* Category & Classification */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Clasificación
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    label="Categoría"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    disabled={isReadOnly}
                  >
                    {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map(cat => (
                      <MenuItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth disabled={!category || isReadOnly}>
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    label="Subcategoría"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                  >
                    <MenuItem value="">Seleccionar...</MenuItem>
                    {availableSubcategories.map(sub => (
                      <MenuItem key={sub.value} value={sub.value}>{sub.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Cuenta Contable"
                  size="small"
                  fullWidth
                  value={accountLabel}
                  disabled
                  sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción *"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del gasto..."
                  disabled={isReadOnly}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Financial Data */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Datos Financieros
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Monto *"
                  type="number"
                  size="small"
                  fullWidth
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  inputProps={{ min: 0, step: '0.01' }}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeIVA}
                        onChange={(e) => setIncludeIVA(e.target.checked)}
                        disabled={isReadOnly}
                        color="primary"
                      />
                    }
                    label="IVA 16%"
                  />
                  <TextField
                    label="IVA"
                    type="number"
                    size="small"
                    value={taxAmount || ''}
                    onChange={(e) => { setTaxAmount(Number(e.target.value) || 0); setIncludeIVA(Number(e.target.value) > 0); }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    sx={{ width: 140 }}
                    disabled={isReadOnly}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    label="Método de Pago"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isReadOnly}
                  >
                    <MenuItem value="">Sin especificar</MenuItem>
                    <MenuItem value="cash">Efectivo</MenuItem>
                    <MenuItem value="card">Tarjeta</MenuItem>
                    <MenuItem value="transfer">Transferencia</MenuItem>
                    <MenuItem value="check">Cheque</MenuItem>
                    <MenuItem value="other">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Supplier & Receipt */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Proveedor y Comprobante
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={suppliers}
                  getOptionLabel={(opt) => `${opt.name}${opt.rfc ? ` (${opt.rfc})` : ''}`}
                  value={selectedSupplier}
                  onChange={(_, val) => {
                    setSelectedSupplier(val);
                    setSupplierId(val?.id || null);
                    setSupplierName(val?.name || '');
                    setSupplierRfc(val?.rfc || '');
                  }}
                  isOptionEqualToValue={(opt, val) => opt.id === val.id}
                  disabled={isReadOnly}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Proveedor" placeholder="Buscar proveedor..." />
                  )}
                  noOptionsText="Sin proveedores"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="RFC del Proveedor"
                  size="small"
                  fullWidth
                  value={supplierRfc}
                  disabled
                  sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="No. de Comprobante/Factura"
                  size="small"
                  fullWidth
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  disabled={isReadOnly}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Dates & Location */}
          <Paper sx={{ ...paperSx, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Fechas y Ubicación
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha del Gasto *"
                  type="date"
                  size="small"
                  fullWidth
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Fecha de Vencimiento"
                  type="date"
                  size="small"
                  fullWidth
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={isReadOnly}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Ubicación</InputLabel>
                  <Select
                    label="Ubicación"
                    value={locationId || ''}
                    onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : null)}
                    disabled={isReadOnly}
                  >
                    <MenuItem value="">Sin ubicación</MenuItem>
                    {locations.map(loc => (
                      <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        disabled={isReadOnly}
                      />
                    }
                    label="Gasto recurrente"
                  />
                  {isRecurring && (
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Periodo</InputLabel>
                      <Select
                        label="Periodo"
                        value={recurrencePeriod}
                        onChange={(e) => setRecurrencePeriod(e.target.value)}
                        disabled={isReadOnly}
                      >
                        <MenuItem value="monthly">Mensual</MenuItem>
                        <MenuItem value="quarterly">Trimestral</MenuItem>
                        <MenuItem value="yearly">Anual</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Notes */}
          <Paper sx={paperSx}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Notas
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              size="small"
              disabled={isReadOnly}
            />
          </Paper>
        </Grid>

        {/* Right column - Summary */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              ...paperSx,
              position: { md: 'sticky' },
              top: { md: 100 }
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Resumen del Gasto
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Categoría:</Typography>
              <Typography variant="body2" fontWeight={600}>
                {category ? CATEGORY_LABELS[category] : '—'}
              </Typography>
            </Box>
            {subcategory && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Subcategoría:</Typography>
                <Typography variant="body2">
                  {availableSubcategories.find(s => s.value === subcategory)?.label || subcategory}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Cuenta:</Typography>
              <Typography variant="body2" sx={{ textAlign: 'right', maxWidth: 160 }}>
                {accountLabel}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Monto:</Typography>
              <Typography variant="body2">{formatCurrency(amount)}</Typography>
            </Box>
            {taxAmount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">IVA:</Typography>
                <Typography variant="body2">+{formatCurrency(taxAmount)}</Typography>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Total:</Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#ef4444' }}>
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>

            {paymentMethod && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Método:</Typography>
                <Typography variant="body2">
                  {{ cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', check: 'Cheque', other: 'Otro' }[paymentMethod] || paymentMethod}
                </Typography>
              </Box>
            )}

            {!isReadOnly && (
              <>
                <Divider sx={{ my: 2 }} />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || !category || !description || amount <= 0}
                  fullWidth
                  sx={{
                    background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { background: 'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)' }
                  }}
                >
                  {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Gasto')}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExpenseForm;
