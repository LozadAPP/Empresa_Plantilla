/**
 * Tipos para el módulo de Rentas (CHAT 2)
 */

export enum RentalStatus {
  PENDING_APPROVAL = 'pending_approval',  // Requiere aprobación de supervisor
  RESERVED = 'reserved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TRANSFER = 'transfer',
  CHECK = 'check'
}

export interface Rental {
  id: number;
  rental_code: string;
  customer_id: number;
  vehicle_id: number;
  location_id: number;
  return_location_id?: number;
  start_date: Date | string;
  end_date: Date | string;
  actual_return_date?: Date | string;
  days: number;
  daily_rate: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  insurance_amount?: number;
  extras_amount?: number;
  total_amount: number;
  deposit_amount?: number;
  shipping_cost?: number;
  price_adjustment?: number;
  adjustment_reason?: string;
  // Campos de aprobación
  approved_by?: number;
  approved_at?: Date | string;
  rejection_reason?: string;
  payment_method?: PaymentMethod;
  status: RentalStatus;
  created_by?: number;
  start_mileage?: number;
  end_mileage?: number;
  fuel_level_start?: string;
  fuel_level_end?: string;
  notes?: string;
  contract_url?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relaciones (cuando se incluyen en el GET)
  customer?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    customer_type?: 'individual' | 'corporate' | 'government';
  };
  vehicle?: {
    id: number;
    license_plate: string;
    make: string;
    model: string;
    year: number;
    color?: string;
    daily_rate: number;
  };
  // Relaciones adicionales (cuando se incluyen con include)
  invoice?: {
    id: number;
    invoice_code: string;
    total_amount: number;
    status: string;
  };
  payments?: {
    id: number;
    payment_code: string;
    amount: number;
    payment_method: string;
    transaction_date: Date | string;
    status: string;
  }[];
  return?: {
    id: number;
    return_code: string;
    return_date: Date | string;
    end_mileage: number;
    fuel_level: string;
    vehicle_condition: string;
    is_on_time: boolean;
    days_late?: number;
    late_fee?: number;
    damage_description?: string;
    damage_cost?: number;
    cleaning_cost?: number;
    total_penalty?: number;
    inspection_notes?: string;
  };
}

export interface CreateRentalDTO {
  customer_id: number;
  vehicle_id: number;
  location_id: number;
  return_location_id?: number;
  start_date: string;
  end_date: string;
  daily_rate?: number;
  tax_percentage?: number;
  discount_percentage?: number;
  insurance_amount?: number;
  extras_amount?: number;
  deposit_amount?: number;
  shipping_cost?: number;
  price_adjustment?: number;
  adjustment_reason?: string;
  payment_method?: PaymentMethod;
  start_mileage?: number;
  fuel_level_start?: string;
  notes?: string;
}

export interface UpdateRentalDTO {
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  discount_percentage?: number;
  insurance_amount?: number;
  extras_amount?: number;
  shipping_cost?: number;
  price_adjustment?: number;
  adjustment_reason?: string;
  notes?: string;
}

export interface RentalFilters {
  status?: RentalStatus;
  customer_id?: number;
  vehicle_id?: number;
  location_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface RentalPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RentalResponse {
  success: boolean;
  data: {
    rentals: Rental[];
    pagination: RentalPagination;
  };
}

export interface SingleRentalResponse {
  success: boolean;
  data: Rental;
  message?: string;
}
