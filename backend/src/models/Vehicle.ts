import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Alert from './Alert';

// Enum para estados del vehículo
export enum VehicleStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance'
}

interface VehicleAttributes {
  id: number;
  make: string;
  model: string;
  license_plate: string;
  vin: string;
  year: number;
  color?: string;
  vehicle_type_id: number;
  status: 'available' | 'rented' | 'maintenance';
  location_id: number;
  purchase_price: number;
  current_value: number;
  monthly_depreciation: number;
  mileage: number;
  fuel_type?: string;
  transmission?: string;
  engine?: string;
  power?: string;
  purchase_date?: Date;
  insurance_expiry?: Date;
  next_maintenance?: Date;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  is_premium: boolean;
  has_driver: boolean;
  is_active: boolean;
  daily_rate: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface VehicleCreationAttributes extends Optional<VehicleAttributes, 'id' | 'status' | 'mileage' | 'condition' | 'is_premium' | 'has_driver' | 'is_active' | 'created_at' | 'updated_at'> {}

class Vehicle extends Model<VehicleAttributes, VehicleCreationAttributes> implements VehicleAttributes {
  public id!: number;
  public make!: string;
  public model!: string;
  public license_plate!: string;
  public vin!: string;
  public year!: number;
  public color?: string;
  public vehicle_type_id!: number;
  public status!: 'available' | 'rented' | 'maintenance';
  public location_id!: number;
  public purchase_price!: number;
  public current_value!: number;
  public monthly_depreciation!: number;
  public mileage!: number;
  public fuel_type?: string;
  public transmission?: string;
  public engine?: string;
  public power?: string;
  public purchase_date?: Date;
  public insurance_expiry?: Date;
  public next_maintenance?: Date;
  public condition!: 'excellent' | 'good' | 'fair' | 'poor';
  public is_premium!: boolean;
  public has_driver!: boolean;
  public is_active!: boolean;
  public daily_rate!: number;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual field for full name
  public get fullName(): string {
    return `${this.make} ${this.model} ${this.year}`;
  }
}

Vehicle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    make: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    license_plate: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    vin: {
      type: DataTypes.STRING(17),
      allowNull: false,
      unique: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1990,
        max: new Date().getFullYear() + 1
      }
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    vehicle_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vehicle_types',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('available', 'rented', 'maintenance'),
      defaultValue: 'available'
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    purchase_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    current_value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    monthly_depreciation: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    mileage: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    fuel_type: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    transmission: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    engine: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    power: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    insurance_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    next_maintenance: {
      type: DataTypes.DATE,
      allowNull: true
    },
    condition: {
      type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
      defaultValue: 'excellent'
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_driver: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    notes: {
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
    tableName: 'vehicles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['status'] },
      { fields: ['location_id'] },
      { fields: ['license_plate'] },
      { fields: ['vehicle_type_id'] }
    ]
  }
);

// ============================================
// SEQUELIZE HOOKS - Alertas Automáticas
// ============================================

// Hook: Detectar cuando un vehículo requiere mantenimiento
Vehicle.addHook('afterUpdate', async (vehicle: Vehicle) => {
  try {
    // Si cambió a MAINTENANCE, crear alerta warning
    if (vehicle.status === 'maintenance' && vehicle.changed('status')) {
      const existingAlert = await Alert.findOne({
        where: {
          alertType: 'maintenance_due',
          entityType: 'vehicle',
          entityId: vehicle.id.toString(),
          isResolved: false
        },
        attributes: ['id']
      });

      if (!existingAlert) {
        await Alert.create({
          alertType: 'maintenance_due',
          severity: 'warning',
          title: `Vehículo en Mantenimiento: ${vehicle.license_plate}`,
          message: `El vehículo ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) ha entrado a mantenimiento. ${vehicle.next_maintenance ? `Próximo mantenimiento: ${vehicle.next_maintenance.toLocaleDateString()}` : ''}`,
          entityType: 'vehicle',
          entityId: vehicle.id.toString(),
          metadata: {
            licensePlate: vehicle.license_plate,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            mileage: vehicle.mileage,
            nextMaintenance: vehicle.next_maintenance,
            notes: vehicle.notes
          },
          isResolved: false
        });
        console.log(`[Hook] Alerta MAINTENANCE creada para vehículo ${vehicle.license_plate}`);
      }
    }

    // Si el seguro está por vencer (30 días o menos)
    if (vehicle.insurance_expiry && vehicle.changed('insurance_expiry')) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyOneDaysFromNow = new Date();
      thirtyOneDaysFromNow.setDate(thirtyOneDaysFromNow.getDate() + 31);

      if (
        new Date(vehicle.insurance_expiry) <= thirtyDaysFromNow &&
        new Date(vehicle.insurance_expiry) > new Date()
      ) {
        const existingAlert = await Alert.findOne({
          where: {
            alertType: 'insurance_expiring',
            entityType: 'vehicle',
            entityId: vehicle.id.toString(),
            isResolved: false
          },
          attributes: ['id']
        });

        if (!existingAlert) {
          const daysUntilExpiry = Math.ceil(
            (new Date(vehicle.insurance_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          await Alert.create({
            alertType: 'insurance_expiring',
            severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
            title: `Seguro por Vencer: ${vehicle.license_plate}`,
            message: `El seguro del vehículo ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) vence en ${daysUntilExpiry} día(s). Fecha de vencimiento: ${vehicle.insurance_expiry.toLocaleDateString()}`,
            entityType: 'vehicle',
            entityId: vehicle.id.toString(),
            metadata: {
              licensePlate: vehicle.license_plate,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              insuranceExpiry: vehicle.insurance_expiry,
              daysUntilExpiry
            },
            isResolved: false
          });
          console.log(`[Hook] Alerta INSURANCE EXPIRING creada para vehículo ${vehicle.license_plate}`);
        }
      }
    }

    // Si el mantenimiento está programado próximamente (7 días o menos)
    if (vehicle.next_maintenance && vehicle.changed('next_maintenance')) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      if (
        new Date(vehicle.next_maintenance) <= sevenDaysFromNow &&
        new Date(vehicle.next_maintenance) > new Date()
      ) {
        const existingAlert = await Alert.findOne({
          where: {
            alertType: 'maintenance_due',
            entityType: 'vehicle',
            entityId: vehicle.id.toString(),
            isResolved: false
          },
          attributes: ['id']
        });

        if (!existingAlert) {
          const daysUntilMaintenance = Math.ceil(
            (new Date(vehicle.next_maintenance).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          await Alert.create({
            alertType: 'maintenance_due',
            severity: 'info',
            title: `Mantenimiento Programado: ${vehicle.license_plate}`,
            message: `El vehículo ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) tiene mantenimiento programado en ${daysUntilMaintenance} día(s). Fecha: ${vehicle.next_maintenance.toLocaleDateString()}`,
            entityType: 'vehicle',
            entityId: vehicle.id.toString(),
            metadata: {
              licensePlate: vehicle.license_plate,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              mileage: vehicle.mileage,
              nextMaintenance: vehicle.next_maintenance,
              daysUntilMaintenance
            },
            isResolved: false
          });
          console.log(`[Hook] Alerta MAINTENANCE DUE creada para vehículo ${vehicle.license_plate}`);
        }
      }
    }
  } catch (error) {
    console.error('[Hook] Error en Vehicle afterUpdate:', error);
  }
});

export default Vehicle;
