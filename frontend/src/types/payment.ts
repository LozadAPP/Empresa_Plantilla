/**
 * Tipos para el módulo de Pagos (CHAT 2)
 */

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  RENTAL_PAYMENT = 'rental_payment',
  PENALTY = 'penalty',
  REFUND = 'refund'
}

export interface Payment {
  id: number;
  payment_code: string;
  rental_id?: number;
  invoice_id?: number;
  customer_id: number;
  amount: number;
  payment_method: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  reference_number?: string;
  transaction_date: Date | string;
  notes?: string;
  processed_by?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relaciones
  customer?: {
    id: number;
    name: string;
    contact_person?: string;
    email: string;
  };
  rental?: {
    id: number;
    rental_code: string;
  };
  invoice?: {
    id: number;
    invoice_code: string;
  };
}

export interface CreatePaymentDTO {
  rental_id?: number;
  invoice_id?: number;
  customer_id: number;
  amount: number;
  payment_method: string;
  payment_type: PaymentType;
  reference_number?: string;
  transaction_date?: string;
  notes?: string;
}

export interface PaymentFilters {
  customer_id?: number;
  rental_id?: number;
  location_id?: number;
  status?: PaymentStatus;
  payment_type?: PaymentType;
  payment_method?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaymentResponse {
  success: boolean;
  data: {
    payments: Payment[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SinglePaymentResponse {
  success: boolean;
  data: Payment;
  message?: string;
}
