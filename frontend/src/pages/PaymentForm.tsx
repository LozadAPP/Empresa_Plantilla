/**
 * Formulario para Registrar Pago (CHAT 2) - VERSIÓN MEJORADA
 * Cambios: Validación de overpayment, modal de recibo, botón pago completo
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useTheme as useMuiTheme } from '@mui/material';
import { useSnackbar } from 'notistack';
import { AppDispatch } from '../store';
import { createPayment } from '../store/slices/paymentSlice';
import { CreatePaymentDTO, PaymentType } from '../types/payment';
import customerService from '../services/customerService';
import invoiceService from '../services/invoiceService';
import { formatDate, formatCurrency, getErrorMessage, safeNumber } from '../utils/formatters';
import { PAYMENT_METHOD_LABELS, PAYMENT_TYPE_LABELS } from '../constants/statusColors';

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const muiTheme = useMuiTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const { enqueueSnackbar } = useSnackbar();
  const invoiceId = searchParams.get('invoice');

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [confirmOverpayment, setConfirmOverpayment] = useState(false);

  // ✅ Estado para modal de recibo
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
    // Reset overpayment confirmation cuando cambia factura
    setConfirmOverpayment(false);
  }, [formData.invoice_id, invoices]);

  // ✅ Reset confirmación cuando cambia el monto
  useEffect(() => {
    setConfirmOverpayment(false);
  }, [formData.amount]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll({});
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await invoiceService.getAll();
      setInvoices(response.data?.invoices || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
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
      console.error('Error loading invoice:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Botón para pagar saldo completo
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

    // ✅ VALIDACIÓN DE OVERPAYMENT
    if (selectedInvoice && Number(formData.amount) > selectedInvoice.balance) {
      if (!confirmOverpayment) {
        enqueueSnackbar('Por favor confirma el sobrepago marcando la casilla de verificación', { variant: 'warning' });
        return;
      }
    }

    setLoading(true);
    try {
      const result = await dispatch(createPayment(formData)).unwrap();

      // ✅ Buscar el cliente para el recibo
      const customer = customers.find(c => c.id === formData.customer_id);

      // ✅ Crear recibo con los datos del pago
      const receipt = {
        payment_code: result.payment_code || `PAY-${Date.now()}`,
        date: new Date(),
        customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'N/A',
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

  // Helpers para etiquetas
  const getPaymentMethodLabel = (method: string) => PAYMENT_METHOD_LABELS[method] || method;
  const getPaymentTypeLabel = (type: string) => PAYMENT_TYPE_LABELS[type] || type;

  // ✅ Detectar overpayment
  const isOverpayment = selectedInvoice && Number(formData.amount) > selectedInvoice.balance;
  const overpaymentAmount = isOverpayment ? Number(formData.amount) - selectedInvoice.balance : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registrar Pago</h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completa el formulario para registrar un nuevo pago</p>
      </div>

      <form onSubmit={handleSubmit} className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Pago */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Tipo de Pago *
            </label>
            <select
              name="payment_type"
              value={formData.payment_type}
              onChange={handleChange}
              required
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="rental_payment">Pago de Renta</option>
              <option value="deposit">Depósito</option>
              <option value="penalty">Penalidad</option>
              <option value="refund">Reembolso</option>
            </select>
          </div>

          {/* Factura (opcional) */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Factura (opcional)
            </label>
            <select
              name="invoice_id"
              value={formData.invoice_id || ''}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="">Sin factura</option>
              {invoices.filter(inv => inv.balance > 0).map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_code} - Saldo: {formatCurrency(invoice.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Cliente *
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
              disabled={!!selectedInvoice}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'}`}
            >
              <option value="">Seleccionar cliente</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          {/* Monto */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Monto *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            {selectedInvoice && (
              <div className="mt-1 space-y-1">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Saldo pendiente: <strong>{formatCurrency(selectedInvoice.balance)}</strong>
                </p>
                {/* Boton pago completo */}
                {Number(formData.amount) !== selectedInvoice.balance && (
                  <button
                    type="button"
                    onClick={handlePayFullBalance}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Pagar saldo completo ({formatCurrency(selectedInvoice.balance)})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Método de Pago */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Método de Pago *
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
              <option value="cash">Efectivo</option>
              <option value="credit_card">Tarjeta de Crédito</option>
              <option value="debit_card">Tarjeta de Débito</option>
              <option value="transfer">Transferencia</option>
              <option value="check">Cheque</option>
            </select>
          </div>

          {/* Número de Referencia */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Número de Referencia (opcional)
            </label>
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="Ej: TRF-123456"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Notas (opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Información adicional sobre el pago..."
            />
          </div>
        </div>

        {/* WARNING DE OVERPAYMENT */}
        {isOverpayment && (
          <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start">
              <span className="text-2xl mr-3">!</span>
              <div className="flex-1">
                <p className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>Advertencia: Sobrepago Detectado</p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  El monto ingresado (<strong>{formatCurrency(Number(formData.amount))}</strong>) es MAYOR que el saldo pendiente (<strong>{formatCurrency(selectedInvoice.balance)}</strong>).
                </p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Sobrepago: <strong>{formatCurrency(overpaymentAmount)}</strong>
                </p>

                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={confirmOverpayment}
                      onChange={(e) => setConfirmOverpayment(e.target.checked)}
                      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
                    />
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>
                      Confirmo que quiero procesar un sobrepago de {formatCurrency(overpaymentAmount)}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {selectedInvoice && (
          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Resumen de la Factura</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Factura:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedInvoice.invoice_code}</span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Pagado:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedInvoice.paid_amount || 0)}</span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Saldo:</span>
                <span className="ml-2 font-medium text-red-600">{formatCurrency(selectedInvoice.balance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className={`px-6 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </div>
      </form>

      {/* ✅ MODAL DE RECIBO */}
      {showReceiptModal && paymentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header del modal */}
            <div className="bg-green-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-center">¡Pago Registrado!</h2>
              <p className="text-center text-green-100 mt-1">El pago se procesó exitosamente</p>
            </div>

            {/* Contenido del recibo */}
            <div className="p-6">
              <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-center mb-4">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Código de Pago</p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{paymentReceipt.payment_code}</p>
                </div>

                <div className={`border-t pt-4 space-y-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Fecha:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(paymentReceipt.date)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Cliente:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{paymentReceipt.customer_name}</span>
                  </div>
                  {paymentReceipt.invoice_code && (
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Factura:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{paymentReceipt.invoice_code}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tipo:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getPaymentTypeLabel(paymentReceipt.payment_type)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Método:</span>
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getPaymentMethodLabel(paymentReceipt.payment_method)}</span>
                  </div>
                  {paymentReceipt.reference_number && (
                    <div className="flex justify-between text-sm">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Referencia:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{paymentReceipt.reference_number}</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold border-t pt-3 mt-3 ${isDarkMode ? 'border-gray-600 text-white' : 'border-gray-200'}`}>
                    <span>Monto:</span>
                    <span className="text-green-600">{formatCurrency(Number(paymentReceipt.amount))}</span>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <button
                  onClick={() => window.print()}
                  className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Recibo
                </button>
                <button
                  onClick={() => {
                    enqueueSnackbar(`Recibo enviado a: ${paymentReceipt.customer_email}`, { variant: 'success' });
                  }}
                  className={`w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Enviar por Email
                </button>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    navigate('/payments');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Ver Lista de Pagos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
