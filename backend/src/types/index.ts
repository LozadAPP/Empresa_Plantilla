import { Request } from 'express';

// User Types
export interface IUser {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location_id?: number;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IUserPayload {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  location_id?: number;
}

export interface AuthRequest extends Request {
  user?: IUserPayload;
}

// Role Types
export interface IRole {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  created_at: Date;
}

export type RoleName = 'admin' | 'director' | 'manager' | 'seller' | 'accountant' | 'inventory';

// Location Types
export interface ILocation {
  id: number;
  name: string;
  city: string;
  country: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: Date;
}

// Vehicle Types
export type VehicleStatus = 'available' | 'rented' | 'maintenance';
export type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';
export type TransmissionType = 'automatic' | 'manual';

export interface IVehicleType {
  id: number;
  name: string;
  description?: string;
  daily_rate: number;
}

export interface IVehicle {
  id: number;
  make: string;
  model: string;
  license_plate: string;
  vin: string;
  year: number;
  color?: string;
  vehicle_type_id: number;
  status: VehicleStatus;
  location_id: number;
  purchase_price: number;
  current_value: number;
  monthly_depreciation: number;
  mileage: number;
  fuel_type?: FuelType;
  transmission?: TransmissionType;
  purchase_date?: Date;
  insurance_expiry?: Date;
  next_maintenance?: Date;
  condition: VehicleCondition;
  created_at: Date;
  updated_at: Date;
}

// Customer Types
export type CustomerType = 'individual' | 'corporate' | 'government';
export type PaymentStatus = 'current' | 'pending' | 'overdue';

export interface ICustomer {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  customer_type: CustomerType;
  credit_limit: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Rental Types
export type RentalStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface IRental {
  id: number;
  reference: string;
  customer_id: number;
  vehicle_id: number;
  location_id: number;
  start_date: Date;
  end_date: Date;
  actual_return_date?: Date;
  daily_rate: number;
  total_days: number;
  total_amount: number;
  deposit_amount: number;
  balance_due: number;
  status: RentalStatus;
  notes?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

// Transaction Types
export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface ITransaction {
  id: number;
  type: TransactionType;
  reference?: string;
  description: string;
  amount: number;
  account: string;
  rental_id?: number;
  customer_id?: number;
  invoice_id?: number;
  transaction_date: Date;
  status: TransactionStatus;
  created_at: Date;
}

// Audit Log Types
export type AuditAction = 'create' | 'update' | 'delete';

export interface IAuditLog {
  id: number;
  user_id: number;
  entity_type: string;
  entity_id: number;
  action: AuditAction;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  timestamp: Date;
  ip_address?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface DashboardKPI {
  available: number;
  rented: number;
  maintenance: number;
  todayIncome: number;
  monthIncome: number;
  pendingPayments: number;
}

export interface DashboardAlert {
  id: string;
  severity: 'critical' | 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  actions?: { label: string; action: string }[];
}
