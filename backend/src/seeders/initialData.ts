import { Location, Role, User, UserRole, VehicleType, Vehicle, Customer, MaintenanceType } from '../models';

export const seedInitialData = async (): Promise<void> => {
  console.log('🌱 Seeding initial data...');

  try {
    // Create Locations
    const locations = await Location.bulkCreate([
      { name: 'México', city: 'Ciudad de México', state: 'CDMX', country: 'México', address: 'Av. Reforma 123', contactPhone: '+52-55-1234-5678', contactEmail: 'mexico@movicar.com', coordinates: { lat: 19.432608, lng: -99.133209 }, type: 'office' as const },
      { name: 'Bogotá', city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', address: 'Calle 100 #45-67', contactPhone: '+57-1-234-5678', contactEmail: 'bogota@movicar.com', coordinates: { lat: 4.710989, lng: -74.072092 }, type: 'office' as const },
      { name: 'Lima', city: 'Lima', state: 'Lima', country: 'Perú', address: 'Av. Javier Prado 890', contactPhone: '+51-1-234-5678', contactEmail: 'lima@movicar.com', coordinates: { lat: -12.046374, lng: -77.042793 }, type: 'office' as const }
    ], { ignoreDuplicates: true });
    console.log('✅ Locations created');

    // Create Roles (16 roles completos del sistema)
    const roles = await Role.bulkCreate([
      // Roles base
      { name: 'admin', description: 'Administrador del Sistema - Acceso total', permissions: ['*'] },
      { name: 'director', description: 'Director con acceso a todas las ubicaciones', permissions: ['read:*', 'write:*', 'delete:*'] },
      { name: 'manager', description: 'Gerente con acceso específico por ubicación', permissions: ['read:*', 'write:rentals', 'write:vehicles', 'write:customers'] },
      { name: 'seller', description: 'Seller (alias) con acceso a rentas', permissions: ['read:*', 'write:rentals', 'write:customers'] },
      { name: 'vendedor', description: 'Vendedor - Crear rentas y clientes', permissions: ['read:*', 'write:rentals', 'write:customers'] },
      { name: 'accountant', description: 'Contador con acceso financiero', permissions: ['read:*', 'write:payments', 'read:reports'] },
      { name: 'inventory', description: 'Encargado de inventario', permissions: ['read:*', 'write:vehicles', 'write:maintenance'] },
      // Roles adicionales del sistema de 12 roles
      { name: 'director_general', description: 'Director General - Ver todas las sedes, gestión completa', permissions: ['read:*', 'write:*', 'delete:*'] },
      { name: 'jefe_inventarios', description: 'Jefe de Inventarios - CRUD vehículos, estadísticas', permissions: ['read:*', 'write:vehicles', 'write:maintenance', 'read:reports'] },
      { name: 'jefe_ventas', description: 'Jefe de Ventas - Rentas, clientes, reportes ventas', permissions: ['read:*', 'write:rentals', 'write:customers', 'read:reports'] },
      { name: 'jefe_finanzas', description: 'Jefe de Finanzas - Contabilidad, pagos, reportes', permissions: ['read:*', 'write:payments', 'write:accounting', 'read:reports'] },
      { name: 'jefe_admin', description: 'Jefe Administrativo - Usuarios, configuración, auditoría', permissions: ['read:*', 'write:users', 'write:config', 'read:audit'] },
      { name: 'encargado_inventario', description: 'Encargado de Inventario - CRUD vehículos básico', permissions: ['read:vehicles', 'write:vehicles', 'read:maintenance'] },
      { name: 'tecnico', description: 'Técnico de Mantenimiento - Órdenes de mantenimiento', permissions: ['read:vehicles', 'read:maintenance', 'write:maintenance'] },
      { name: 'contador', description: 'Contador - Ver finanzas, reportes', permissions: ['read:*', 'read:reports', 'read:accounting'] },
      { name: 'cajero', description: 'Cajero - Procesar pagos', permissions: ['read:rentals', 'read:customers', 'write:payments'] },
      { name: 'asistente_admin', description: 'Asistente Administrativo - Soporte administrativo', permissions: ['read:*'] }
    ], { ignoreDuplicates: true });
    console.log('✅ Roles created (16 roles)');

    // Create Maintenance Types
    await MaintenanceType.bulkCreate([
      { name: 'Cambio de aceite', description: 'Cambio de aceite de motor y filtro', estimatedCost: 800, estimatedDuration: 2, isActive: true },
      { name: 'Alineación y balanceo', description: 'Alineación de dirección y balanceo de ruedas', estimatedCost: 600, estimatedDuration: 2, isActive: true },
      { name: 'Cambio de frenos', description: 'Revisión y cambio de pastillas/balatas de freno', estimatedCost: 1500, estimatedDuration: 3, isActive: true },
      { name: 'Revisión general', description: 'Revisión de 21 puntos del vehículo', estimatedCost: 500, estimatedDuration: 2, isActive: true },
      { name: 'Cambio de llantas', description: 'Sustitución de llantas desgastadas', estimatedCost: 4000, estimatedDuration: 2, isActive: true },
      { name: 'Servicio mayor', description: 'Servicio completo: aceite, filtros, bujías, revisión general', estimatedCost: 3500, estimatedDuration: 6, isActive: true },
      { name: 'Reparación de motor', description: 'Diagnóstico y reparación de fallas de motor', estimatedCost: 8000, estimatedDuration: 24, isActive: true },
      { name: 'Cambio de batería', description: 'Sustitución de batería del vehículo', estimatedCost: 2500, estimatedDuration: 1, isActive: true },
      { name: 'Sistema de enfriamiento', description: 'Revisión y reparación del sistema de enfriamiento', estimatedCost: 1200, estimatedDuration: 4, isActive: true },
      { name: 'Transmisión', description: 'Servicio de transmisión automática/manual', estimatedCost: 2000, estimatedDuration: 4, isActive: true },
      { name: 'Sistema eléctrico', description: 'Diagnóstico y reparación del sistema eléctrico', estimatedCost: 1000, estimatedDuration: 3, isActive: true },
      { name: 'Aire acondicionado', description: 'Recarga y revisión del sistema de A/C', estimatedCost: 1500, estimatedDuration: 3, isActive: true },
      { name: 'Suspensión', description: 'Revisión y reparación de suspensión', estimatedCost: 2500, estimatedDuration: 5, isActive: true },
      { name: 'Hojalatería y pintura', description: 'Reparación de carrocería y pintura', estimatedCost: 5000, estimatedDuration: 48, isActive: true },
      { name: 'Limpieza profunda', description: 'Detallado interior y exterior del vehículo', estimatedCost: 800, estimatedDuration: 4, isActive: true }
    ], { ignoreDuplicates: true });
    console.log('✅ Maintenance types created (15 types)');

    // Create Admin User
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const mexicoLocation = await Location.findOne({ where: { name: 'México' } });

    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@movicar.com' },
      defaults: {
        email: 'admin@movicar.com',
        password_hash: 'Admin123!', // El modelo lo hasheará automáticamente con su hook beforeCreate
        first_name: 'Admin',
        last_name: 'Sistema',
        phone: '+52-55-0000-0000',
        location_id: mexicoLocation?.id,
        is_active: true
      }
    });

    if (adminRole && adminUser) {
      await UserRole.findOrCreate({
        where: { user_id: adminUser.id, role_id: adminRole.id },
        defaults: { user_id: adminUser.id, role_id: adminRole.id }
      });
    }
    console.log('✅ Admin user created');

    // Create Vehicle Types
    const vehicleTypes = await VehicleType.bulkCreate([
      { name: 'Compacto', description: 'Vehículos compactos económicos', daily_rate: 1500 },
      { name: 'Sedán', description: 'Sedanes de gama media', daily_rate: 2000 },
      { name: 'SUV', description: 'Camionetas y SUVs', daily_rate: 2800 },
      { name: 'Van Ejecutiva', description: 'Vans para grupos ejecutivos', daily_rate: 3500 },
      { name: 'Premium', description: 'Vehículos de lujo', daily_rate: 5000 }
    ], { ignoreDuplicates: true });
    console.log('✅ Vehicle types created');

    // Create Sample Vehicles
    const compactoType = await VehicleType.findOne({ where: { name: 'Compacto' } });
    const sedanType = await VehicleType.findOne({ where: { name: 'Sedán' } });
    const suvType = await VehicleType.findOne({ where: { name: 'SUV' } });

    const sampleVehicles = [
      { make: 'Toyota', model: 'Corolla', license_plate: 'MOV-001', vin: 'JTDH1RU14R0000001', year: 2024, color: 'Blanco', vehicle_type_id: sedanType?.id, location_id: mexicoLocation?.id, daily_rate: 2000, purchase_price: 350000, current_value: 340000, monthly_depreciation: 3500, mileage: 5000, fuel_type: 'gasoline', transmission: 'automatic', condition: 'excellent', status: 'available' },
      { make: 'Honda', model: 'Civic', license_plate: 'MOV-002', vin: 'JTDH1RU14R0000002', year: 2024, color: 'Negro', vehicle_type_id: sedanType?.id, location_id: mexicoLocation?.id, daily_rate: 2100, purchase_price: 380000, current_value: 370000, monthly_depreciation: 3800, mileage: 3000, fuel_type: 'gasoline', transmission: 'automatic', condition: 'excellent', status: 'available' },
      { make: 'Nissan', model: 'Versa', license_plate: 'MOV-003', vin: 'JTDH1RU14R0000003', year: 2023, color: 'Gris', vehicle_type_id: compactoType?.id, location_id: mexicoLocation?.id, daily_rate: 1500, purchase_price: 280000, current_value: 260000, monthly_depreciation: 2800, mileage: 15000, fuel_type: 'gasoline', transmission: 'automatic', condition: 'good', status: 'rented' },
      { make: 'Toyota', model: 'RAV4', license_plate: 'MOV-004', vin: 'JTDH1RU14R0000004', year: 2024, color: 'Azul', vehicle_type_id: suvType?.id, location_id: mexicoLocation?.id, daily_rate: 2800, purchase_price: 520000, current_value: 510000, monthly_depreciation: 5200, mileage: 2000, fuel_type: 'gasoline', transmission: 'automatic', condition: 'excellent', status: 'available' },
      { make: 'Hyundai', model: 'Tucson', license_plate: 'MOV-005', vin: 'JTDH1RU14R0000005', year: 2023, color: 'Rojo', vehicle_type_id: suvType?.id, location_id: mexicoLocation?.id, daily_rate: 2700, purchase_price: 480000, current_value: 450000, monthly_depreciation: 4800, mileage: 12000, fuel_type: 'gasoline', transmission: 'automatic', condition: 'good', status: 'maintenance' }
    ];

    for (const vehicleData of sampleVehicles) {
      await Vehicle.findOrCreate({
        where: { license_plate: vehicleData.license_plate },
        defaults: vehicleData as any
      });
    }
    console.log('✅ Sample vehicles created');

    // Create Sample Customers
    const sampleCustomers = [
      { name: 'Turismo XYZ SA de CV', contact_person: 'José García', email: 'jose@turisxyz.com', phone: '+52-55-1111-1111', city: 'Ciudad de México', country: 'México', customer_type: 'corporate', credit_limit: 100000, payment_terms: 30 },
      { name: 'Geo Solutions Colombia', contact_person: 'María López', email: 'maria@geosolutions.co', phone: '+57-1-222-2222', city: 'Bogotá', country: 'Colombia', customer_type: 'corporate', credit_limit: 80000, payment_terms: 30 },
      { name: 'Consultores ABC Perú', contact_person: 'Juan Pérez', email: 'juan@consultoresabc.pe', phone: '+51-1-333-3333', city: 'Lima', country: 'Perú', customer_type: 'corporate', credit_limit: 60000, payment_terms: 15 },
      { name: 'Roberto Martínez', contact_person: 'Roberto Martínez', email: 'roberto.martinez@gmail.com', phone: '+52-55-4444-4444', city: 'Guadalajara', country: 'México', customer_type: 'individual', credit_limit: 20000, payment_terms: 0 },
      { name: 'Gobierno Estado de México', contact_person: 'Lic. Carlos Ruiz', email: 'carlos.ruiz@gob.mx', phone: '+52-55-5555-5555', city: 'Toluca', country: 'México', customer_type: 'government', credit_limit: 500000, payment_terms: 60 }
    ];

    for (const customerData of sampleCustomers) {
      await Customer.findOrCreate({
        where: { email: customerData.email },
        defaults: customerData as any
      });
    }
    console.log('✅ Sample customers created');

    console.log('🎉 Initial data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  import('../config/database').then(async ({ testConnection }) => {
    await testConnection();
    await import('../models').then(({ syncDatabase }) => syncDatabase(true));
    await seedInitialData();
    process.exit(0);
  }).catch((error) => {
    console.error('Failed to seed:', error);
    process.exit(1);
  });
}

export default seedInitialData;
