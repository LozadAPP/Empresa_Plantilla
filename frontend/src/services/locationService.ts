import api from './api';

// Types
export interface Coordinates {
  lat: number;
  lng: number;
}

export type LocationType = 'warehouse' | 'customer' | 'office' | 'maintenance' | 'other';

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates: Coordinates;
  type: LocationType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleCount?: number;
  userCount?: number;
}

export interface CreateLocationDto {
  name: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  zipCode?: string;
  coordinates?: Coordinates;
  type?: LocationType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface UpdateLocationDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: Coordinates;
  type?: LocationType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface LocationStats {
  total: number;
  active: number;
  inactive: number;
  totalVehicles: number;
  totalUsers: number;
  averageVehicles: number;
  averageUsers: number;
  byType: {
    office: number;
    warehouse: number;
    maintenance: number;
    other: number;
  };
}

export interface LocationFilters {
  search?: string;
  type?: LocationType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface LocationDropdown {
  id: number;
  name: string;
  city: string;
  state: string;
}

const BASE_URL = '/locations';

export const locationService = {
  // Get all locations with filters and pagination
  getLocations: async (params?: LocationFilters) => {
    const response = await api.get<{
      success: boolean;
      data: Location[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(BASE_URL, { params });
    return response.data;
  },

  // Get location by ID
  getLocationById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: Location }>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  // Create new location
  createLocation: async (data: CreateLocationDto) => {
    const response = await api.post<{ success: boolean; data: Location; message: string }>(
      BASE_URL,
      data
    );
    return response.data;
  },

  // Update location
  updateLocation: async (id: number, data: UpdateLocationDto) => {
    const response = await api.put<{ success: boolean; data: Location; message: string }>(
      `${BASE_URL}/${id}`,
      data
    );
    return response.data;
  },

  // Toggle location status (activate/deactivate)
  toggleLocationStatus: async (id: number) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: { id: number; isActive: boolean };
    }>(`${BASE_URL}/${id}/toggle`);
    return response.data;
  },

  // Get location statistics
  getLocationStats: async () => {
    const response = await api.get<{ success: boolean; data: LocationStats }>(
      `${BASE_URL}/stats`
    );
    return response.data;
  },

  // Get locations for dropdown (active only, minimal data)
  getLocationsDropdown: async () => {
    const response = await api.get<{ success: boolean; data: LocationDropdown[] }>(
      `${BASE_URL}/dropdown`
    );
    return response.data;
  },
};

export default locationService;
