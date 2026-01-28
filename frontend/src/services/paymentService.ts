/**
 * Servicio API para Pagos (CHAT 2)
 */
import api from './api';
import {
  CreatePaymentDTO,
  PaymentFilters,
  PaymentResponse,
  SinglePaymentResponse
} from '../types/payment';

export const paymentService = {
  /**
   * Obtener todos los pagos con filtros opcionales
   */
  getAll: async (filters?: PaymentFilters): Promise<PaymentResponse> => {
    const response = await api.get<PaymentResponse>('/payments', {
      params: filters
    });
    return response.data;
  },

  /**
   * Obtener un pago por ID
   */
  getById: async (id: number): Promise<SinglePaymentResponse> => {
    const response = await api.get<SinglePaymentResponse>(`/payments/${id}`);
    return response.data;
  },

  /**
   * Registrar un nuevo pago
   */
  create: async (data: CreatePaymentDTO): Promise<SinglePaymentResponse> => {
    const response = await api.post<SinglePaymentResponse>('/payments', data);
    return response.data;
  },

  /**
   * Obtener pagos de un cliente
   */
  getByCustomer: async (customerId: number): Promise<PaymentResponse> => {
    return paymentService.getAll({ customer_id: customerId });
  },

  /**
   * Obtener pagos de una renta
   */
  getByRental: async (rentalId: number): Promise<PaymentResponse> => {
    return paymentService.getAll({ rental_id: rentalId });
  }
};

export default paymentService;
