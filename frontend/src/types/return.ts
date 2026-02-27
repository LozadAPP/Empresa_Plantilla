/**
 * Tipos para el módulo de Devoluciones (CHAT 2)
 */

export enum VehicleCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged'
}

export interface Return {
  id: number;
  return_code: string;
  rental_id: number;
  vehicle_id: number;
  return_date: Date | string;
  return_location_id: number;
  end_mileage: number;
  fuel_level: string;
  vehicle_condition: VehicleCondition;
  is_on_time: boolean;
  days_late?: number;
  late_fee?: number;
  damage_description?: string;
  damage_cost?: number;
  cleaning_required: boolean;
  cleaning_cost?: number;
  total_penalty?: number;
  inspected_by?: number;
  inspection_notes?: string;
  photos?: string[];
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relaciones
  rental?: {
    id: number;
    rental_code: string;
    customer_id: number;
    vehicle_id: number;
  };
  vehicle?: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
  };
}

export interface CreateReturnDTO {
  rental_id: number;
  return_date?: string;
  return_location_id?: number;
  end_mileage: number;
  fuel_level: string;
  vehicle_condition: VehicleCondition;
  damage_description?: string;
  damage_cost?: number;
  cleaning_required?: boolean;
  inspection_notes?: string;
  photos?: string[];
}

export interface UpdateReturnDTO {
  end_mileage?: number;
  fuel_level?: string;
  vehicle_condition?: VehicleCondition;
  damage_description?: string;
  damage_cost?: number;
  cleaning_required?: boolean;
  inspection_notes?: string;
  photos?: string[];
}

export interface ReturnPenalty {
  is_on_time: boolean;
  days_late: number;
  late_fee: number;
  cleaning_cost: number;
  damage_cost: number;
  total_penalty: number;
}

export interface ReturnResponse {
  success: boolean;
  data: {
    returns: Return[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleReturnResponse {
  success: boolean;
  data: Return;
  penalties?: ReturnPenalty;
  message?: string;
}
