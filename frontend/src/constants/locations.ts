/**
 * Constantes de ubicaciones para MOVICAR
 * TODO: Reemplazar con datos del backend cuando esté disponible
 */

export interface Location {
  id: number;
  name: string;
  city: string;
  address: string;
}

/**
 * Ubicaciones dummy para desarrollo
 * Se reemplazarán con llamada al API de locations
 */
export const DUMMY_LOCATIONS: Location[] = [
  { id: 1, name: 'Sucursal CDMX Norte', city: 'Ciudad de México', address: 'Av. Insurgentes Norte 1234' },
  { id: 2, name: 'Sucursal CDMX Sur', city: 'Ciudad de México', address: 'Av. Universidad 5678' },
  { id: 3, name: 'Sucursal Guadalajara', city: 'Guadalajara', address: 'Av. Chapultepec 910' },
  { id: 4, name: 'Sucursal Monterrey', city: 'Monterrey', address: 'Av. Constitución 1112' },
  { id: 5, name: 'Sucursal Cancún', city: 'Cancún', address: 'Blvd. Kukulcán 1314' }
];

/**
 * Obtiene el nombre de una ubicación por ID
 */
export const getLocationName = (id: number | undefined): string => {
  if (!id) return 'Ubicación no especificada';
  const location = DUMMY_LOCATIONS.find(l => l.id === id);
  return location?.name || 'Ubicación desconocida';
};

/**
 * Obtiene la dirección de una ubicación por ID
 */
export const getLocationAddress = (id: number | undefined): string => {
  if (!id) return '';
  const location = DUMMY_LOCATIONS.find(l => l.id === id);
  return location?.address || '';
};

/**
 * Obtiene una ubicación completa por ID
 */
export const getLocationById = (id: number | undefined): Location | undefined => {
  if (!id) return undefined;
  return DUMMY_LOCATIONS.find(l => l.id === id);
};
