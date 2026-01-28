// Accounting Types
export interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  parentAccountId?: number;
  balance: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  parentAccount?: Account;
  subAccounts?: Account[];
}

export interface Transaction {
  id: number;
  transactionCode: string;
  transactionType: 'income' | 'expense' | 'transfer';
  accountId: number;
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  transactionDate: Date;
  status: 'pending' | 'completed' | 'cancelled';
  locationId?: number;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  account?: Account;
  location?: {
    id: number;
    name: string;
    city: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  approver?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateTransactionDto {
  transactionType: 'income' | 'expense' | 'transfer';
  accountId: number;
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  transactionDate?: string | Date;
  locationId?: number;
  notes?: string;
}

export interface BalanceSheet {
  assets: {
    accounts: Account[];
    total: number;
  };
  liabilities: {
    accounts: Account[];
    total: number;
  };
  equity: {
    accounts: Account[];
    total: number;
  };
  balanceCheck: boolean;
}

export interface IncomeStatement {
  income: {
    transactions: Transaction[];
    total: number;
  };
  expenses: {
    transactions: Transaction[];
    total: number;
  };
  netIncome: number;
}
