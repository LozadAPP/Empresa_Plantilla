/**
 * Tipos para CFDI 4.0 — Catálogos SAT y configuración fiscal
 */

export interface SATCatalogs {
  formaPago: Record<string, string>;
  metodoPago: Record<string, string>;
  usoCfdi: Record<string, string>;
  regimenFiscal: Record<string, string>;
  claveProdServ: Record<string, string>;
  claveUnidad: Record<string, string>;
  motivoCancelacion: Record<string, string>;
  moneda: Record<string, string>;
}

export interface CompanyFiscalConfig {
  company_rfc: string;
  company_razon_social: string;
  company_regimen_fiscal: string;
  company_zip_code: string;
  company_address: string;
  cfdi_pac_provider: string;
  cfdi_pac_user: string;
  cfdi_pac_password: string;
  cfdi_csd_cert_path: string;
  cfdi_csd_key_path: string;
  cfdi_default_tax_rate: string;
}

export interface CfdiValidationResult {
  valid: boolean;
  errors: string[];
}
