import api from './api';
import { InventoryItem } from '../types';

export const inventoryService = {
  // Artículos
  async getAllItems(params?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/inventory/items', { params });
    return response.data;
  },

  async getItemById(id: string) {
    const response = await api.get(`/inventory/items/${id}`);
    return response.data;
  },

  async createItem(data: Partial<InventoryItem>) {
    const response = await api.post('/inventory/items', data);
    return response.data;
  },

  async updateItem(id: string, data: Partial<InventoryItem>) {
    const response = await api.put(`/inventory/items/${id}`, data);
    return response.data;
  },

  async deleteItem(id: string) {
    const response = await api.delete(`/inventory/items/${id}`);
    return response.data;
  },

  // Movimientos
  async getAllMovements(params?: {
    page?: number;
    limit?: number;
    movementType?: string;
    movementSubtype?: string;
    dateFrom?: string;
    dateTo?: string;
    locationId?: number;
    categoryId?: number;
    customerId?: number;
    itemId?: number;
    documentGenerated?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  },

  async createMovement(data: {
    itemId: string;
    movementType: 'entry' | 'exit' | 'transfer';
    movementSubtype: string;
    toLocationId: string;
    fromLocationId?: string;
    customerId?: string;
    expectedReturnDate?: Date;
    notes?: string;
  }) {
    const response = await api.post('/inventory/movements', data);
    return response.data;
  },

  async getItemHistory(itemId: string) {
    const response = await api.get(`/inventory/movements/${itemId}/history`);
    return response.data;
  },

  // Categorías y Ubicaciones
  async getAllCategories() {
    const response = await api.get('/inventory/categories');
    return response.data;
  },

  async getAllLocations() {
    const response = await api.get('/inventory/locations');
    return response.data;
  },

  async createLocation(data: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: { lat: number; lng: number };
    isActive: boolean;
  }) {
    const response = await api.post('/inventory/locations', data);
    return response.data;
  },

  // Descargar documento PDF de movimiento
  async downloadMovementDocument(movementId: string) {
    const response = await api.get(`/inventory/movements/${movementId}/document`, {
      responseType: 'blob',
    });
    return response;
  },

  // Estadísticas de inventario
  async getInventoryStats() {
    const response = await api.get('/inventory/stats');
    return response.data;
  },
};

export default inventoryService;
