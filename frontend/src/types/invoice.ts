/**
 * Tipos para el módulo de Facturas (CHAT 2) + CFDI 4.0 (Sprint 3)
 */

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export type CfdiStatus = 'pending_stamp' | 'stamped' | 'cancelled' | 'error';

export interface InvoiceLineItem {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  discount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  satProductCode: string;
  sortOrder: number;
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
  // CFDI fields
  uuid?: string;
  serie?: string;
  folio?: number;
  cfdi_version?: string;
  cfdi_status?: CfdiStatus;
  uso_cfdi?: string;
  payment_form_code?: string;
  payment_method_code?: string;
  currency_code?: string;
  exchange_rate?: number;
  stamp_date?: Date | string;
  cancel_date?: Date | string;
  cancel_reason?: string;
  xml_url?: string;
  qr_data?: string;
  lineItems?: InvoiceLineItem[];
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
    rfc?: string;
    regimen_fiscal?: string;
    zip_code?: string;
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
  // CFDI fields
  uso_cfdi?: string;
  payment_form_code?: string;
  payment_method_code?: string;
  currency_code?: string;
  exchange_rate?: number;
  line_items?: Array<{
    description: string;
    quantity: number;
    unit_code?: string;
    unit_price: number;
    discount?: number;
    subtotal: number;
    tax_rate?: number;
    tax_amount: number;
    total: number;
    sat_product_code?: string;
  }>;
}

export interface InvoiceFilters {
  customer_id?: number;
  rental_id?: number;
  location_id?: number;
  status?: InvoiceStatus;
  cfdi_status?: CfdiStatus;
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
