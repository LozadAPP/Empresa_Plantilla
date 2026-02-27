export type SupplierType = 'services' | 'products' | 'both';

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  rfc?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  supplier_type: SupplierType;
  category?: string;
  bank_name?: string;
  bank_account?: string;
  clabe?: string;
  payment_terms: number;
  credit_limit: number;
  is_active: boolean;
  rating?: number;
  notes?: string;
  created_by: number;
  creator?: { id: number; firstName: string; lastName: string };
  expenses_count?: number;
  maintenance_count?: number;
  total_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierFilters {
  supplier_type?: SupplierType;
  category?: string;
  is_active?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SupplierDropdown {
  id: number;
  name: string;
  rfc?: string;
  supplierType?: SupplierType;
  supplierCode?: string;
}

export interface SupplierStats {
  total: number;
  active: number;
  inactive: number;
  byType: { services: number; products: number; both: number };
  topBySpending: { id: number; name: string; supplier_code: string; total_spent: number }[];
}
