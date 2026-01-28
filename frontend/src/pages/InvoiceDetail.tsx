/**
 * Detalle de Factura (CHAT 2)
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchInvoiceById } from '../store/slices/paymentSlice';
import { InvoiceStatus } from '../types/invoice';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { selectedInvoice: invoice, loading } = useSelector((state: RootState) => state.payments);

  useEffect(() => {
    const numericId = Number(id);
    if (id && !Number.isNaN(numericId) && numericId > 0) {
      dispatch(fetchInvoiceById(numericId));
    } else if (id) {
      // ID inválido - redirigir a lista de facturas
      navigate('/invoices');
    }
  }, [dispatch, id, navigate]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status: InvoiceStatus) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: InvoiceStatus) => {
    const labels = {
      draft: 'Borrador',
      sent: 'Enviada',
      paid: 'Pagada',
      overdue: 'Vencida',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isOverdue = new Date(invoice.due_date) < new Date() && invoice.balance > 0;
  const isPaid = invoice.balance === 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_code}</h1>
          <p className="text-gray-600 mt-1">Detalle de la factura</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Volver
          </button>
          {invoice.pdf_url && (
            <button
              onClick={() => window.open(invoice.pdf_url, '_blank')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              📄 Ver PDF
            </button>
          )}
          {invoice.balance > 0 && (
            <button
              onClick={() => navigate(`/payments/new?invoice=${invoice.id}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              💳 Registrar Pago
            </button>
          )}
        </div>
      </div>

      {/* Estado y Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Estado */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Estado</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(invoice.status)}`}>
            {getStatusLabel(invoice.status)}
          </span>
          {isOverdue && (
            <p className="text-xs text-red-600 mt-2">⚠️ Factura vencida</p>
          )}
          {isPaid && (
            <p className="text-xs text-green-600 mt-2">✅ Pagada completamente</p>
          )}
        </div>

        {/* Fecha de Emisión */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Fecha de Emisión</h2>
          <p className="text-xl font-bold text-gray-900">
            {formatDate(invoice.issue_date)}
          </p>
        </div>

        {/* Fecha de Vencimiento */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Fecha de Vencimiento</h2>
          <p className={`text-xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {formatDate(invoice.due_date)}
          </p>
          {isOverdue && (
            <p className="text-xs text-red-600 mt-1">
              Vencida hace {Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} días
            </p>
          )}
        </div>
      </div>

      {/* Información del Cliente */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">👤 Cliente</h2>
        {invoice.customer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-medium text-gray-900">
                {invoice.customer.first_name} {invoice.customer.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{invoice.customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-900">{invoice.customer.phone}</p>
            </div>
            {invoice.customer.address && (
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{invoice.customer.address}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información de Renta (si existe) */}
      {invoice.rental && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚗 Renta Asociada</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Código de Renta</p>
              <p className="font-medium text-gray-900">{invoice.rental.rental_code}</p>
            </div>
            {invoice.rental.vehicle && (
              <div>
                <p className="text-sm text-gray-500">Vehículo</p>
                <p className="font-medium text-gray-900">
                  {invoice.rental.vehicle.brand} {invoice.rental.vehicle.model}
                </p>
              </div>
            )}
            <div>
              <button
                onClick={() => navigate(`/rentals/${invoice.rental_id}`)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Ver Detalle de Renta →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalles Financieros */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 Detalles Financieros</h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.tax_amount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                IVA ({((invoice.tax_amount / invoice.subtotal) * 100).toFixed(0)}%)
              </span>
              <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
            </div>
          )}

          {invoice.discount_amount && invoice.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-{formatCurrency(invoice.discount_amount)}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="text-lg font-bold">Total</span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(invoice.total_amount)}
            </span>
          </div>

          {invoice.paid_amount && invoice.paid_amount > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Pagado</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-bold">Saldo Pendiente</span>
                <span className={`text-lg font-bold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Historial de Pagos */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💳 Historial de Pagos</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.payments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {payment.payment_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                      {payment.payment_method === 'cash' && '💵 Efectivo'}
                      {payment.payment_method === 'card' && '💳 Tarjeta'}
                      {payment.payment_method === 'bank_transfer' && '🏦 Transferencia'}
                      {payment.payment_method === 'check' && '📝 Cheque'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Total Pagado:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-green-600">
                    {formatCurrency(invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Notas */}
      {invoice.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Notas</h2>
          <p className="text-gray-700">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
