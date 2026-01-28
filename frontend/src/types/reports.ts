// Report Types
export interface IncomeReportSummary {
  totalIncome: number;
  totalRentals: number;
  averageIncome: number;
}

export interface IncomeReportGrouped {
  period: string;
  totalIncome: number;
  rentalCount: number;
}

export interface IncomeReport {
  summary: IncomeReportSummary;
  details: any[];
  grouped: IncomeReportGrouped[];
}

export interface OccupancyReportSummary {
  totalVehicles: number;
  available: number;
  rented: number;
  maintenance: number;
  occupancyRate: string;
}

export interface OccupancyReport {
  summary: OccupancyReportSummary;
  rentals: any[];
}

export interface ProfitabilityReportSummary {
  totalRevenue: number;
  totalMaintenanceCost: number;
  totalExpenses: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: string;
}

export interface ProfitabilityReport {
  summary: ProfitabilityReportSummary;
  breakdown: {
    rentals: number;
    maintenanceOrders: number;
    otherExpenses: number;
  };
}

export interface TopCustomer {
  customerId: number;
  rentalCount: number;
  totalRevenue: number;
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    customerType: string;
  };
}

export interface VehiclePerformance {
  vehicleId: number;
  rentalCount: number;
  totalRevenue: number;
  averageRevenue: number;
  vehicle?: {
    id: number;
    make: string;
    model: string;
    licensePlate: string;
    year: number;
    status: string;
  };
}

export interface DashboardSummary {
  vehicles: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
  };
  rentals: {
    active: number;
  };
  today: {
    income: number;
    rentals: number;
  };
  alerts: {
    critical: number;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  locationId?: number;
  vehicleId?: number;
  groupBy?: 'day' | 'week' | 'month' | 'year';
  limit?: number;
}
