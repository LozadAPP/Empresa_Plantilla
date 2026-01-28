/**
 * Servicio API para Devoluciones (CHAT 2)
 */
import api from './api';
import {
  CreateReturnDTO,
  UpdateReturnDTO,
  ReturnResponse,
  SingleReturnResponse
} from '../types/return';

export const returnService = {
  /**
   * Obtener todas las devoluciones
   */
  getAll: async (params?: {
    rental_id?: number;
    vehicle_id?: number;
    location_id?: number;
    page?: number;
    limit?: number;
  }): Promise<ReturnResponse> => {
    const response = await api.get<ReturnResponse>('/returns', { params });
    return response.data;
  },

  /**
   * Obtener una devolución por ID
   */
  getById: async (id: number): Promise<SingleReturnResponse> => {
    const response = await api.get<SingleReturnResponse>(`/returns/${id}`);
    return response.data;
  },

  /**
   * Obtener devolución de una renta específica
   */
  getByRentalId: async (rentalId: number): Promise<SingleReturnResponse> => {
    const response = await api.get<SingleReturnResponse>(`/returns/rental/${rentalId}`);
    return response.data;
  },

  /**
   * Registrar una nueva devolución
   */
  create: async (data: CreateReturnDTO): Promise<SingleReturnResponse> => {
    const response = await api.post<SingleReturnResponse>('/returns', data);
    return response.data;
  },

  /**
   * Actualizar una devolución
   */
  update: async (id: number, data: UpdateReturnDTO): Promise<SingleReturnResponse> => {
    const response = await api.put<SingleReturnResponse>(`/returns/${id}`, data);
    return response.data;
  }
};

export default returnService;
