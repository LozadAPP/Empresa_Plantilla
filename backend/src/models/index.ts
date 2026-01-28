import sequelize from '../config/database';
import Location from './Location';
import Role from './Role';
import User from './User';
import UserRole from './UserRole';
import VehicleType from './VehicleType';
import Vehicle from './Vehicle';
import Customer from './Customer';
import Rental from './Rental';
import Return from './Return';
import Payment from './Payment';
import Invoice from './Invoice';
import Income from './Income';
import AuditLog from './AuditLog';
import MaintenanceType from './MaintenanceType';
import MaintenanceOrder from './MaintenanceOrder';
import Account from './Account';
import Transaction from './Transaction';
import Alert from './Alert';
import SystemConfig from './SystemConfig';
import PriceConfig from './PriceConfig';
// Inventory Management Models
import ItemCategory from './ItemCategory';
import InventoryItem from './InventoryItem';
import InventoryMovement from './InventoryMovement';
// Security Models
import TokenBlacklist from './TokenBlacklist';

// ============================================
// ASSOCIATIONS / RELATIONSHIPS
// ============================================

// User - Location (Many-to-One)
User.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(User, { foreignKey: 'location_id', as: 'users' });

// User - Role (Many-to-Many through UserRole)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', as: 'roles' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', as: 'users' });

// UserRole - Location (Many-to-One)
UserRole.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(UserRole, { foreignKey: 'location_id', as: 'userRoles' });

// Vehicle - VehicleType (Many-to-One)
Vehicle.belongsTo(VehicleType, { foreignKey: 'vehicle_type_id', as: 'vehicleType' });
VehicleType.hasMany(Vehicle, { foreignKey: 'vehicle_type_id', as: 'vehicles' });

// Vehicle - Location (Many-to-One)
Vehicle.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(Vehicle, { foreignKey: 'location_id', as: 'vehicles' });

// AuditLog - User (Many-to-One)
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

// Rental - Vehicle (Many-to-One)
Rental.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Vehicle.hasMany(Rental, { foreignKey: 'vehicle_id', as: 'rentals' });

// Rental - Customer (Many-to-One)
Rental.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Rental, { foreignKey: 'customer_id', as: 'rentals' });

// Rental - User (Many-to-One) - created by
Rental.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Rental, { foreignKey: 'created_by', as: 'createdRentals' });

// Return - Rental (Many-to-One)
Return.belongsTo(Rental, { foreignKey: 'rental_id', as: 'rental', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Rental.hasOne(Return, { foreignKey: 'rental_id', as: 'return', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Return - Vehicle (Many-to-One)
Return.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Vehicle.hasMany(Return, { foreignKey: 'vehicle_id', as: 'returns' });

// Return - Location (Many-to-One)
Return.belongsTo(Location, { foreignKey: 'return_location_id', as: 'returnLocation' });
Location.hasMany(Return, { foreignKey: 'return_location_id', as: 'returns' });

// Return - User (Many-to-One) - inspected by
Return.belongsTo(User, { foreignKey: 'inspected_by', as: 'inspector', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Return, { foreignKey: 'inspected_by', as: 'inspectedReturns' });

// Payment - Customer (Many-to-One)
Payment.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Customer.hasMany(Payment, { foreignKey: 'customer_id', as: 'payments', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Payment - Rental (Many-to-One)
Payment.belongsTo(Rental, { foreignKey: 'rental_id', as: 'rental', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Rental.hasMany(Payment, { foreignKey: 'rental_id', as: 'payments', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Payment - Invoice (Many-to-One)
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });

// Payment - User (Many-to-One) - processed by
Payment.belongsTo(User, { foreignKey: 'processed_by', as: 'processor', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Payment, { foreignKey: 'processed_by', as: 'processedPayments' });

// Invoice - Rental (Many-to-One)
Invoice.belongsTo(Rental, { foreignKey: 'rental_id', as: 'rental', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Rental.hasMany(Invoice, { foreignKey: 'rental_id', as: 'invoices', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Invoice - Customer (Many-to-One)
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Customer.hasMany(Invoice, { foreignKey: 'customer_id', as: 'invoices', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Invoice - User (Many-to-One) - created by
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Invoice, { foreignKey: 'created_by', as: 'createdInvoices' });

// Income - Rental (Many-to-One)
Income.belongsTo(Rental, { foreignKey: 'rental_id', as: 'rental' });
Rental.hasMany(Income, { foreignKey: 'rental_id', as: 'incomes' });

// Income - Payment (Many-to-One)
Income.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
Payment.hasMany(Income, { foreignKey: 'payment_id', as: 'incomes' });

// Income - Location (Many-to-One)
Income.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(Income, { foreignKey: 'location_id', as: 'incomes' });

// Income - User (Many-to-One) - recorded by
Income.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Income, { foreignKey: 'recorded_by', as: 'recordedIncomes' });

// MaintenanceOrder - Vehicle (Many-to-One)
MaintenanceOrder.belongsTo(Vehicle, { foreignKey: 'vehicle_id', as: 'vehicle' });
Vehicle.hasMany(MaintenanceOrder, { foreignKey: 'vehicle_id', as: 'maintenanceOrders' });

// MaintenanceOrder - MaintenanceType (Many-to-One)
MaintenanceOrder.belongsTo(MaintenanceType, { foreignKey: 'maintenance_type_id', as: 'maintenanceType' });
MaintenanceType.hasMany(MaintenanceOrder, { foreignKey: 'maintenance_type_id', as: 'orders' });

// MaintenanceOrder - User (Many-to-One) - created by
MaintenanceOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(MaintenanceOrder, { foreignKey: 'created_by', as: 'createdMaintenanceOrders' });

// Transaction - Account (Many-to-One)
Transaction.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });
Account.hasMany(Transaction, { foreignKey: 'account_id', as: 'transactions' });

// Transaction - Location (Many-to-One)
Transaction.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(Transaction, { foreignKey: 'location_id', as: 'transactions' });

// Transaction - User (Many-to-One) - created by
Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Transaction, { foreignKey: 'created_by', as: 'createdTransactions' });

// Transaction - User (Many-to-One) - approved by
Transaction.belongsTo(User, { foreignKey: 'approved_by', as: 'approver', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Transaction, { foreignKey: 'approved_by', as: 'approvedTransactions' });

// Account - Account (Self-referencing for hierarchy)
Account.belongsTo(Account, { foreignKey: 'parent_account_id', as: 'parentAccount' });
Account.hasMany(Account, { foreignKey: 'parent_account_id', as: 'subAccounts' });

// Alert - User (Many-to-One) - assigned to
Alert.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Alert, { foreignKey: 'assigned_to', as: 'assignedAlerts' });

// Alert - User (Many-to-One) - resolved by
Alert.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(Alert, { foreignKey: 'resolved_by', as: 'resolvedAlerts' });

// PriceConfig - VehicleType (Many-to-One)
PriceConfig.belongsTo(VehicleType, { foreignKey: 'vehicle_type_id', as: 'vehicleType' });
VehicleType.hasMany(PriceConfig, { foreignKey: 'vehicle_type_id', as: 'priceConfigs' });

// PriceConfig - Location (Many-to-One)
PriceConfig.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(PriceConfig, { foreignKey: 'location_id', as: 'priceConfigs' });

// PriceConfig - User (Many-to-One) - created by
PriceConfig.belongsTo(User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(PriceConfig, { foreignKey: 'created_by', as: 'createdPriceConfigs' });

// SystemConfig - User (Many-to-One) - updated by
SystemConfig.belongsTo(User, { foreignKey: 'updated_by', as: 'updater', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(SystemConfig, { foreignKey: 'updated_by', as: 'updatedConfigs' });

// ============================================
// INVENTORY MANAGEMENT ASSOCIATIONS
// ============================================

// InventoryItem - ItemCategory (Many-to-One)
InventoryItem.belongsTo(ItemCategory, { foreignKey: 'category_id', as: 'category' });
ItemCategory.hasMany(InventoryItem, { foreignKey: 'category_id', as: 'items' });

// InventoryItem - Location (Many-to-One) - current location
InventoryItem.belongsTo(Location, { foreignKey: 'current_location_id', as: 'currentLocation' });
Location.hasMany(InventoryItem, { foreignKey: 'current_location_id', as: 'inventoryItems' });

// InventoryItem - Customer (Many-to-One) - current customer (optional)
InventoryItem.belongsTo(Customer, { foreignKey: 'current_customer_id', as: 'currentCustomer' });
Customer.hasMany(InventoryItem, { foreignKey: 'current_customer_id', as: 'inventoryItems' });

// InventoryMovement - InventoryItem (Many-to-One)
InventoryMovement.belongsTo(InventoryItem, { foreignKey: 'item_id', as: 'item', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
InventoryItem.hasMany(InventoryMovement, { foreignKey: 'item_id', as: 'movements', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// InventoryMovement - Location (Many-to-One) - from location
InventoryMovement.belongsTo(Location, { foreignKey: 'from_location_id', as: 'fromLocation' });
Location.hasMany(InventoryMovement, { foreignKey: 'from_location_id', as: 'movementsFrom' });

// InventoryMovement - Location (Many-to-One) - to location
InventoryMovement.belongsTo(Location, { foreignKey: 'to_location_id', as: 'toLocation' });
Location.hasMany(InventoryMovement, { foreignKey: 'to_location_id', as: 'movementsTo' });

// InventoryMovement - Customer (Many-to-One) - optional
InventoryMovement.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(InventoryMovement, { foreignKey: 'customer_id', as: 'inventoryMovements' });

// InventoryMovement - User (Many-to-One) - registered by
InventoryMovement.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
User.hasMany(InventoryMovement, { foreignKey: 'user_id', as: 'inventoryMovements' });

// ============================================
// SYNC DATABASE
// ============================================

const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force, logging: false }); // Sin logs de cada tabla
    console.log('✅ Tables synchronized');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

// ============================================
// EXPORTS
// ============================================

export {
  sequelize,
  syncDatabase,
  Location,
  Role,
  User,
  UserRole,
  VehicleType,
  Vehicle,
  Customer,
  Rental,
  Return,
  Payment,
  Invoice,
  Income,
  AuditLog,
  MaintenanceType,
  MaintenanceOrder,
  Account,
  Transaction,
  Alert,
  SystemConfig,
  PriceConfig,
  ItemCategory,
  InventoryItem,
  InventoryMovement,
  TokenBlacklist
};

export default {
  sequelize,
  syncDatabase,
  Location,
  Role,
  User,
  UserRole,
  VehicleType,
  Vehicle,
  Customer,
  Rental,
  Return,
  Payment,
  Invoice,
  Income,
  AuditLog,
  MaintenanceType,
  MaintenanceOrder,
  Account,
  Transaction,
  Alert,
  SystemConfig,
  PriceConfig,
  ItemCategory,
  InventoryItem,
  InventoryMovement,
  TokenBlacklist
};
