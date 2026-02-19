/**
 * Componente ReturnPenaltySummary - Panel lateral de resumen de cargos
 * Muestra preview en tiempo real de penalidades y reembolsos
 */
import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { PenaltyCalculation } from '../../hooks/useReturnForm';

interface ReturnPenaltySummaryProps {
  penaltyCalculation: PenaltyCalculation | null;
  dailyRate: number;
  isDarkMode: boolean;
}

const ReturnPenaltySummary: React.FC<ReturnPenaltySummaryProps> = ({
  penaltyCalculation,
  dailyRate,
  isDarkMode
}) => {
  const { formatCurrency } = useCurrency();

  if (!penaltyCalculation) return null;

  return (
    <div className={`rounded-lg shadow-lg p-6 sticky top-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
      <h2 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Resumen de Cargos
      </h2>

      <div className="space-y-4">
        {/* Estado de devolucion */}
        <div className={`p-3 rounded-lg ${penaltyCalculation.isOnTime
          ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-100')
          : (isDarkMode ? 'bg-red-900/30' : 'bg-red-100')}`}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {penaltyCalculation.isOnTime ? 'A tiempo' : 'Devolucion tardia'}
            </span>
            {!penaltyCalculation.isOnTime && (
              <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                {penaltyCalculation.daysLate} dia{penaltyCalculation.daysLate > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Desglose de cargos */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tarifa diaria:</span>
            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(dailyRate)}
            </span>
          </div>

          {penaltyCalculation.daysLate > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Penalidad retraso (1.5x):</span>
              <span className="font-bold">+{formatCurrency(penaltyCalculation.lateFee)}</span>
            </div>
          )}

          {penaltyCalculation.cleaningCost > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Limpieza profunda:</span>
              <span className="font-bold">+{formatCurrency(penaltyCalculation.cleaningCost)}</span>
            </div>
          )}

          {penaltyCalculation.damageCost > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Reparacion de danos:</span>
              <span className="font-bold">+{formatCurrency(penaltyCalculation.damageCost)}</span>
            </div>
          )}
        </div>

        <div className={`border-t pt-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex justify-between text-lg font-bold">
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total Penalidades:</span>
            <span className="text-red-600">
              {formatCurrency(penaltyCalculation.totalPenalty)}
            </span>
          </div>
        </div>

        {/* Calculo de deposito */}
        {penaltyCalculation.depositAmount > 0 && (
          <div className={`border-t pt-3 rounded-lg p-3 -mx-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between text-sm mb-2">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Deposito original:</span>
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(penaltyCalculation.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Menos penalidades:</span>
              <span className="font-medium text-red-600">-{formatCurrency(penaltyCalculation.totalPenalty)}</span>
            </div>
            <div className={`flex justify-between text-lg font-bold border-t pt-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <span className="text-green-600">Reembolso:</span>
              <span className="text-green-600">
                {formatCurrency(penaltyCalculation.depositRefund)}
              </span>
            </div>
            {penaltyCalculation.depositRefund === 0 && penaltyCalculation.totalPenalty > penaltyCalculation.depositAmount && (
              <p className="text-xs text-red-600 mt-2">
                Las penalidades exceden el deposito. El cliente debe pagar {formatCurrency(penaltyCalculation.totalPenalty - penaltyCalculation.depositAmount)} adicional.
              </p>
            )}
          </div>
        )}

        {/* Mensaje informativo */}
        <div className={`rounded-lg p-3 text-xs ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
          <strong>Nota:</strong> Este calculo es preliminar. Los montos finales se confirmaran al procesar la devolucion.
        </div>
      </div>
    </div>
  );
};

export default ReturnPenaltySummary;
