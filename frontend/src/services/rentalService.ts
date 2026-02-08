/**
 * Servicio API para Rentas (CHAT 2)
 */
import api from './api';
import {
  CreateRentalDTO,
  UpdateRentalDTO,
  RentalFilters,
  RentalResponse,
  SingleRentalResponse,
  RentalStatus
} from '../types/rental';

/**
 * Normaliza una fecha a formato ISO (yyyy-MM-dd)
 * Soporta: yyyy-MM-dd, MM/DD/YYYY, DD/MM/YYYY
 */
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return dateStr;

  // Ya es formato ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Formato MM/DD/YYYY o DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('/');
    // Si primer número > 12, asumir DD/MM/YYYY
    if (Number.parseInt(parts[0], 10) > 12) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    // Asumir MM/DD/YYYY
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Intentar parsear y convertir
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return dateStr;
};

export const rentalService = {
  /**
   * Obtener todas las rentas con filtros opcionales
   */
  getAll: async (filters?: RentalFilters): Promise<RentalResponse> => {
    const response = await api.get<RentalResponse>('/rentals', {
      params: filters
    });
    return response.data;
  },

  /**
   * Obtener una renta por ID
   */
  getById: async (id: number): Promise<SingleRentalResponse> => {
    const response = await api.get<SingleRentalResponse>(`/rentals/${id}`);
    return response.data;
  },

  /**
   * Crear una nueva renta
   */
  create: async (data: CreateRentalDTO): Promise<SingleRentalResponse> => {
    // Normalizar fechas a formato ISO antes de enviar
    const normalizedData = {
      ...data,
      start_date: normalizeDate(data.start_date),
      end_date: normalizeDate(data.end_date)
    };
    const response = await api.post<SingleRentalResponse>('/rentals', normalizedData);
    return response.data;
  },

  /**
   * Actualizar una renta existente
   */
  update: async (id: number, data: UpdateRentalDTO): Promise<SingleRentalResponse> => {
    const response = await api.put<SingleRentalResponse>(`/rentals/${id}`, data);
    return response.data;
  },

  /**
   * Cancelar una renta
   */
  cancel: async (id: number, reason: string): Promise<SingleRentalResponse> => {
    const response = await api.delete<SingleRentalResponse>(`/rentals/${id}`, {
      data: { reason }
    });
    return response.data;
  },

  /**
   * Obtener rentas activas
   */
  getActive: async (): Promise<RentalResponse> => {
    return rentalService.getAll({ status: RentalStatus.ACTIVE });
  },

  /**
   * Obtener rentas vencidas
   */
  getOverdue: async (): Promise<RentalResponse> => {
    return rentalService.getAll({ status: RentalStatus.OVERDUE });
  },

  /**
   * Obtener rentas de un cliente
   */
  getByCustomer: async (customerId: number): Promise<RentalResponse> => {
    return rentalService.getAll({ customer_id: customerId });
  },

  /**
   * Obtener rentas de un vehículo
   */
  getByVehicle: async (vehicleId: number): Promise<RentalResponse> => {
    return rentalService.getAll({ vehicle_id: vehicleId });
  },

  // ============================================
  // MÉTODOS DE APROBACIÓN
  // ============================================

  /**
   * Obtener rentas pendientes de aprobación
   */
  getPendingApprovals: async (): Promise<{ success: boolean; data: any[]; count: number }> => {
    const response = await api.get<{ success: boolean; data: any[]; count: number }>(
      '/rentals/pending-approvals'
    );
    return response.data;
  },

  /**
   * Aprobar una renta pendiente
   */
  approveRental: async (id: number): Promise<SingleRentalResponse> => {
    const response = await api.post<SingleRentalResponse>(`/rentals/${id}/approve`);
    return response.data;
  },

  /**
   * Rechazar una renta pendiente
   */
  rejectRental: async (id: number, reason: string): Promise<SingleRentalResponse> => {
    const response = await api.post<SingleRentalResponse>(`/rentals/${id}/reject`, { reason });
    return response.data;
  }
};

export default rentalService;
