/**
 * Vehicle Type → Icon + Color mapping for catalog visual system.
 * Maps VehicleType.name from the database to MUI icons with semantic colors.
 */
import {
  DirectionsCar,
  AirportShuttle,
  LocalShipping,
  TwoWheeler,
  Agriculture,
  Commute,
  ElectricCar,
  type SvgIconComponent,
} from '@mui/icons-material';

interface VehicleTypeVisual {
  Icon: SvgIconComponent;
  color: string;
  label: string;
}

const VEHICLE_TYPE_MAP: Record<string, VehicleTypeVisual> = {
  'Compacto':      { Icon: ElectricCar,    color: '#06b6d4', label: 'Compacto' },
  'Sedán':         { Icon: DirectionsCar,  color: '#3b82f6', label: 'Sedán' },
  'SUV':           { Icon: Commute,        color: '#10b981', label: 'SUV' },
  'Van Ejecutiva': { Icon: AirportShuttle, color: '#8b5cf6', label: 'Van' },
  'Premium':       { Icon: DirectionsCar,  color: '#f59e0b', label: 'Premium' },
  // Future types
  'Pickup':        { Icon: LocalShipping,  color: '#f97316', label: 'Pickup' },
  'Camión':        { Icon: Agriculture,    color: '#ef4444', label: 'Camión' },
  'Motocicleta':   { Icon: TwoWheeler,     color: '#ec4899', label: 'Moto' },
};

const DEFAULT_VISUAL: VehicleTypeVisual = {
  Icon: DirectionsCar,
  color: '#6b7280',
  label: 'Vehículo',
};

/**
 * Get the icon component, color, and label for a vehicle type name.
 * Falls back to DirectionsCar + gray for unknown types.
 */
export const getVehicleTypeVisual = (typeName?: string): VehicleTypeVisual => {
  if (!typeName) return DEFAULT_VISUAL;
  return VEHICLE_TYPE_MAP[typeName] || DEFAULT_VISUAL;
};

export default getVehicleTypeVisual;
