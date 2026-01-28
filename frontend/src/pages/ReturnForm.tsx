/**
 * Formulario de Devolucion (CHAT 2) - VERSION REFACTORIZADA
 * Reducido de 805 lineas a ~250 mediante extraccion de componentes
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useReturnForm } from '../hooks/useReturnForm';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import { DUMMY_LOCATIONS } from '../constants/locations';
import { FUEL_LEVEL_LABELS } from '../constants/statusColors';
import {
  ReturnPenaltySummary,
  ReturnConfirmModal,
  DamageSection
} from '../components/returns';

const ReturnForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const rentalId = searchParams.get('rental');
  const { isDarkMode } = useCustomTheme();

  const {
    loading,
    rental,
    formData,
    selectedDamageType,
    showConfirmModal,
    penaltyCalculation,
    handleChange,
    handleDamageTypeChange,
    handlePhotoUpload,
    removePhoto,
    handleSubmit,
    confirmSubmit,
    handleCancel,
    closeConfirmModal
  } = useReturnForm({ rentalId });

  const getFuelLevelLabel = (level: string) => FUEL_LEVEL_LABELS[level] || level;

  const inputStyles = `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelStyles = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  const sectionHeaderStyles = `text-lg font-semibold mb-4 border-b pb-2 ${
    isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'
  }`;

  // Loading state
  if (!rental) {
    return (
      <div className={`flex items-center justify-center h-64 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Registrar Devolucion
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Renta: {rental.rental_code} - {rental.vehicle?.brand} {rental.vehicle?.model} ({rental.vehicle?.plate})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO (2 columnas) */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className={`rounded-lg shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>

            {/* SECCION 1: Informacion de Devolucion */}
            <div className="mb-6">
              <h2 className={sectionHeaderStyles}>
                Informacion de Devolucion
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha de Devolucion */}
                <div>
                  <label className={labelStyles}>Fecha de Devolucion *</label>
                  <input
                    type="datetime-local"
                    name="return_date"
                    value={formData.return_date}
                    onChange={handleChange}
                    required
                    className={inputStyles}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Esperada: {new Date(rental.end_date).toLocaleDateString('es-MX')}
                  </p>
                </div>

                {/* Sucursal de Devolucion */}
                <div>
                  <label className={labelStyles}>Sucursal de Devolucion *</label>
                  <select
                    name="return_location_id"
                    value={formData.return_location_id || ''}
                    onChange={handleChange}
                    required
                    className={inputStyles}
                  >
                    {DUMMY_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Recogida en: {DUMMY_LOCATIONS.find(l => l.id === rental.location_id)?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* SECCION 2: Condiciones del Vehiculo */}
            <div className="mb-6">
              <h2 className={sectionHeaderStyles}>
                Condiciones del Vehiculo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kilometraje Final */}
                <div>
                  <label className={labelStyles}>Kilometraje Final *</label>
                  <input
                    type="number"
                    name="end_mileage"
                    value={formData.end_mileage}
                    onChange={handleChange}
                    required
                    min={rental.start_mileage || 0}
                    className={inputStyles}
                  />
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Inicial: <strong>{rental.start_mileage || 'N/A'}</strong> km
                    {formData.end_mileage > 0 && rental.start_mileage && (
                      <span className="ml-2 text-blue-600">
                        (Recorridos: {formData.end_mileage - rental.start_mileage} km)
                      </span>
                    )}
                  </p>
                </div>

                {/* Nivel de Combustible */}
                <div>
                  <label className={labelStyles}>Nivel de Combustible Final *</label>
                  <select
                    name="fuel_level"
                    value={formData.fuel_level}
                    onChange={handleChange}
                    required
                    className={inputStyles}
                  >
                    <option value="empty">Vacio</option>
                    <option value="quarter">1/4</option>
                    <option value="half">1/2</option>
                    <option value="three_quarters">3/4</option>
                    <option value="full">Lleno</option>
                  </select>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Inicial: <strong>{getFuelLevelLabel(rental.fuel_level_start || 'full')}</strong>
                    {rental.fuel_level_start && formData.fuel_level !== rental.fuel_level_start && (
                      <span className="ml-2 text-orange-600">Diferente al inicial</span>
                    )}
                  </p>
                </div>

                {/* Condicion del Vehiculo */}
                <div>
                  <label className={labelStyles}>Condicion General *</label>
                  <select
                    name="vehicle_condition"
                    value={formData.vehicle_condition}
                    onChange={handleChange}
                    required
                    className={inputStyles}
                  >
                    <option value="excellent">Excelente</option>
                    <option value="good">Bueno</option>
                    <option value="fair">Regular</option>
                    <option value="poor">Malo</option>
                    <option value="damaged">Danado</option>
                  </select>
                </div>

                {/* Limpieza Requerida */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="cleaning_required"
                    checked={formData.cleaning_required}
                    onChange={handleChange}
                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${
                      isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300'
                    }`}
                  />
                  <label className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Requiere limpieza profunda (+{formatCurrency(50)})
                  </label>
                </div>
              </div>
            </div>

            {/* SECCION 3: Danos y Costos - Componente extraido */}
            <DamageSection
              selectedDamageType={selectedDamageType}
              damageDescription={formData.damage_description || ''}
              damageCost={formData.damage_cost || 0}
              photos={formData.photos || []}
              isDarkMode={isDarkMode}
              onDamageTypeChange={handleDamageTypeChange}
              onDescriptionChange={handleChange}
              onCostChange={handleChange}
              onPhotoUpload={handlePhotoUpload}
              onRemovePhoto={removePhoto}
            />

            {/* SECCION 4: Notas de Inspeccion */}
            <div className="mb-6">
              <h2 className={sectionHeaderStyles}>Notas de Inspeccion</h2>
              <textarea
                name="inspection_notes"
                value={formData.inspection_notes}
                onChange={handleChange}
                rows={4}
                className={inputStyles}
                placeholder="Observaciones generales de la inspeccion, condiciones especiales, comentarios del cliente, etc."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className={`px-6 py-2 border rounded-lg ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Registrando...' : 'Registrar Devolucion'}
              </button>
            </div>
          </form>
        </div>

        {/* PANEL DE PENALIDADES (1 columna) - Componente extraido */}
        <div className="lg:col-span-1">
          <ReturnPenaltySummary
            penaltyCalculation={penaltyCalculation}
            dailyRate={rental.daily_rate}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>

      {/* MODAL DE CONFIRMACION - Componente extraido */}
      {showConfirmModal && penaltyCalculation && (
        <ReturnConfirmModal
          isOpen={showConfirmModal}
          loading={loading}
          rental={rental}
          formData={formData}
          penaltyCalculation={penaltyCalculation}
          isDarkMode={isDarkMode}
          onConfirm={confirmSubmit}
          onClose={closeConfirmModal}
        />
      )}
    </div>
  );
};

export default ReturnForm;
