/**
 * Servicio API para Cotizaciones
 */
import api from './api';
import {
  CreateQuoteDTO,
  UpdateQuoteDTO,
  QuoteFilters,
  QuoteResponse,
  SingleQuoteResponse,
  ConvertQuoteResponse
} from '../types/quote';

export const quoteService = {
  /**
   * Obtener todas las cotizaciones con filtros opcionales
   */
  getAll: async (filters?: QuoteFilters): Promise<QuoteResponse> => {
    const response = await api.get<QuoteResponse>('/quotes', {
      params: filters
    });
    return response.data;
  },

  /**
   * Obtener una cotización por ID
   */
  getById: async (id: number): Promise<SingleQuoteResponse> => {
    const response = await api.get<SingleQuoteResponse>(`/quotes/${id}`);
    return response.data;
  },

  /**
   * Crear una nueva cotización
   */
  create: async (data: CreateQuoteDTO): Promise<SingleQuoteResponse> => {
    const response = await api.post<SingleQuoteResponse>('/quotes', data);
    return response.data;
  },

  /**
   * Actualizar una cotización
   */
  update: async (id: number, data: UpdateQuoteDTO): Promise<SingleQuoteResponse> => {
    const response = await api.put<SingleQuoteResponse>(`/quotes/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar una cotización (solo borrador)
   */
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/quotes/${id}`);
    return response.data;
  },

  /**
   * Enviar cotización al cliente (draft → sent)
   */
  send: async (id: number): Promise<SingleQuoteResponse> => {
    const response = await api.patch<SingleQuoteResponse>(`/quotes/${id}/send`);
    return response.data;
  },

  /**
   * Aceptar cotización
   */
  accept: async (id: number): Promise<SingleQuoteResponse> => {
    const response = await api.patch<SingleQuoteResponse>(`/quotes/${id}/accept`);
    return response.data;
  },

  /**
   * Rechazar cotización
   */
  reject: async (id: number, reason?: string): Promise<SingleQuoteResponse> => {
    const response = await api.patch<SingleQuoteResponse>(`/quotes/${id}/reject`, { reason });
    return response.data;
  },

  /**
   * Convertir cotización a renta
   */
  convert: async (id: number): Promise<ConvertQuoteResponse> => {
    const response = await api.post<ConvertQuoteResponse>(`/quotes/${id}/convert`);
    return response.data;
  },

  /**
   * Descargar PDF de cotización
   */
  downloadPDF: async (id: number) => {
    const response = await api.get(`/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default quoteService;
