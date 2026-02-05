import { differenceInDays } from 'date-fns';

export interface RentalCalculation {
  days: number;
  daily_rate: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage: number;
  discount_amount: number;
  insurance_amount: number;
  extras_amount: number;
  shipping_cost: number;
  price_adjustment: number;
  total_amount: number;
}

export interface RentalCalculationInput {
  start_date: Date;
  end_date: Date;
  daily_rate: number;
  tax_percentage?: number;
  discount_percentage?: number;
  insurance_amount?: number;
  extras_amount?: number;
  shipping_cost?: number;
  price_adjustment?: number;
}

/**
 * Servicio para calcular montos de rentas automáticamente
 * Maneja: días, subtotales, impuestos, descuentos, seguros, extras
 */
export class RentalCalculator {

  /**
   * Calcula todos los montos de una renta
   * Fórmula: (subtotal - descuento + seguro + extras + envío + ajuste) × (1 + IVA)
   */
  static calculate(input: RentalCalculationInput): RentalCalculation {
    // Calcular días de renta (mínimo 1 día)
    const days = Math.max(1, differenceInDays(input.end_date, input.start_date) + 1);

    // Valores por defecto
    const taxPercentage = input.tax_percentage ?? 16; // 16% IVA por defecto
    const discountPercentage = input.discount_percentage ?? 0;
    const insuranceAmount = input.insurance_amount ?? 0;
    const extrasAmount = input.extras_amount ?? 0;
    const shippingCost = input.shipping_cost ?? 0;
    const priceAdjustment = input.price_adjustment ?? 0;

    // Subtotal (días * tarifa diaria)
    const subtotal = days * input.daily_rate;

    // Descuento
    const discountAmount = subtotal * (discountPercentage / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;

    // Agregar seguro y extras
    const subtotalWithExtras = subtotalAfterDiscount + insuranceAmount + extrasAmount;

    // Agregar envío
    const subtotalWithShipping = subtotalWithExtras + shippingCost;

    // Agregar ajuste de precio (+/-)
    const subtotalWithAdjustment = subtotalWithShipping + priceAdjustment;

    // Impuestos (sobre subtotal completo)
    const taxAmount = subtotalWithAdjustment * (taxPercentage / 100);

    // Total final
    const totalAmount = subtotalWithAdjustment + taxAmount;

    return {
      days,
      daily_rate: input.daily_rate,
      subtotal,
      tax_percentage: taxPercentage,
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      discount_percentage: discountPercentage,
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      insurance_amount: insuranceAmount,
      extras_amount: extrasAmount,
      shipping_cost: shippingCost,
      price_adjustment: priceAdjustment,
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  }

  /**
   * Calcula penalidades por devolución tardía
   * @param daily_rate Tarifa diaria del vehículo
   * @param days_late Días de retraso
   * @param penalty_multiplier Multiplicador de penalidad (default 1.5x)
   */
  static calculateLateFee(
    daily_rate: number,
    days_late: number,
    penalty_multiplier: number = 1.5
  ): number {
    if (days_late <= 0) return 0;
    const lateFee = daily_rate * days_late * penalty_multiplier;
    return parseFloat(lateFee.toFixed(2));
  }

  /**
   * Calcula costo de limpieza según condición del vehículo
   */
  static calculateCleaningCost(cleaning_required: boolean): number {
    return cleaning_required ? 50 : 0; // $50 por limpieza profunda
  }
}
