/**
 * Formulario para Crear Factura
 * Permite seleccionar una renta y generar una factura asociada
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Check as CheckIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import rentalService from '../services/rentalService';
import invoiceService from '../services/invoiceService';
import { Rental } from '../types/rental';
import { CreateInvoiceDTO } from '../types/invoice';
import { getErrorMessage } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const themeStyles = useThemeStyles();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  const [formData, setFormData] = useState<CreateInvoiceDTO>({
    rental_id: 0,
    customer_id: 0,
    due_days: 7,
    notes: ''
  });

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    setLoadingRentals(true);
    try {
      const response = await rentalService.getAll({ limit: 500 });
      const allRentals = response.data?.rentals || [];
      // Solo mostrar rentas activas o completadas
      const filtered = allRentals.filter(
        (r) => r.status === 'active' || r.status === 'completed'
      );
      setRentals(filtered);
    } catch (error) {
      enqueueSnackbar('Error al cargar las rentas', { variant: 'error' });
      console.error('Error loading rentals:', error);
    } finally {
      setLoadingRentals(false);
    }
  };

  const handleRentalChange = (rentalId: number) => {
    const rental = rentals.find((r) => r.id === rentalId) || null;
    setSelectedRental(rental);
    setFormData((prev) => ({
      ...prev,
      rental_id: rentalId,
      customer_id: rental?.customer_id || 0
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'due_days' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rental_id || !formData.customer_id) {
      enqueueSnackbar('Por favor selecciona una renta', { variant: 'warning' });
      return;
    }

    if (formData.due_days! < 1 || formData.due_days! > 90) {
      enqueueSnackbar('Los dias de vencimiento deben estar entre 1 y 90', {
        variant: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      await invoiceService.create(formData);
      enqueueSnackbar('Factura creada exitosamente', { variant: 'success' });
      navigate('/invoices');
    } catch (error: unknown) {
      enqueueSnackbar(`Error: ${getErrorMessage(error)}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const paperStyles = {
    p: { xs: 2, sm: 3 },
    background: themeStyles.background.card,
    borderRadius: '24px',
    border: `1px solid ${themeStyles.border.default}`,
    boxShadow: themeStyles.shadow.card
  };

  const customerName = selectedRental?.customer?.name || 'N/A';
  const customerEmail = selectedRental?.customer?.email || '';
  const customerPhone = selectedRental?.customer?.phone || '';

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <ReceiptIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{ color: themeStyles.text.heading }}
          >
            Nueva Factura
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: themeStyles.text.secondary }}>
          Completa el formulario para generar una nueva factura
        </Typography>
      </Box>

      <Paper sx={paperStyles}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Selector de Renta */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Renta *</InputLabel>
                <Select
                  value={formData.rental_id || ''}
                  onChange={(e) => handleRentalChange(Number(e.target.value))}
                  label="Renta *"
                  required
                  disabled={loadingRentals}
                >
                  <MenuItem value="">
                    {loadingRentals
                      ? 'Cargando rentas...'
                      : 'Seleccionar renta'}
                  </MenuItem>
                  {rentals.map((rental) => (
                    <MenuItem key={rental.id} value={rental.id}>
                      {rental.rental_code} - {rental.customer?.name || 'Sin cliente'} -{' '}
                      {formatCurrency(rental.total_amount)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Informacion del Cliente (auto-fill, solo lectura) */}
            {selectedRental && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ borderColor: themeStyles.border.subtle }}>
                    <Typography
                      variant="caption"
                      sx={{ color: themeStyles.text.secondary, px: 1 }}
                    >
                      Datos del Cliente
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cliente"
                    value={customerName}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email"
                    value={customerEmail}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Telefono"
                    value={customerPhone}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </>
            )}

            {/* Dias de Vencimiento */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Dias de vencimiento *"
                type="number"
                name="due_days"
                value={formData.due_days}
                onChange={handleChange}
                required
                inputProps={{ min: 1, max: 90 }}
                helperText="Plazo para el pago (1-90 dias)"
              />
            </Grid>

            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                label="Notas (opcional)"
                placeholder="Informacion adicional para la factura..."
              />
            </Grid>
          </Grid>

          {/* Resumen Financiero */}
          {selectedRental && (
            <>
              <Divider sx={{ my: 3, borderColor: themeStyles.border.subtle }} />

              <Paper
                sx={{
                  p: 2.5,
                  background: isDarkMode
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'rgba(139, 92, 246, 0.04)',
                  border: `1px solid ${
                    isDarkMode
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(139, 92, 246, 0.15)'
                  }`,
                  borderRadius: '16px'
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ mb: 2, color: themeStyles.text.heading }}
                >
                  Resumen Financiero
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      sx={{ color: themeStyles.text.secondary }}
                    >
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(selectedRental.subtotal)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      sx={{ color: themeStyles.text.secondary }}
                    >
                      Impuestos
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(selectedRental.tax_amount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      sx={{ color: themeStyles.text.secondary }}
                    >
                      Descuento
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(selectedRental.discount_amount || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography
                      variant="caption"
                      sx={{ color: themeStyles.text.secondary }}
                    >
                      Total
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      sx={{ color: '#8b5cf6' }}
                    >
                      {formatCurrency(selectedRental.total_amount)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </>
          )}

          {/* Botones */}
          <Box
            sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/invoices')}
              sx={{
                borderColor: isDarkMode
                  ? 'rgba(255,255,255,0.3)'
                  : 'rgba(0,0,0,0.23)',
                color: isDarkMode
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(0,0,0,0.6)'
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formData.rental_id}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckIcon />
                )
              }
              sx={{
                bgcolor: '#8b5cf6',
                '&:hover': { bgcolor: '#7c3aed' }
              }}
            >
              {loading ? 'Generando...' : 'Generar Factura'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default InvoiceForm;
