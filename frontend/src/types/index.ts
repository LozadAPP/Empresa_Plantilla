/**
 * MOVICAR - Type Definitions
 *
 * NAMING CONVENTION:
 * - Backend models use snake_case (e.g., first_name, created_at)
 * - Frontend-only types use camelCase (e.g., isActive, createdAt)
 *
 * Types that mirror backend models (User, Vehicle, Customer) preserve
 * snake_case to match API responses directly.
 *
 * Types created for frontend (InventoryItem, ItemCategory, Location)
 * use camelCase as they were designed for frontend use.
 */

// User Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location_id?: number;
  roles: string[];
  is_active: boolean;
}

/**
 * Auth state - tokens are in HTTP-only cookies, not in state
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login response - tokens are set in HTTP-only cookies by the server
 * Only user data is returned in the response body
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

// Location Types
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates: Coordinates;
  type: 'warehouse' | 'customer' | 'office' | 'maintenance' | 'other';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inventory Types
export type ItemStatus = 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
export type ItemCondition = 'new' | 'excellent' | 'good' | 'fair' | 'poor';

export interface ItemCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  types: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  serialNumber: string;
  internalCode?: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  type: string;
  status: ItemStatus;
  condition: ItemCondition;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  supplier?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  currentLocationId: number;
  currentLocationName: string;
  currentLocationAddress: string;
  currentLocationCity: string;
  currentLocationState: string;
  currentLocationCoordinates: Coordinates;
  currentCustomerId?: number;
  currentCustomerName?: string;
  currentCustomerCompany?: string;
  rentalPriceDaily?: number;
  rentalPriceWeekly?: number;
  rentalPriceMonthly?: number;
  specifications?: Record<string, unknown>;
  notes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

// Vehicle Types
export type VehicleStatus = 'available' | 'rented' | 'maintenance';
export type VehicleCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface VehicleType {
  id: number;
  name: string;
  description?: string;
  daily_rate: number;
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  license_plate: string;
  vin: string;
  year: number;
  color?: string;
  vehicle_type_id: number;
  vehicleType?: VehicleType;
  status: VehicleStatus;
  location_id: number;
  location?: Location;
  daily_rate: number;
  purchase_price: number;
  current_value: number;
  monthly_depreciation: number;
  mileage: number;
  fuel_type?: string;
  transmission?: string;
  insurance_expiry?: string;
  next_maintenance?: string;
  condition: VehicleCondition;
  is_premium: boolean;
  has_driver: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Customer Types
export type CustomerType = 'individual' | 'corporate' | 'government';

export interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  customer_type: CustomerType;
  credit_limit: number;
  payment_terms: number;
  discount_percentage: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Types
export interface DashboardKPIs {
  vehicles: {
    available: number;
    rented: number;
    maintenance: number;
    total: number;
    occupancyRate: number;
  };
  customers: {
    total: number;
    active: number;
  };
  financial: {
    todayIncome: number;
    monthIncome: number;
    pendingPayments: number;
  };
}

export interface DashboardAlert {
  id: string;
  severity: 'critical' | 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  entityType?: string;
  entityId?: number;
  timestamp: string;
}

export interface ChartData {
  vehiclesByStatus: { status: string; count: number }[];
  vehiclesByType: { type: string; count: number }[];
}

export interface VehicleTypeStats {
  sedan?: number;
  suv?: number;
  pickup?: number;
  compact?: number;
  luxury?: number;
  van?: number;
  [key: string]: number | undefined;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  alerts: DashboardAlert[];
  charts: ChartData;
  vehicleTypes?: VehicleTypeStats;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// Filter Types
export interface VehicleFilters {
  status?: VehicleStatus;
  location_id?: number;
  vehicle_type_id?: number;
  condition?: VehicleCondition;
  search?: string;
  minValue?: number;
  maxValue?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
}

export interface CustomerFilters {
  customer_type?: CustomerType;
  is_active?: boolean;
  search?: string;
  city?: string;
  country?: string;
}

// Form Types
export interface VehicleFormData {
  make: string;
  model: string;
  license_plate: string;
  vin: string;
  year: number;
  color?: string;
  vehicle_type_id: number;
  location_id: number;
  daily_rate: number;
  purchase_price: number;
  current_value: number;
  monthly_depreciation: number;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  condition?: VehicleCondition;
  is_premium?: boolean;
  has_driver?: boolean;
  notes?: string;
}

export interface CustomerFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  customer_type?: CustomerType;
  credit_limit?: number;
  payment_terms?: number;
  discount_percentage?: number;
  notes?: string;
}
