/**
 * Formulario para Registrar Pago (CHAT 2)
 * CONVERTIDO A MATERIAL UI - Soporte completo Dark/Light Mode
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
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
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Check as CheckIcon,
  CheckCircle as SuccessIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  List as ListIcon
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { AppDispatch } from '../store';
import { createPayment } from '../store/slices/paymentSlice';
import { CreatePaymentDTO, PaymentType } from '../types/payment';
import customerService from '../services/customerService';
import invoiceService from '../services/invoiceService';
import { formatDate, getErrorMessage, safeNumber } from '../utils/formatters';
import { useCurrency } from '../contexts/CurrencyContext';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../constants/statusColors';

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useCustomTheme();
  const { formatCurrency } = useCurrency();
  const { enqueueSnackbar } = useSnackbar();
  const invoiceId = searchParams.get('invoice');

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [confirmOverpayment, setConfirmOverpayment] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentDTO>(() => {
    const numericInvoiceId = Number(invoiceId);
    const validInvoiceId = invoiceId && !Number.isNaN(numericInvoiceId) && numericInvoiceId > 0
      ? numericInvoiceId
      : undefined;

    return {
      customer_id: 0,
      invoice_id: validInvoiceId,
      amount: 0,
      payment_method: 'credit_card',
      payment_type: 'rental_payment' as PaymentType,
      reference_number: '',
      notes: ''
    };
  });

  useEffect(() => {
    loadCustomers();
    loadInvoices();
  }, []);

  useEffect(() => {
    const numericInvoiceId = Number(invoiceId);
    if (invoiceId && !Number.isNaN(numericInvoiceId) && numericInvoiceId > 0) {
      loadInvoiceDetails(numericInvoiceId);
    }
  }, [invoiceId]);

  useEffect(() => {
    if (formData.invoice_id) {
      const invoice = invoices.find(inv => inv.id === Number(formData.invoice_id));
      setSelectedInvoice(invoice);
      if (invoice) {
        setFormData(prev => ({
          ...prev,
          customer_id: invoice.customer_id,
          amount: safeNumber(invoice.balance)
        }));
      }
    } else {
      setSelectedInvoice(null);
    }
    setConfirmOverpayment(false);
  }, [formData.invoice_id, invoices]);

  useEffect(() => {
    setConfirmOverpayment(false);
  }, [formData.amount]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll({});
      setCustomers(response.data || []);
    } catch (error) {
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await invoiceService.getAll();
      setInvoices(response.data?.invoices || []);
    } catch (error) {
    }
  };

  const loadInvoiceDetails = async (id: number) => {
    try {
      const response = await invoiceService.getById(id);
      setSelectedInvoice(response.data);
      setFormData(prev => ({
        ...prev,
        invoice_id: id,
        customer_id: response.data.customer_id,
        amount: response.data.balance
      }));
    } catch (error) {
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handlePayFullBalance = () => {
    if (selectedInvoice) {
      setFormData(prev => ({
        ...prev,
        amount: selectedInvoice.balance
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || formData.amount <= 0) {
      enqueueSnackbar('Por favor completa todos los campos requeridos', { variant: 'warning' });
      return;
    }

    if (selectedInvoice && Number(formData.amount) > selectedInvoice.balance) {
      if (!confirmOverpayment) {
        enqueueSnackbar('Por favor confirma el sobrepago marcando la casilla de verificación', { variant: 'warning' });
        return;
      }
    }

    setLoading(true);
    try {
      const result = await dispatch(createPayment(formData)).unwrap();
      const customer = customers.find(c => c.id === formData.customer_id);

      const receipt = {
        payment_code: result.payment_code || `PAY-${Date.now()}`,
        date: new Date(),
        customer_name: customer ? customer.name : 'N/A',
        customer_email: customer?.email || '',
        amount: formData.amount,
        payment_method: formData.payment_method,
        payment_type: formData.payment_type,
        reference_number: formData.reference_number,
        invoice_code: selectedInvoice?.invoice_code,
        notes: formData.notes
      };

      setPaymentReceipt(receipt);
      setShowReceiptModal(true);
    } catch (error: unknown) {
      enqueueSnackbar(`Error: ${getErrorMessage(error)}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => PAYMENT_METHOD_LABELS[method] || method;
  const getPaymentTypeLabel = (type: string) => PAYMENT_TYPE_LABELS[type] || type;

  const isOverpayment = selectedInvoice && Number(formData.amount) > selectedInvoice.balance;
  const overpaymentAmount = isOverpayment ? Number(formData.amount) - selectedInvoice.balance : 0;

  const paperStyles = {
    p: { xs: 2, sm: 3 },
    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
    borderRadius: { xs: '12px', sm: 2 },
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
          Registrar Pago
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Completa el formulario para registrar un nuevo pago
        </Typography>
      </Box>

      <Paper sx={paperStyles}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Tipo de Pago */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Pago *</InputLabel>
                <Select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={(e) => handleChange({ target: { name: 'payment_type', value: e.target.value } })}
                  label="Tipo de Pago *"
                  required
                >
                  <MenuItem value="rental_payment">Pago de Renta</MenuItem>
                  <MenuItem value="deposit">Depósito</MenuItem>
                  <MenuItem value="penalty">Penalidad</MenuItem>
                  <MenuItem value="refund">Reembolso</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Factura */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Factura (opcional)</InputLabel>
                <Select
                  name="invoice_id"
                  value={formData.invoice_id || ''}
                  onChange={(e) => handleChange({ target: { name: 'invoice_id', value: e.target.value } })}
                  label="Factura (opcional)"
                >
                  <MenuItem value="">Sin factura</MenuItem>
                  {invoices.filter(inv => inv.balance > 0).map(invoice => (
                    <MenuItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_code} - Saldo: {formatCurrency(invoice.balance)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Cliente */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente *</InputLabel>
                <Select
                  name="customer_id"
                  value={formData.customer_id || ''}
                  onChange={(e) => handleChange({ target: { name: 'customer_id', value: e.target.value } })}
                  label="Cliente *"
                  required
                  disabled={!!selectedInvoice}
                >
                  <MenuItem value="">Seleccionar cliente</MenuItem>
                  {customers.map(customer => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Monto */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Monto *"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                inputProps={{ min: 0.01, step: 0.01 }}
              />
              {selectedInvoice && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Saldo pendiente: <strong>{formatCurrency(selectedInvoice.balance)}</strong>
                  </Typography>
                  {Number(formData.amount) !== selectedInvoice.balance && (
                    <Button
                      size="small"
                      onClick={handlePayFullBalance}
                      sx={{ ml: 1, fontSize: '0.75rem', textTransform: 'none', color: '#8b5cf6' }}
                    >
                      Pagar saldo completo
                    </Button>
                  )}
                </Box>
              )}
            </Grid>

            {/* Método de Pago */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Método de Pago *</InputLabel>
                <Select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => handleChange({ target: { name: 'payment_method', value: e.target.value } })}
                  label="Método de Pago *"
                  required
                >
                  <MenuItem value="cash">Efectivo</MenuItem>
                  <MenuItem value="credit_card">Tarjeta de Crédito</MenuItem>
                  <MenuItem value="debit_card">Tarjeta de Débito</MenuItem>
                  <MenuItem value="transfer">Transferencia</MenuItem>
                  <MenuItem value="check">Cheque</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Número de Referencia */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Número de Referencia (opcional)"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                placeholder="Ej: TRF-123456"
              />
            </Grid>

            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                label="Notas (opcional)"
                placeholder="Información adicional sobre el pago..."
              />
            </Grid>
          </Grid>

          {/* Warning de Overpayment */}
          {isOverpayment && (
            <Paper
              sx={{
                mt: 3,
                p: 2,
                background: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(234, 179, 8, 0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(234, 179, 8, 0.5)' : 'rgba(234, 179, 8, 0.3)'}`
              }}
            >
              <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#fcd34d' : '#b45309', mb: 1 }}>
                ⚠️ Advertencia: Sobrepago Detectado
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#fde68a' : '#92400e' }}>
                El monto ingresado (<strong>{formatCurrency(Number(formData.amount))}</strong>) es MAYOR que el saldo pendiente (<strong>{formatCurrency(selectedInvoice.balance)}</strong>).
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#fde68a' : '#92400e', mt: 0.5 }}>
                Sobrepago: <strong>{formatCurrency(overpaymentAmount)}</strong>
              </Typography>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={confirmOverpayment}
                    onChange={(e) => setConfirmOverpayment(e.target.checked)}
                    sx={{ color: isDarkMode ? '#fcd34d' : '#b45309' }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: isDarkMode ? '#fcd34d' : '#92400e' }}>
                    Confirmo que quiero procesar un sobrepago de {formatCurrency(overpaymentAmount)}
                  </Typography>
                }
              />
            </Paper>
          )}

          {/* Resumen de Factura */}
          {selectedInvoice && (
            <Paper
              sx={{
                mt: 3,
                p: 2,
                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                Resumen de la Factura
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Factura:</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedInvoice.invoice_code}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total:</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatCurrency(selectedInvoice.total_amount)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Pagado:</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatCurrency(selectedInvoice.paid_amount || 0)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Saldo:</Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ color: '#ef4444' }}>{formatCurrency(selectedInvoice.balance)}</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Botones */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/payments')}
              sx={{
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
              sx={{
                bgcolor: '#3b82f6',
                '&:hover': { bgcolor: '#2563eb' }
              }}
            >
              {loading ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Modal de Recibo */}
      <Dialog
        open={showReceiptModal}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: isDarkMode ? '#1f2937' : '#fff',
            borderRadius: 2
          }
        }}
      >
        {/* Header Verde */}
        <Box sx={{ bgcolor: '#10b981', color: '#fff', p: 4, textAlign: 'center' }}>
          <SuccessIcon sx={{ fontSize: 64, mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">¡Pago Registrado!</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>El pago se procesó exitosamente</Typography>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {paymentReceipt && (
            <>
              <Paper sx={{ p: 3, mb: 3, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Código de Pago</Typography>
                  <Typography variant="h5" fontWeight="bold">{paymentReceipt.payment_code}</Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Fecha:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight={500} textAlign="right">{formatDate(paymentReceipt.date)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Cliente:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight={500} textAlign="right">{paymentReceipt.customer_name}</Typography>
                  </Grid>
                  {paymentReceipt.invoice_code && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Factura:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight={500} textAlign="right">{paymentReceipt.invoice_code}</Typography>
                      </Grid>
                    </>
                  )}
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight={500} textAlign="right">{getPaymentTypeLabel(paymentReceipt.payment_type)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Método:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight={500} textAlign="right">{getPaymentMethodLabel(paymentReceipt.payment_method)}</Typography>
                  </Grid>
                  {paymentReceipt.reference_number && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Referencia:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" fontWeight={500} textAlign="right">{paymentReceipt.reference_number}</Typography>
                      </Grid>
                    </>
                  )}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">Monto:</Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#10b981' }}>
                    {formatCurrency(Number(paymentReceipt.amount))}
                  </Typography>
                </Box>
              </Paper>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                  sx={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                >
                  Imprimir Recibo
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => enqueueSnackbar(`Recibo enviado a: ${paymentReceipt.customer_email}`, { variant: 'success' })}
                  sx={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                >
                  Enviar por Email
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ListIcon />}
                  onClick={() => {
                    setShowReceiptModal(false);
                    navigate('/payments');
                  }}
                  sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}
                >
                  Ver Lista de Pagos
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentForm;
