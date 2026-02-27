export type ExpenseCategory = 'operacion' | 'vehiculos' | 'financieros' | 'otros';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Expense {
  id: number;
  expense_code: string;
  category: ExpenseCategory;
  subcategory?: string;
  account_id?: number;
  account?: { id: number; accountCode: string; accountName: string };
  description: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method?: string;
  receipt_number?: string;
  receipt_url?: string;
  supplier_id?: number;
  supplier?: { id: number; supplierCode: string; name: string; rfc: string };
  supplier_name?: string;
  supplier_rfc?: string;
  expense_date: string;
  due_date?: string;
  is_recurring: boolean;
  recurrence_period?: string;
  reference_type?: string;
  reference_id?: number;
  transaction_id?: number;
  transaction?: { id: number; transactionCode: string; status: string };
  status: ExpenseStatus;
  location_id?: number;
  location?: { id: number; name: string };
  created_by: number;
  creator?: { id: number; firstName: string; lastName: string };
  approved_by?: number;
  approver?: { id: number; firstName: string; lastName: string };
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  start_date?: string;
  end_date?: string;
  location_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseSummary {
  byCategory: { category: string; count: number; total: number }[];
  pendingCount: number;
  pendingTotal: number;
  monthTotal: number;
  yearTotal: number;
}

export interface ExpenseCategoryConfig {
  category: string;
  label: string;
  subcategories: { name: string; label: string; accountId: number }[];
}
