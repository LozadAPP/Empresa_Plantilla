import api from './api';
import { SATCatalogs, CompanyFiscalConfig, CfdiValidationResult } from '../types/cfdi';
import { Invoice } from '../types/invoice';

const CFDI_URL = '/cfdi';
const INVOICES_URL = '/invoices';

export const cfdiService = {
  // SAT Catalogs
  getCatalogs: async () => {
    const response = await api.get<{ success: boolean; data: SATCatalogs }>(`${CFDI_URL}/catalogs`);
    return response.data;
  },

  // Fiscal Config
  getFiscalConfig: async () => {
    const response = await api.get<{ success: boolean; data: CompanyFiscalConfig }>(`${CFDI_URL}/config`);
    return response.data;
  },

  updateFiscalConfig: async (data: Partial<CompanyFiscalConfig>) => {
    const response = await api.put<{ success: boolean; data: CompanyFiscalConfig; message: string }>(`${CFDI_URL}/config`, data);
    return response.data;
  },

  // CFDI Operations on Invoices
  stampInvoice: async (invoiceId: number) => {
    const response = await api.post<{ success: boolean; data: Invoice; message: string }>(
      `${INVOICES_URL}/${invoiceId}/cfdi/stamp`
    );
    return response.data;
  },

  cancelCfdi: async (invoiceId: number, cancelReason: string) => {
    const response = await api.post<{ success: boolean; message: string }>(
      `${INVOICES_URL}/${invoiceId}/cfdi/cancel`,
      { cancel_reason: cancelReason }
    );
    return response.data;
  },

  validateCfdi: async (invoiceId: number) => {
    const response = await api.post<{ success: boolean; data: CfdiValidationResult }>(
      `${INVOICES_URL}/${invoiceId}/cfdi/validate`
    );
    return response.data;
  },

  downloadXML: async (invoiceId: number) => {
    const response = await api.get(`${INVOICES_URL}/${invoiceId}/cfdi/xml`, {
      responseType: 'blob',
    });
    // Trigger download
    const blob = new Blob([response.data], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CFDI_${invoiceId}.xml`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};

export default cfdiService;
