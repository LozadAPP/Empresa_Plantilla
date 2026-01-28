// Maintenance Types
export interface MaintenanceType {
  id: number;
  name: string;
  description?: string;
  estimatedCost: number;
  estimatedDuration: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceOrder {
  id: number;
  maintenanceCode: string;
  vehicleId: number;
  maintenanceTypeId: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: Date;
  startDate?: Date;
  completedDate?: Date;
  description?: string;
  notes?: string;
  actualCost?: number;
  actualDuration?: number;
  workshopName?: string;
  technicianName?: string;
  mileageAtService?: number;
  nextServiceMileage?: number;
  partsReplaced?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  vehicle?: {
    id: number;
    make: string;
    model: string;
    licensePlate: string;
    year: number;
  };
  maintenanceType?: MaintenanceType;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateMaintenanceOrderDto {
  vehicleId: number;
  maintenanceTypeId: number;
  scheduledDate: string | Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  workshopName?: string;
  technicianName?: string;
}

export interface UpdateMaintenanceOrderDto {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate?: string | Date;
  startDate?: string | Date;
  completedDate?: string | Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  notes?: string;
  actualCost?: number;
  actualDuration?: number;
  workshopName?: string;
  technicianName?: string;
  mileageAtService?: number;
  nextServiceMileage?: number;
  partsReplaced?: string;
}
