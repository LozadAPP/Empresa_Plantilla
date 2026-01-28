/**
 * Componente DamageSection - Seccion de danos y costos adicionales
 * Maneja seleccion de tipo de dano, descripcion, costo y fotos
 */
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { DAMAGE_CATALOG } from '../../constants/damages';

interface DamageSectionProps {
  selectedDamageType: string;
  damageDescription: string;
  damageCost: number;
  photos: string[];
  isDarkMode: boolean;
  onDamageTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCostChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
}

const DamageSection: React.FC<DamageSectionProps> = ({
  selectedDamageType,
  damageDescription,
  damageCost,
  photos,
  isDarkMode,
  onDamageTypeChange,
  onDescriptionChange,
  onCostChange,
  onPhotoUpload,
  onRemovePhoto
}) => {
  const inputStyles = `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const labelStyles = `block text-sm font-medium mb-2 ${
    isDarkMode ? 'text-gray-300' : 'text-gray-700'
  }`;

  return (
    <div className="mb-6">
      <h2 className={`text-lg font-semibold mb-4 border-b pb-2 ${
        isDarkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'
      }`}>
        Danos y Costos Adicionales
      </h2>

      {/* Tipo de Dano Predefinido */}
      <div className="mb-4">
        <label className={labelStyles}>
          Tipo de Dano
        </label>
        <select
          value={selectedDamageType}
          onChange={onDamageTypeChange}
          className={inputStyles}
        >
          <option value="">Sin danos</option>
          {DAMAGE_CATALOG.map(damage => (
            <option key={damage.value} value={damage.value}>
              {damage.label} {damage.cost > 0 ? `(~${formatCurrency(damage.cost)})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedDamageType && (
        <>
          {/* Descripcion de Danos */}
          <div className="mb-4">
            <label className={labelStyles}>
              Descripcion Detallada
            </label>
            <textarea
              name="damage_description"
              value={damageDescription}
              onChange={onDescriptionChange}
              rows={3}
              className={inputStyles}
              placeholder="Describe el dano en detalle..."
            />
          </div>

          {/* Costo de Reparacion */}
          <div className="mb-4">
            <label className={labelStyles}>
              Costo de Reparacion
            </label>
            <input
              type="number"
              name="damage_cost"
              value={damageCost}
              onChange={onCostChange}
              min="0"
              step="0.01"
              disabled={selectedDamageType !== 'custom'}
              className={`${inputStyles} ${
                selectedDamageType !== 'custom'
                  ? (isDarkMode ? 'disabled:bg-gray-600' : 'disabled:bg-gray-100')
                  : ''
              }`}
            />
          </div>

          {/* Upload de Fotos */}
          <div className="mb-4">
            <label className={labelStyles}>
              Fotos de Danos
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPhotoUpload}
              className={inputStyles}
            />

            {/* Preview de fotos */}
            {photos && photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Dano ${index + 1}`}
                      className={`w-full h-24 object-cover rounded border ${
                        isDarkMode ? 'border-gray-600' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Eliminar foto ${index + 1}`}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DamageSection;
