/**
 * Servicio para generar códigos únicos para rentas, pagos, facturas, etc.
 */
export class CodeGenerator {

  /**
   * Genera código de renta: ALQ-2024-0001
   */
  static async generateRentalCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ALQ-${year}-${random}`;
  }

  /**
   * Genera código de pago: PAY-2024-0001
   */
  static async generatePaymentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY-${year}-${random}`;
  }

  /**
   * Genera código de factura: FAC-2024-0001
   */
  static async generateInvoiceCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FAC-${year}-${random}`;
  }

  /**
   * Genera código de ingreso: INC-2024-0001
   */
  static async generateIncomeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INC-${year}-${random}`;
  }

  /**
   * Genera código de devolución: DEV-2024-0001
   */
  static async generateReturnCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DEV-${year}-${random}`;
  }

  /**
   * Genera código de cotización: COT-2026-0001
   */
  static async generateQuoteCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `COT-${year}-${random}`;
  }

  /**
   * Genera codigo de gasto: EGR-2026-0001
   */
  static async generateExpenseCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EGR-${year}-${random}`;
  }

  /**
   * Genera codigo de proveedor: SUP-2026-0001
   */
  static async generateSupplierCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SUP-${year}-${random}`;
  }

  /**
   * Genera codigo de transaccion: TRX-2026-0001
   */
  static async generateTransactionCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRX-${year}-${random}`;
  }

  /**
   * Genera codigo de documento: DOC-2026-0001
   */
  static async generateDocumentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `DOC-${year}-${random}`;
  }
}
