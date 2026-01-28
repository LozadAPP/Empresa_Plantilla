/**
 * Servicio API para Facturas (CHAT 2)
 */
import api from './api';
import {
  CreateInvoiceDTO,
  InvoiceFilters,
  InvoiceResponse,
  SingleInvoiceResponse,
  OverdueInvoicesResponse
} from '../types/invoice';

/**
 * Valida que un ID sea un número válido
 */
const validateId = (id: number, entityName: string = 'ID'): void => {
  if (Number.isNaN(id) || id <= 0) {
    throw new Error(`${entityName} inválido: ${id}`);
  }
};

export const invoiceService = {
  /**
   * Obtener todas las facturas con filtros opcionales
   */
  getAll: async (filters?: InvoiceFilters): Promise<InvoiceResponse> => {
    const response = await api.get<InvoiceResponse>('/invoices', {
      params: filters
    });
    return response.data;
  },

  /**
   * Obtener una factura por ID
   */
  getById: async (id: number): Promise<SingleInvoiceResponse> => {
    validateId(id, 'ID de factura');
    const response = await api.get<SingleInvoiceResponse>(`/invoices/${id}`);
    return response.data;
  },

  /**
   * Crear una nueva factura
   */
  create: async (data: CreateInvoiceDTO): Promise<SingleInvoiceResponse> => {
    const response = await api.post<SingleInvoiceResponse>('/invoices', data);
    return response.data;
  },

  /**
   * Reenviar factura por email
   */
  resend: async (id: number): Promise<SingleInvoiceResponse> => {
    validateId(id, 'ID de factura');
    const response = await api.post<SingleInvoiceResponse>(`/invoices/${id}/send`);
    return response.data;
  },

  /**
   * Obtener facturas vencidas
   */
  getOverdue: async (): Promise<OverdueInvoicesResponse> => {
    const response = await api.get<OverdueInvoicesResponse>('/invoices/overdue');
    return response.data;
  },

  /**
   * Obtener facturas de un cliente
   */
  getByCustomer: async (customerId: number): Promise<InvoiceResponse> => {
    validateId(customerId, 'ID de cliente');
    return invoiceService.getAll({ customer_id: customerId });
  },

  /**
   * Obtener factura de una renta
   */
  getByRental: async (rentalId: number): Promise<InvoiceResponse> => {
    validateId(rentalId, 'ID de renta');
    return invoiceService.getAll({ rental_id: rentalId });
  },

  /**
   * Descargar PDF de factura
   */
  downloadPDF: async (id: number): Promise<Blob> => {
    validateId(id, 'ID de factura');
    const invoice = await invoiceService.getById(id);

    if (invoice.data.pdf_url) {
      // Si ya existe el PDF, descargarlo directamente
      const response = await fetch(invoice.data.pdf_url);
      return response.blob();
    }

    throw new Error('PDF no disponible para esta factura');
  }
};

export default invoiceService;
