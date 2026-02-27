/**
 * Tipos para el módulo de Facturas (CHAT 2)
 */

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export interface Invoice {
  id: number;
  invoice_code: string;
  rental_id: number;
  customer_id: number;
  issue_date: Date | string;
  due_date: Date | string;
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  total_amount: number;
  paid_amount?: number;
  balance: number;
  status: InvoiceStatus;
  notes?: string;
  pdf_url?: string;
  created_by?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relaciones
  customer?: {
    id: number;
    name: string;
    contact_person?: string;
    email: string;
    phone?: string;
    address?: string;
  };
  rental?: {
    id: number;
    rental_code: string;
    start_date: string;
    end_date: string;
    vehicle?: {
      make: string;
      model: string;
      license_plate: string;
    };
  };
  payments?: Array<{
    id: number;
    payment_code: string;
    amount: number;
    payment_method: string;
    transaction_date: string;
    status: string;
  }>;
}

export interface CreateInvoiceDTO {
  rental_id: number;
  customer_id: number;
  due_days?: number;
  notes?: string;
}

export interface InvoiceFilters {
  customer_id?: number;
  rental_id?: number;
  location_id?: number;
  status?: InvoiceStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface SingleInvoiceResponse {
  success: boolean;
  data: Invoice;
  message?: string;
}

export interface OverdueInvoicesResponse {
  success: boolean;
  data: {
    total: number;
    invoices: Invoice[];
  };
}
