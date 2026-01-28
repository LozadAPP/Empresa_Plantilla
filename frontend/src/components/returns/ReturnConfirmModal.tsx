/**
 * Componente ReturnConfirmModal - Modal de confirmacion de devolucion
 * Muestra resumen completo antes de procesar la devolucion
 */
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { CreateReturnDTO } from '../../types/return';
import { PenaltyCalculation } from '../../hooks/useReturnForm';
import { FUEL_LEVEL_LABELS } from '../../constants/statusColors';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  loading: boolean;
  rental: any;
  formData: CreateReturnDTO;
  penaltyCalculation: PenaltyCalculation;
  isDarkMode: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ReturnConfirmModal: React.FC<ReturnConfirmModalProps> = ({
  isOpen,
  loading,
  rental,
  formData,
  penaltyCalculation,
  isDarkMode,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const getFuelLevelLabel = (level: string) => FUEL_LEVEL_LABELS[level] || level;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold text-center">Confirmar Devolucion</h2>
          <p className="text-center text-blue-100 mt-1">Revisa cuidadosamente los datos antes de proceder</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informacion de Renta */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Informacion de Renta
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Codigo:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {rental.rental_code}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Vehiculo:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {rental.vehicle?.brand} {rental.vehicle?.model}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Cliente:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {rental.customer?.first_name} {rental.customer?.last_name}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Placa:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {rental.vehicle?.plate}
                </span>
              </div>
            </div>
          </div>

          {/* Condiciones del Vehiculo */}
          <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Condiciones del Vehiculo
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Kilometraje:</span>
                <span className="ml-2 font-bold text-blue-600">
                  {rental.start_mileage} km → {formData.end_mileage} km
                </span>
                <span className={`ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  (+{formData.end_mileage - (rental.start_mileage || 0)} km)
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Combustible:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getFuelLevelLabel(rental.fuel_level_start || 'full')} → {getFuelLevelLabel(formData.fuel_level)}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Condicion:</span>
                <span className={`ml-2 font-medium capitalize ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formData.vehicle_condition}
                </span>
              </div>
              <div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Limpieza:</span>
                <span className={`ml-2 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formData.cleaning_required ? 'Requerida' : 'OK'}
                </span>
              </div>
            </div>
          </div>

          {/* Danos */}
          {formData.damage_cost && formData.damage_cost > 0 && (
            <div className={`rounded-lg p-4 border ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-900'}`}>
                Danos Reportados
              </h3>
              <p className={`text-sm mb-1 ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                {formData.damage_description}
              </p>
              <p className="text-sm font-bold text-red-600">
                Costo de reparacion: {formatCurrency(formData.damage_cost)}
              </p>
              {formData.photos && formData.photos.length > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  {formData.photos.length} foto(s) adjunta(s)
                </p>
              )}
            </div>
          )}

          {/* Estado de Tiempo */}
          <div className={`rounded-lg p-4 border ${penaltyCalculation.isOnTime
            ? (isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
            : (isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')}`}>
            <h3 className={`font-semibold mb-2 ${penaltyCalculation.isOnTime
              ? (isDarkMode ? 'text-green-400' : 'text-green-900')
              : (isDarkMode ? 'text-yellow-400' : 'text-yellow-900')}`}>
              {penaltyCalculation.isOnTime ? 'Devolucion a Tiempo' : 'Devolucion Tardia'}
            </h3>
            {!penaltyCalculation.isOnTime && (
              <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                <strong>{penaltyCalculation.daysLate}</strong> dia(s) de retraso -
                Penalizacion: <strong>{formatCurrency(penaltyCalculation.lateFee)}</strong>
              </p>
            )}
          </div>

          {/* Resumen Financiero */}
          <div className={`rounded-lg p-4 border ${isDarkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Resumen Financiero
            </h3>
            <div className="space-y-2 text-sm">
              {penaltyCalculation.lateFee > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Penalidad por retraso:</span>
                  <span className="font-medium text-red-600">+{formatCurrency(penaltyCalculation.lateFee)}</span>
                </div>
              )}
              {penaltyCalculation.cleaningCost > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Limpieza profunda:</span>
                  <span className="font-medium text-orange-600">+{formatCurrency(penaltyCalculation.cleaningCost)}</span>
                </div>
              )}
              {penaltyCalculation.damageCost > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Reparacion de danos:</span>
                  <span className="font-medium text-red-600">+{formatCurrency(penaltyCalculation.damageCost)}</span>
                </div>
              )}
              <div className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Total Penalidades:</span>
                <span className="font-bold text-red-600">{formatCurrency(penaltyCalculation.totalPenalty)}</span>
              </div>
              {penaltyCalculation.depositAmount > 0 && (
                <>
                  <div className={`flex justify-between text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span>Deposito original:</span>
                    <span>{formatCurrency(penaltyCalculation.depositAmount)}</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                    <span className="font-bold text-green-600">Reembolso al cliente:</span>
                    <span className="font-bold text-green-600">{formatCurrency(penaltyCalculation.depositRefund)}</span>
                  </div>
                </>
              )}
            </div>
            {penaltyCalculation.totalPenalty > penaltyCalculation.depositAmount && (
              <div className={`mt-3 p-2 rounded text-xs ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'}`}>
                El cliente debe pagar {formatCurrency(penaltyCalculation.totalPenalty - penaltyCalculation.depositAmount)} adicional
              </div>
            )}
          </div>

          {/* Notas */}
          {formData.inspection_notes && (
            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Notas de Inspeccion
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formData.inspection_notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className={`px-6 py-4 rounded-b-lg flex justify-end space-x-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2 border rounded-lg font-medium ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Revisar Datos
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Confirmar Devolucion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnConfirmModal;
