import PDFDocument from 'pdfkit';
import InventoryMovement from '../models/InventoryMovement';
import InventoryItem from '../models/InventoryItem';

export interface DocumentGenerationOptions {
  movement: InventoryMovement;
  item: InventoryItem;
}

export class DocumentService {
  /**
   * Genera documento PDF de entrada/salida de inventario
   */
  static async generateMovementDocument(
    options: DocumentGenerationOptions
  ): Promise<Buffer> {
    const { movement, item } = options;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        this.addHeader(doc, movement);

        // Movement Information
        this.addMovementInfo(doc, movement);

        // Item Information
        this.addItemInfo(doc, item);

        // Location Details
        this.addLocationDetails(doc, movement);

        // Footer
        this.addFooter(doc, movement);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addHeader(doc: PDFKit.PDFDocument, movement: InventoryMovement) {
    // Logo/Title
    doc
      .fontSize(24)
      .fillColor('#8b5cf6')
      .text('MOVICAR', 50, 50, { align: 'left' });

    // Document Type
    const docType =
      movement.movementType === 'entry'
        ? 'DOCUMENTO DE ENTRADA'
        : movement.movementType === 'exit'
        ? 'DOCUMENTO DE SALIDA'
        : 'DOCUMENTO DE TRANSFERENCIA';

    doc
      .fontSize(18)
      .fillColor('#1f2937')
      .text(docType, 50, 80, { align: 'left' });

    // Movement Number
    doc
      .fontSize(12)
      .fillColor('#6b7280')
      .text(`No. ${movement.movementNumber}`, 450, 50, { align: 'right' });

    // Date
    const dateStr = new Date(movement.movementDate).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text(`Fecha: ${dateStr}`, 450, 70, { align: 'right' });

    // Line separator
    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, 120)
      .lineTo(562, 120)
      .stroke();

    doc.moveDown(3);
  }

  private static addMovementInfo(
    doc: PDFKit.PDFDocument,
    movement: InventoryMovement
  ) {
    doc.fontSize(14).fillColor('#1f2937').text('Información del Movimiento', 50, 140);

    const yStart = 165;
    doc.fontSize(10).fillColor('#6b7280');

    // Tipo de Movimiento
    const typeLabels: Record<string, string> = {
      rental: 'Renta',
      sale: 'Venta',
      purchase: 'Compra',
      return: 'Devolución',
      transfer: 'Transferencia',
      maintenance: 'Mantenimiento',
    };

    doc.text('Tipo:', 50, yStart);
    doc
      .fillColor('#1f2937')
      .text(typeLabels[movement.movementSubtype] || movement.movementSubtype, 150, yStart);

    // Cliente/Empresa (si aplica)
    if (movement.customerName) {
      doc.fillColor('#6b7280').text('Cliente:', 50, yStart + 20);
      doc.fillColor('#1f2937').text(movement.customerName, 150, yStart + 20);

      if (movement.customerCompany) {
        doc.fillColor('#6b7280').text('Empresa:', 50, yStart + 40);
        doc.fillColor('#1f2937').text(movement.customerCompany, 150, yStart + 40);
      }
    }

    // Fecha de retorno esperada (para rentas)
    if (movement.expectedReturnDate) {
      const returnDateStr = new Date(movement.expectedReturnDate).toLocaleDateString(
        'es-MX'
      );
      const yOffset = movement.customerCompany ? 60 : movement.customerName ? 40 : 20;
      doc.fillColor('#6b7280').text('Retorno Esperado:', 50, yStart + yOffset);
      doc.fillColor('#1f2937').text(returnDateStr, 150, yStart + yOffset);
    }

    doc.moveDown(4);
  }

  private static addItemInfo(doc: PDFKit.PDFDocument, item: InventoryItem) {
    const yStart = doc.y + 20;

    // Section title
    doc
      .fontSize(14)
      .fillColor('#1f2937')
      .text('Información del Artículo', 50, yStart);

    // Box background
    doc
      .rect(50, yStart + 25, 512, 100)
      .fillAndStroke('#f8f9fa', '#e5e7eb');

    doc.fontSize(10).fillColor('#1f2937');

    // Item details
    const boxY = yStart + 35;
    doc.text('Nombre:', 60, boxY, { continued: true });
    doc.fillColor('#6b7280').text(` ${item.name}`);

    doc.fillColor('#1f2937').text('Categoría:', 60, boxY + 20, { continued: true });
    doc.fillColor('#6b7280').text(` ${item.categoryName}`);

    doc.fillColor('#1f2937').text('Tipo:', 60, boxY + 40, { continued: true });
    doc.fillColor('#6b7280').text(` ${item.type}`);

    doc.fillColor('#1f2937').text('Serie:', 320, boxY, { continued: true });
    doc.fillColor('#6b7280').text(` ${item.serialNumber}`);

    if (item.internalCode) {
      doc.fillColor('#1f2937').text('Código:', 320, boxY + 20, { continued: true });
      doc.fillColor('#6b7280').text(` ${item.internalCode}`);
    }

    // Status
    const statusLabels: Record<string, string> = {
      available: 'Disponible',
      rented: 'Rentado',
      maintenance: 'Mantenimiento',
      sold: 'Vendido',
      retired: 'Retirado',
    };

    doc
      .fillColor('#1f2937')
      .text('Estado:', 320, boxY + 40, { continued: true });
    doc.fillColor('#6b7280').text(` ${statusLabels[item.status] || item.status}`);

    // Value
    doc
      .fillColor('#1f2937')
      .text('Valor:', 60, boxY + 60, { continued: true });
    doc
      .fillColor('#6b7280')
      .text(` $${item.currentValue?.toLocaleString('es-MX')}`);

    if (item.rentalPriceDaily) {
      doc
        .fillColor('#1f2937')
        .text('Renta/día:', 320, boxY + 60, { continued: true });
      doc
        .fillColor('#6b7280')
        .text(` $${item.rentalPriceDaily.toLocaleString('es-MX')}`);
    }

    doc.moveDown(6);
  }

  private static addLocationDetails(
    doc: PDFKit.PDFDocument,
    movement: InventoryMovement
  ) {
    const yStart = doc.y + 20;

    doc
      .fontSize(14)
      .fillColor('#1f2937')
      .text('Ubicación', 50, yStart);

    const boxY = yStart + 25;

    // From Location (for transfers)
    if (movement.fromLocationName) {
      doc.fontSize(10).fillColor('#6b7280').text('Origen:', 60, boxY);

      doc.fillColor('#1f2937').text(movement.fromLocationName, 60, boxY + 15);

      doc
        .fillColor('#6b7280')
        .text(movement.fromLocationAddress || '', 60, boxY + 30);

      if (movement.fromLocationCoordinates) {
        doc
          .fillColor('#6b7280')
          .fontSize(8)
          .text(
            `GPS: ${movement.fromLocationCoordinates.lat.toFixed(6)}, ${movement.fromLocationCoordinates.lng.toFixed(6)}`,
            60,
            boxY + 45
          );
      }
    }

    // To Location
    const destY = movement.fromLocationName ? boxY + 70 : boxY;
    doc
      .fontSize(10)
      .fillColor('#6b7280')
      .text(movement.fromLocationName ? 'Destino:' : 'Ubicación:', 60, destY);

    doc.fillColor('#1f2937').text(movement.toLocationName, 60, destY + 15);

    doc
      .fillColor('#6b7280')
      .text(
        `${movement.toLocationAddress}, ${movement.toLocationCity}, ${movement.toLocationState}`,
        60,
        destY + 30
      );

    doc
      .fillColor('#6b7280')
      .fontSize(8)
      .text(
        `GPS: ${movement.toLocationCoordinates.lat.toFixed(6)}, ${movement.toLocationCoordinates.lng.toFixed(6)}`,
        60,
        destY + 45
      );

    // Notes (if any)
    if (movement.notes) {
      const notesY = destY + 70;
      doc.fontSize(10).fillColor('#6b7280').text('Notas:', 60, notesY);

      doc
        .fillColor('#1f2937')
        .fontSize(9)
        .text(movement.notes, 60, notesY + 15, { width: 500 });
    }

    doc.moveDown(3);
  }

  private static addFooter(doc: PDFKit.PDFDocument, movement: InventoryMovement) {
    // Signature lines
    const pageHeight = doc.page.height;
    const sigY = pageHeight - 150;

    doc
      .strokeColor('#e5e7eb')
      .lineWidth(1)
      .moveTo(50, sigY)
      .lineTo(562, sigY)
      .stroke();

    doc.fontSize(10).fillColor('#6b7280');

    // Left signature
    doc.text('_________________________', 70, sigY + 30);
    doc.text('Entregó', 70, sigY + 50, { align: 'center', width: 150 });
    doc.fontSize(8).text(movement.userName, 70, sigY + 65, {
      align: 'center',
      width: 150,
    });

    // Right signature
    doc.fontSize(10).text('_________________________', 350, sigY + 30);
    doc.text('Recibió', 350, sigY + 50, { align: 'center', width: 150 });
    doc.fontSize(8).text(movement.customerName || '___________', 350, sigY + 65, {
      align: 'center',
      width: 150,
    });

    // Document info footer
    doc
      .fontSize(8)
      .fillColor('#9ca3af')
      .text(
        `Generado automáticamente por MOVICAR • ${new Date().toLocaleString('es-MX')}`,
        50,
        pageHeight - 30,
        { align: 'center', width: 512 }
      );
  }
}

export default DocumentService;
