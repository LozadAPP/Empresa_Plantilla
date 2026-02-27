import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Alert from './Alert';
import Rental from './Rental';
import Customer from './Customer';
import logger from '../config/logger';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  RENTAL_PAYMENT = 'rental_payment',
  PENALTY = 'penalty',
  REFUND = 'refund'
}

interface PaymentAttributes {
  id: number;
  payment_code: string;
  rental_id?: number;
  invoice_id?: number;
  customer_id: number;
  amount: number;
  payment_method: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  reference_number?: string;
  transaction_date: Date;
  notes?: string;
  processed_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public payment_code!: string;
  public rental_id?: number;
  public invoice_id?: number;
  public customer_id!: number;
  public amount!: number;
  public payment_method!: string;
  public payment_type!: PaymentType;
  public status!: PaymentStatus;
  public reference_number?: string;
  public transaction_date!: Date;
  public notes?: string;
  public processed_by?: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    payment_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    rental_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'rentals',
        key: 'id'
      }
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    payment_type: {
      type: DataTypes.ENUM(...Object.values(PaymentType)),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: false,
    indexes: [
      { fields: ['rental_id'] },
      { fields: ['customer_id'] },
      { fields: ['status'] },
      { fields: ['transaction_date'] }
    ]
  }
);

// ============================================
// SEQUELIZE HOOKS - Alertas Automáticas
// ============================================

// Hook: Detectar pagos PENDING después de 3 días
Payment.addHook('afterCreate', async (payment: Payment) => {
  try {
    // Solo para pagos PENDING de tipo RENTAL_PAYMENT
    if (payment.status === PaymentStatus.PENDING && payment.payment_type === PaymentType.RENTAL_PAYMENT) {
      // Crear job para verificar en 3 días (esto se hace mejor con cron, pero agregamos el hook como backup)
      logger.debug(`[Hook] Pago ${payment.payment_code} creado como PENDING - Sera monitoreado por alertScheduler`);
    }
  } catch (error) {
    logger.error('[Hook] Error en Payment afterCreate:', error);
  }
});

// Hook: Detectar cuando un pago falla
Payment.addHook('afterUpdate', async (payment: Payment) => {
  try {
    // Si cambió a FAILED, crear alerta crítica inmediata
    if (payment.status === PaymentStatus.FAILED && payment.changed('status')) {
      const customer = await Customer.findByPk(payment.customer_id, {
        attributes: ['id', 'name', 'contact_person', 'email', 'phone']
      });

      let rental = null;
      if (payment.rental_id) {
        rental = await Rental.findByPk(payment.rental_id, {
          attributes: ['id', 'rental_code']
        });
      }

      const existingAlert = await Alert.findOne({
        where: {
          alertType: 'payment_pending',
          entityType: 'payment',
          entityId: payment.id.toString(),
          isResolved: false
        },
        attributes: ['id']
      });

      if (!existingAlert) {
        await Alert.create({
          alertType: 'payment_pending',
          severity: 'critical',
          title: `Pago Fallido: ${payment.payment_code}`,
          message: `El pago de $${payment.amount} del cliente ${customer?.name || customer?.contact_person} ha fallado. ${rental ? `Renta: ${rental.rental_code}` : 'Pago no asociado a renta'}. Método: ${payment.payment_method}`,
          entityType: 'payment',
          entityId: payment.id.toString(),
          metadata: {
            paymentCode: payment.payment_code,
            customerId: payment.customer_id,
            customerName: customer?.name || customer?.contact_person,
            customerEmail: customer?.email,
            customerPhone: customer?.phone,
            amount: payment.amount,
            paymentMethod: payment.payment_method,
            rentalCode: rental?.rental_code,
            transactionDate: payment.transaction_date
          },
          isResolved: false
        });
        logger.debug(`[Hook] Alerta PAYMENT FAILED creada para pago ${payment.payment_code}`);
      }
    }
  } catch (error) {
    logger.error('[Hook] Error en Payment afterUpdate:', error);
  }
});

export default Payment;
