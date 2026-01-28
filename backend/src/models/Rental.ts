import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Alert from './Alert';
import Customer from './Customer';
import Vehicle from './Vehicle';

export enum RentalStatus {
  RESERVED = 'reserved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  TRANSFER = 'transfer',
  CHECK = 'check'
}

interface RentalAttributes {
  id: number;
  rental_code: string;
  customer_id: number;
  vehicle_id: number;
  location_id: number;
  return_location_id?: number;
  start_date: Date;
  end_date: Date;
  actual_return_date?: Date;
  days: number;
  daily_rate: number;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount_percentage?: number;
  discount_amount?: number;
  insurance_amount?: number;
  extras_amount?: number;
  total_amount: number;
  deposit_amount?: number;
  payment_method?: PaymentMethod;
  status: RentalStatus;
  created_by?: number;
  start_mileage?: number;
  end_mileage?: number;
  fuel_level_start?: string;
  fuel_level_end?: string;
  notes?: string;
  contract_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface RentalCreationAttributes extends Optional<RentalAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Rental extends Model<RentalAttributes, RentalCreationAttributes> implements RentalAttributes {
  public id!: number;
  public rental_code!: string;
  public customer_id!: number;
  public vehicle_id!: number;
  public location_id!: number;
  public return_location_id?: number;
  public start_date!: Date;
  public end_date!: Date;
  public actual_return_date?: Date;
  public days!: number;
  public daily_rate!: number;
  public subtotal!: number;
  public tax_percentage!: number;
  public tax_amount!: number;
  public discount_percentage?: number;
  public discount_amount?: number;
  public insurance_amount?: number;
  public extras_amount?: number;
  public total_amount!: number;
  public deposit_amount?: number;
  public payment_method?: PaymentMethod;
  public status!: RentalStatus;
  public created_by?: number;
  public start_mileage?: number;
  public end_mileage?: number;
  public fuel_level_start?: string;
  public fuel_level_end?: string;
  public notes?: string;
  public contract_url?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Rental.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    rental_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    return_location_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    actual_return_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    days: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 16
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    insurance_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    extras_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(RentalStatus)),
      allowNull: false,
      defaultValue: RentalStatus.RESERVED
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    start_mileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    end_mileage: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fuel_level_start: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    fuel_level_end: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contract_url: {
      type: DataTypes.TEXT,
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
    tableName: 'rentals',
    timestamps: false
  }
);

// ============================================
// SEQUELIZE HOOKS - Alertas Automáticas
// ============================================

// Hook: Detectar cambio de status a OVERDUE o rentas próximas a vencer
Rental.addHook('afterUpdate', async (rental: Rental) => {
  try {
    // Si cambió a OVERDUE, crear alerta crítica
    if (rental.status === RentalStatus.OVERDUE && rental.changed('status')) {
      const customer = await Customer.findByPk(rental.customer_id, {
        attributes: ['id', 'name', 'contact_person', 'email', 'phone']
      });
      const vehicle = await Vehicle.findByPk(rental.vehicle_id, {
        attributes: ['id', 'make', 'model', 'license_plate']
      });

      const existingAlert = await Alert.findOne({
        where: {
          alertType: 'rental_overdue',
          entityType: 'rental',
          entityId: rental.id.toString(),
          isResolved: false
        },
        attributes: ['id']
      });

      if (!existingAlert) {
        const customerName = customer?.name || customer?.contact_person;
        await Alert.create({
          alertType: 'rental_overdue',
          severity: 'critical',
          title: `Renta Vencida: ${rental.rental_code}`,
          message: `La renta del vehículo ${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate}) para el cliente ${customerName} está vencida. Fecha esperada: ${rental.end_date.toLocaleDateString()}`,
          entityType: 'rental',
          entityId: rental.id.toString(),
          metadata: {
            rentalCode: rental.rental_code,
            customerId: rental.customer_id,
            customerName: customerName,
            vehicleId: rental.vehicle_id,
            vehiclePlate: vehicle?.license_plate,
            endDate: rental.end_date,
            daysOverdue: Math.floor((new Date().getTime() - new Date(rental.end_date).getTime()) / (1000 * 60 * 60 * 24))
          },
          isResolved: false
        });
        console.log(`[Hook] Alerta OVERDUE creada para renta ${rental.rental_code}`);
      }
    }

    // Si se está acercando la fecha de fin (7 días), crear alerta warning
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const eightDaysFromNow = new Date();
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);

    if (
      rental.status === RentalStatus.ACTIVE &&
      new Date(rental.end_date) >= sevenDaysFromNow &&
      new Date(rental.end_date) < eightDaysFromNow
    ) {
      const customer = await Customer.findByPk(rental.customer_id, {
        attributes: ['id', 'name', 'contact_person', 'email', 'phone']
      });
      const vehicle = await Vehicle.findByPk(rental.vehicle_id, {
        attributes: ['id', 'make', 'model', 'license_plate']
      });

      const existingAlert = await Alert.findOne({
        where: {
          alertType: 'rental_expiring',
          entityType: 'rental',
          entityId: rental.id.toString(),
          isResolved: false
        },
        attributes: ['id']
      });

      if (!existingAlert) {
        const customerName = customer?.name || customer?.contact_person;
        await Alert.create({
          alertType: 'rental_expiring',
          severity: 'warning',
          title: `Renta por Vencer: ${rental.rental_code}`,
          message: `La renta del vehículo ${vehicle?.make} ${vehicle?.model} (${vehicle?.license_plate}) para el cliente ${customerName} vence en 7 días. Fecha: ${rental.end_date.toLocaleDateString()}`,
          entityType: 'rental',
          entityId: rental.id.toString(),
          metadata: {
            rentalCode: rental.rental_code,
            customerId: rental.customer_id,
            customerName: customerName,
            customerEmail: customer?.email,
            customerPhone: customer?.phone,
            vehicleId: rental.vehicle_id,
            vehiclePlate: vehicle?.license_plate,
            endDate: rental.end_date,
            daysUntilDue: 7
          },
          isResolved: false
        });
        console.log(`[Hook] Alerta EXPIRING creada para renta ${rental.rental_code}`);
      }
    }
  } catch (error) {
    console.error('[Hook] Error creando alerta en Rental:', error);
  }
});

export default Rental;
