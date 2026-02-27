/**
 * Tipos para el módulo de Cotizaciones
 */

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CONVERTED = 'converted'
}

export interface Quote {
  id: number;
  quote_code: string;
  customer_id: number;
  vehicle_id?: number;
  location_id?: number;

  start_date?: Date | string;
  end_date?: Date | string;
  days?: number;

  daily_rate?: number;
  subtotal: number;
  discount_percentage?: number;
  discount_amount?: number;
  insurance_amount?: number;
  extras_amount?: number;
  shipping_cost?: number;
  tax_percentage: number;
  tax_amount: number;
  total_amount: number;
  deposit_amount?: number;

  status: QuoteStatus;
  valid_until: Date | string;

  converted_rental_id?: number;

  notes?: string;
  customer_notes?: string;
  pdf_url?: string;
  created_by?: number;
  created_at?: Date | string;
  updated_at?: Date | string;

  // Relaciones
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
  location?: {
    id: number;
    name: string;
  };
  convertedRental?: {
    id: number;
    rental_code: string;
    status: string;
  };
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateQuoteDTO {
  customer_id: number;
  vehicle_id?: number;
  location_id?: number;
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  tax_percentage?: number;
  discount_percentage?: number;
  insurance_amount?: number;
  extras_amount?: number;
  shipping_cost?: number;
  deposit_amount?: number;
  valid_days?: number;
  notes?: string;
}

export interface UpdateQuoteDTO {
  customer_id?: number;
  vehicle_id?: number;
  location_id?: number;
  start_date?: string;
  end_date?: string;
  daily_rate?: number;
  tax_percentage?: number;
  discount_percentage?: number;
  insurance_amount?: number;
  extras_amount?: number;
  shipping_cost?: number;
  deposit_amount?: number;
  notes?: string;
}

export interface QuoteFilters {
  status?: QuoteStatus;
  customer_id?: number;
  vehicle_id?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface QuotePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface QuoteResponse {
  success: boolean;
  data: {
    quotes: Quote[];
    pagination: QuotePagination;
  };
}

export interface SingleQuoteResponse {
  success: boolean;
  data: Quote;
  message?: string;
}

export interface ConvertQuoteResponse {
  success: boolean;
  message: string;
  data: {
    quote: Quote;
    rental: any;
  };
}
