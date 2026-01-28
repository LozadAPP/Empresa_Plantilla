// Configuration Types
export interface SystemConfig {
  id: number;
  configKey: string;
  configValue: string;
  configType: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'pricing' | 'email' | 'notifications' | 'security' | 'business';
  description?: string;
  isEditable: boolean;
  updatedBy?: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  updater?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface PriceConfig {
  id: number;
  vehicleTypeId?: number;
  locationId?: number;
  season?: 'low' | 'regular' | 'high' | 'peak';
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  minimumRentalDays?: number;
  discountPercentage?: number;
  extraHourRate?: number;
  extraDayRate?: number;
  insuranceRate?: number;
  depositAmount?: number;
  lateFeePerDay?: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isActive: boolean;
  notes?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  vehicleType?: {
    id: number;
    name: string;
  };
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
}

export interface CreatePriceConfigDto {
  vehicleTypeId?: number;
  locationId?: number;
  season?: 'low' | 'regular' | 'high' | 'peak';
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  minimumRentalDays?: number;
  discountPercentage?: number;
  extraHourRate?: number;
  extraDayRate?: number;
  insuranceRate?: number;
  depositAmount?: number;
  lateFeePerDay?: number;
  effectiveFrom: string | Date;
  effectiveUntil?: string | Date;
  notes?: string;
  createdBy: number;
}
