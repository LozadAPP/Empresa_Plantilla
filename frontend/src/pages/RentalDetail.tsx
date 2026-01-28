/**
 * Detalle de Renta (CHAT 2) - VERSIÓN MEJORADA
 * Cambios: Condiciones iniciales, info de devolución, payment status, locations
 */
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme as useMuiTheme } from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { fetchRentalById } from '../store/slices/rentalSlice';
import { formatDate, formatCurrency, safeNumber } from '../utils/formatters';
import { getLocationById } from '../constants/locations';
import { FUEL_LEVEL_LABELS } from '../constants/statusColors';

const RentalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const muiTheme = useMuiTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';

  const { selectedRental: rental, loading } = useSelector((state: RootState) => state.rentals);

  useEffect(() => {
    const numericId = Number(id);
    if (id && !Number.isNaN(numericId) && numericId > 0) {
      dispatch(fetchRentalById(numericId));
    } else if (id) {
      // ID inválido - redirigir a lista de rentas
      navigate('/rentals');
    }
  }, [dispatch, id, navigate]);

  // Función helper para etiquetas de combustible
  const getFuelLevelLabel = (level: string) => FUEL_LEVEL_LABELS[level] || level;

  if (loading || !rental) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const canRegisterReturn = rental.status === 'active';
  const pickupLocation = getLocationById(rental.location_id);
  const returnLocation = getLocationById(rental.return_location_id || rental.location_id);
  const hasReturn = rental.status === 'completed' || rental.return !== undefined;

  // Calcular balance desde los pagos relacionados (con validación segura)
  const paidAmount = (rental.payments || []).reduce((sum, payment) => sum + safeNumber(payment.amount), 0);
  const balance = safeNumber(rental.total_amount) - paidAmount;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.rental_code}</h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detalle de la renta</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/rentals')}
            className={`px-4 py-2 border rounded-lg ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Volver
          </button>
          {!rental.invoice && (
            <button
              onClick={() => navigate(`/invoices/new?rental=${rental.id}`)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
              title="Generar factura para esta renta"
            >
              📄 Generar Factura
            </button>
          )}
          {canRegisterReturn && (
            <button
              onClick={() => navigate(`/returns/new?rental=${rental.id}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Registrar Devolución
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Cliente */}
        <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cliente</h2>
          {rental.customer && (
            <div className="space-y-3">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nombre</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.customer.first_name} {rental.customer.last_name}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.customer.email}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Teléfono</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.customer.phone}</p>
              </div>
            </div>
          )}
        </div>

        {/* Información del Vehículo */}
        <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Vehículo</h2>
          {rental.vehicle && (
            <div className="space-y-3">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vehículo</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.vehicle.brand} {rental.vehicle.model}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Placa</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.vehicle.plate}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Año</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.vehicle.year}</p>
              </div>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Estado</h2>
          <div className="space-y-3">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estado actual</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'}`}>
                {rental.status}
              </span>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Creado</p>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.created_at && formatDate(rental.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ UBICACIONES */}
      <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📍 Ubicaciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Recogida en:</p>
            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{pickupLocation?.name || 'N/A'}</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{pickupLocation?.address}</p>
          </div>
          <div>
            <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Devolución en:</p>
            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{returnLocation?.name || 'Misma sucursal'}</p>
            {returnLocation && rental.return_location_id !== rental.location_id && (
              <>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{returnLocation.address}</p>
                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>One-way rental</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detalles de la Renta */}
      <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Detalles de la Renta</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de Inicio</p>
            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(rental.start_date)}</p>
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de Fin</p>
            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatDate(rental.end_date)}</p>
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Días</p>
            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.days} días</p>
          </div>
        </div>
      </div>

      {/* ✅ CONDICIONES INICIALES */}
      <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>🚗 Condiciones Iniciales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kilometraje Inicial</p>
            <p className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {rental.start_mileage !== null && rental.start_mileage !== undefined ? `${rental.start_mileage} km` : 'N/A'}
            </p>
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Combustible Inicial</p>
            <p className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getFuelLevelLabel(rental.fuel_level_start || 'full')}</p>
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Depósito de Garantía</p>
            <p className={`font-bold text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{rental.deposit_amount ? formatCurrency(rental.deposit_amount) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Montos */}
      <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Montos</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tarifa diaria</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(rental.daily_rate)}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal ({rental.days} días)</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(rental.subtotal)}</span>
          </div>
          {rental.insurance_amount && rental.insurance_amount > 0 && (
            <div className="flex justify-between">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Seguro</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(rental.insurance_amount)}</span>
            </div>
          )}
          {rental.discount_amount && rental.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento ({rental.discount_percentage}%)</span>
              <span>-{formatCurrency(rental.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>IVA ({rental.tax_percentage}%)</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(rental.tax_amount)}</span>
          </div>
          <div className={`flex justify-between pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(rental.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* ✅ ESTADO DE PAGOS */}
      <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>💳 Estado de Pagos</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total de renta:</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(rental.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Pagado:</span>
            <span className="text-green-600 font-medium">{formatCurrency(paidAmount)}</span>
          </div>
          <div className={`flex justify-between font-bold border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Saldo Pendiente:</span>
            <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
              {formatCurrency(balance)}
            </span>
          </div>
          {rental.deposit_amount && rental.deposit_amount > 0 && (
            <div className={`p-3 rounded mt-3 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Depósito:</span>
                <span className={`text-sm font-semibold ${paidAmount >= rental.deposit_amount ? 'text-green-600' : 'text-orange-600'}`}>
                  {paidAmount >= rental.deposit_amount ? '✅ Pagado' : '⚠️ Pendiente'} - {formatCurrency(rental.deposit_amount)}
                </span>
              </div>
            </div>
          )}
          {balance > 0 && (
            <button
              onClick={() => navigate(`/payments/new?rental=${rental.id}`)}
              className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              💳 Registrar Pago
            </button>
          )}
        </div>
      </div>

      {/* ✅ HISTORIAL DE PAGOS */}
      {rental.payments && rental.payments.length > 0 && (
        <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>💳 Historial de Pagos</h2>

          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Código
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Fecha
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Método
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tipo
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-600' : 'bg-white divide-gray-200'}`}>
                {rental.payments.map((payment: any) => (
                  <tr key={payment.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{payment.payment_code}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {payment.payment_date && formatDate(payment.payment_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`text-sm capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {payment.payment_method === 'cash' && '💵 Efectivo'}
                        {payment.payment_method === 'card' && '💳 Tarjeta'}
                        {payment.payment_method === 'bank_transfer' && '🏦 Transferencia'}
                        {payment.payment_method === 'check' && '📝 Cheque'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.payment_type === 'full'
                          ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                          : payment.payment_type === 'deposit'
                            ? (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800')
                            : payment.payment_type === 'balance'
                              ? (isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800')
                              : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {payment.payment_type === 'full' && 'Completo'}
                        {payment.payment_type === 'partial' && 'Parcial'}
                        {payment.payment_type === 'deposit' && 'Depósito'}
                        {payment.payment_type === 'balance' && 'Saldo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <td colSpan={4} className={`px-4 py-3 text-right text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total Pagado:
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-bold text-green-600">
                      {formatCurrency(rental.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {rental.payments.length === 0 && (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No hay pagos registrados para esta renta
            </div>
          )}
        </div>
      )}

      {/* ✅ INFORMACIÓN DE DEVOLUCIÓN */}
      {hasReturn && rental.return && (
        <div className={`mt-6 rounded-lg shadow-sm p-6 border ${isDarkMode ? 'bg-gray-800 border-green-800' : 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>✅ Información de Devolución</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fecha de Devolución */}
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de Devolución</p>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {rental.return.return_date && formatDate(rental.return.return_date)}
              </p>
              <p className={`text-sm mt-1 ${rental.return.is_on_time ? 'text-green-600' : 'text-red-600'}`}>
                {rental.return.is_on_time ? '✅ A tiempo' : `⚠️ ${rental.return.days_late} día(s) tarde`}
              </p>
            </div>

            {/* Kilometraje */}
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kilometraje Final</p>
              <p className="font-bold text-lg text-blue-600">
                {rental.return.end_mileage ? `${rental.return.end_mileage} km` : 'N/A'}
              </p>
              {rental.start_mileage && rental.return.end_mileage && (
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Recorridos: {rental.return.end_mileage - rental.start_mileage} km
                </p>
              )}
            </div>

            {/* Condición */}
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Condición del Vehículo</p>
              <p className={`font-bold text-lg capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {rental.return.vehicle_condition || 'N/A'}
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Combustible: {getFuelLevelLabel(rental.return.fuel_level || 'full')}
              </p>
            </div>
          </div>

          {/* Penalizaciones */}
          {(rental.return.total_penalty && rental.return.total_penalty > 0) && (
            <div className={`mt-4 rounded-lg p-4 border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-900'}`}>💰 Penalizaciones Aplicadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {rental.return.late_fee && rental.return.late_fee > 0 && (
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Retraso:</span>
                    <span className="ml-2 font-bold text-red-600">{formatCurrency(rental.return.late_fee)}</span>
                  </div>
                )}
                {rental.return.cleaning_cost && rental.return.cleaning_cost > 0 && (
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Limpieza:</span>
                    <span className="ml-2 font-bold text-orange-600">{formatCurrency(rental.return.cleaning_cost)}</span>
                  </div>
                )}
                {rental.return.damage_cost && rental.return.damage_cost > 0 && (
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Daños:</span>
                    <span className="ml-2 font-bold text-red-600">{formatCurrency(rental.return.damage_cost)}</span>
                  </div>
                )}
              </div>
              <div className={`mt-3 pt-3 border-t flex justify-between items-center ${isDarkMode ? 'border-yellow-700' : 'border-yellow-300'}`}>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Penalizaciones:</span>
                <span className="text-xl font-bold text-red-600">{formatCurrency(rental.return.total_penalty)}</span>
              </div>
            </div>
          )}

          {/* Daños */}
          {rental.return.damage_description && (
            <div className={`mt-4 rounded-lg p-4 border ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>🔧 Daños Reportados</h3>
              <p className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>{rental.return.damage_description}</p>
            </div>
          )}

          {/* Notas de Inspección */}
          {rental.return.inspection_notes && (
            <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📝 Notas de Inspección</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{rental.return.inspection_notes}</p>
            </div>
          )}
        </div>
      )}

      {rental.notes && (
        <div className={`mt-6 rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>📝 Notas</h2>
          <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{rental.notes}</p>
        </div>
      )}
    </div>
  );
};

export default RentalDetail;
