export type PriceType = 'per_day' | 'fixed';
export type ServiceCategory = 'accessory' | 'insurance' | 'service';

export interface ExtraService {
  id: number;
  name: string;
  description?: string;
  price: number;
  price_type: PriceType;
  category: ServiceCategory;
  is_active: boolean;
  vehicle_type_id?: number;
  location_id?: number;
  created_at?: string;
  updated_at?: string;
  vehicleType?: {
    id: number;
    name: string;
  };
  location?: {
    id: number;
    name: string;
    city: string;
  };
}

export interface RentalService {
  id: number;
  rental_id: number;
  extra_service_id: number;
  quantity: number;
  unit_price: number;
  days: number;
  subtotal: number;
  created_at?: string;
  extraService?: ExtraService;
}

export interface CreateExtraServiceDto {
  name: string;
  description?: string;
  price: number;
  price_type: PriceType;
  category: ServiceCategory;
  vehicle_type_id?: number;
  location_id?: number;
}

export interface UpdateExtraServiceDto {
  name?: string;
  description?: string;
  price?: number;
  price_type?: PriceType;
  category?: ServiceCategory;
  is_active?: boolean;
  vehicle_type_id?: number | null;
  location_id?: number | null;
}

export interface ExtraServiceFilters {
  category?: ServiceCategory;
  vehicle_type_id?: number;
  location_id?: number;
  is_active?: boolean;
}

// For rental form - selected services
export interface SelectedService {
  extra_service_id: number;
  quantity: number;
  unit_price: number;
  days: number;
  subtotal: number;
  service?: ExtraService;
}

// Grouped services by category
export interface ServicesByCategory {
  accessory: ExtraService[];
  insurance: ExtraService[];
  service: ExtraService[];
}
