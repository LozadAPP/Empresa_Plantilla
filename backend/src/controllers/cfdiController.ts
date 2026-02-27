import { Response } from 'express';
import fs from 'fs/promises';
import { AuthRequest } from '../types';
import logger from '../config/logger';
import cfdiService from '../services/cfdiService';
import {
  SAT_FORMA_PAGO,
  SAT_METODO_PAGO,
  SAT_USO_CFDI,
  SAT_REGIMEN_FISCAL,
  SAT_CLAVE_PROD_SERV,
  SAT_CLAVE_UNIDAD,
  SAT_MOTIVO_CANCELACION,
  SAT_MONEDA,
} from '../constants/satCatalogs';
import { SystemConfig } from '../models';

/**
 * POST /api/invoices/:id/cfdi/stamp — Timbrar factura (simulado)
 */
export const stampInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceId = parseInt(req.params.id);
    const result = await cfdiService.stampInvoice(invoiceId);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message, data: result.invoice });
  } catch (error) {
    logger.error('Error al timbrar CFDI:', error);
    res.status(500).json({ success: false, message: 'Error interno al timbrar CFDI' });
  }
};

/**
 * POST /api/invoices/:id/cfdi/cancel — Cancelar CFDI
 */
export const cancelCfdi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { cancel_reason } = req.body;

    if (!cancel_reason) {
      res.status(400).json({ success: false, message: 'Se requiere motivo de cancelación (cancel_reason)' });
      return;
    }

    const result = await cfdiService.cancelInvoice(invoiceId, cancel_reason);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, message: result.message });
  } catch (error) {
    logger.error('Error al cancelar CFDI:', error);
    res.status(500).json({ success: false, message: 'Error interno al cancelar CFDI' });
  }
};

/**
 * GET /api/invoices/:id/cfdi/xml — Descargar XML
 */
export const downloadXML = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceId = parseInt(req.params.id);
    const filePath = await cfdiService.getXMLFilePath(invoiceId);

    if (!filePath) {
      res.status(404).json({ success: false, message: 'XML no disponible para esta factura' });
      return;
    }

    try {
      await fs.access(filePath);
    } catch {
      res.status(404).json({ success: false, message: 'Archivo XML no encontrado en el servidor' });
      return;
    }

    const xmlContent = await fs.readFile(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="CFDI_${invoiceId}.xml"`);
    res.send(xmlContent);
  } catch (error) {
    logger.error('Error al descargar XML:', error);
    res.status(500).json({ success: false, message: 'Error interno al descargar XML' });
  }
};

/**
 * POST /api/invoices/:id/cfdi/validate — Validar factura para CFDI
 */
export const validateCfdi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceId = parseInt(req.params.id);
    const result = await cfdiService.validateInvoiceForCFDI(invoiceId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error al validar CFDI:', error);
    res.status(500).json({ success: false, message: 'Error interno al validar CFDI' });
  }
};

/**
 * GET /api/cfdi/catalogs — Catálogos SAT (estáticos)
 */
export const getCatalogs = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      formaPago: SAT_FORMA_PAGO,
      metodoPago: SAT_METODO_PAGO,
      usoCfdi: SAT_USO_CFDI,
      regimenFiscal: SAT_REGIMEN_FISCAL,
      claveProdServ: SAT_CLAVE_PROD_SERV,
      claveUnidad: SAT_CLAVE_UNIDAD,
      motivoCancelacion: SAT_MOTIVO_CANCELACION,
      moneda: SAT_MONEDA,
    },
  });
};

/**
 * GET /api/cfdi/config — Configuración fiscal de la empresa
 */
export const getFiscalConfig = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await cfdiService.loadFiscalConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    logger.error('Error al obtener configuración fiscal:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};

/**
 * PUT /api/cfdi/config — Actualizar configuración fiscal
 */
export const updateFiscalConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body;
    const allowedKeys = [
      'company_rfc', 'company_razon_social', 'company_regimen_fiscal',
      'company_zip_code', 'company_address',
      'cfdi_pac_provider', 'cfdi_pac_user', 'cfdi_pac_password',
      'cfdi_csd_cert_path', 'cfdi_csd_key_path', 'cfdi_default_tax_rate',
    ];

    const userId = req.user?.id;

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue;
      await SystemConfig.update(
        { configValue: String(value), updatedBy: userId },
        { where: { configKey: key } }
      );
    }

    const config = await cfdiService.loadFiscalConfig();
    res.json({ success: true, message: 'Configuración fiscal actualizada', data: config });
  } catch (error) {
    logger.error('Error al actualizar configuración fiscal:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};
