export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: 'warehouse' | 'customer' | 'office' | 'maintenance' | 'other';
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  types: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  // Categorización
  categoryId: string;
  categoryName: string;
  type: string;
  // Identificación
  serialNumber: string;
  internalCode?: string;
  // Ubicación Actual
  currentLocationId: string;
  currentLocationName: string;
  currentLocationCity: string;
  currentLocationState: string;
  currentLocationCoordinates: { lat: number; lng: number };
  // Cliente/Empresa Actual
  currentCustomerId?: string;
  currentCompany?: string;
  // Estado
  status: 'available' | 'rented' | 'maintenance' | 'sold' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  // Valores
  purchasePrice?: number;
  currentValue: number;
  rentalPriceDaily?: number;
  // Fechas
  purchaseDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  lastMovementDate?: Date;
  // Campos personalizados
  customFields: Record<string, any>;
  // Metadata
  photos?: string[];
  documents?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryMovement {
  id: string;
  movementNumber: string;
  // Artículo
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemSerialNumber: string;
  // Tipo de Movimiento
  movementType: 'entry' | 'exit' | 'transfer';
  movementSubtype: 'rental' | 'sale' | 'purchase' | 'return' | 'transfer' | 'maintenance';
  // Ubicaciones
  fromLocationId?: string;
  fromLocationName?: string;
  fromLocationAddress?: string;
  fromLocationCoordinates?: { lat: number; lng: number };
  toLocationId: string;
  toLocationName: string;
  toLocationAddress: string;
  toLocationCity: string;
  toLocationState: string;
  toLocationCoordinates: { lat: number; lng: number };
  // Cliente/Empresa
  customerId?: string;
  customerName?: string;
  customerCompany?: string;
  // Fechas
  movementDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  // Documento generado
  documentGenerated: boolean;
  documentType?: 'entry' | 'exit';
  documentNumber?: string;
  documentUrl?: string;
  // Valores
  rentalPrice?: number;
  salePrice?: number;
  purchasePrice?: number;
  // Metadata
  notes?: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStats {
  totalItems: number;
  inWarehouse: number;
  rented: number;
  maintenance: number;
  totalValue: number;
  movementsToday: number;
  movementsThisWeek: number;
  movementsThisMonth: number;
  byCategory: {
    [categoryName: string]: {
      total: number;
      available: number;
      rented: number;
    };
  };
}

export interface MovementFilters {
  movementType?: string;
  movementSubtype?: string;
  dateFrom?: string;
  dateTo?: string;
  locationId?: number;
  categoryId?: number;
  customerId?: number;
  itemId?: number;
  search?: string;
}

export interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
