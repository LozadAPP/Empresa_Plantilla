import ItemCategory from '../models/ItemCategory';
import Location from '../models/Location';
import InventoryItem from '../models/InventoryItem';

export async function seedInventoryData() {
  console.log('🌱 Starting inventory seed data...');

  try {
    // 1. Crear categorías
    console.log('  📦 Creating categories...');

    const vehicleCategory = await ItemCategory.findOne({ where: { slug: 'vehicles' } });
    const finalVehicleCategory = vehicleCategory || await ItemCategory.create({
      name: 'Vehículos',
      slug: 'vehicles',
      description: 'Flota de vehículos para renta',
      icon: 'DirectionsCar',
      color: '#8b5cf6',
      types: ['Sedan', 'SUV', 'Camioneta', 'Compacto', 'Lujo'],
      isActive: true,
    });

    const surveyCategory = await ItemCategory.findOne({ where: { slug: 'survey-equipment' } });
    const finalSurveyCategory = surveyCategory || await ItemCategory.create({
      name: 'Equipos Topográficos',
      slug: 'survey-equipment',
      description: 'Equipos de medición y topografía',
      icon: 'Explore',
      color: '#10b981',
      types: ['Estación Total', 'GPS/GNSS', 'Nivel Láser', 'Dron', 'Cámara 360'],
      isActive: true,
    });

    console.log('  ✅ Categories created');

    // 2. Crear ubicaciones
    console.log('  📍 Creating locations...');

    const warehouse = await Location.findOne({ where: { name: 'Almacén Central' } });
    const finalWarehouse = warehouse || await Location.create({
      name: 'Almacén Central',
      address: 'Av. Insurgentes Sur 1458',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'México',
      zipCode: '03900',
      coordinates: { lat: 19.3700, lng: -99.1620 },
      type: 'warehouse',
      contactName: 'Juan García',
      contactPhone: '+52 55 1234 5678',
      contactEmail: 'almacen@movicar.com',
      isActive: true,
    });

    const customerLocation = await Location.findOne({ where: { name: 'Cliente - CDMX Centro' } });
    const finalCustomerLocation = customerLocation || await Location.create({
      name: 'Cliente - CDMX Centro',
      address: 'Av. Paseo de la Reforma 100',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'México',
      zipCode: '06600',
      coordinates: { lat: 19.4326, lng: -99.1332 },
      type: 'customer',
      contactName: 'María López',
      contactPhone: '+52 55 9876 5432',
      contactEmail: 'maria.lopez@empresa.com',
      isActive: true,
    });

    const officeGDL = await Location.findOne({ where: { name: 'Oficina Guadalajara' } });
    const finalOfficeGDL = officeGDL || await Location.create({
      name: 'Oficina Guadalajara',
      address: 'Av. Chapultepec 500',
      city: 'Guadalajara',
      state: 'Jalisco',
      country: 'México',
      zipCode: '44600',
      coordinates: { lat: 20.6597, lng: -103.3496 },
      type: 'office',
      contactName: 'Carlos Ruiz',
      contactPhone: '+52 33 1234 5678',
      contactEmail: 'gdl@movicar.com',
      isActive: true,
    });

    console.log('  ✅ Locations created');

    // 3. Crear artículos de prueba - Vehículos
    console.log('  🚗 Creating inventory items (vehicles)...');

    // Calcular fechas relativas para testing de mantenimiento
    const today = new Date();
    const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000); // Verde (+30 días)
    const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000); // Amarillo (7-30 días)
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);   // Rojo (<7 días)
    const overdue5Days = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // Rojo (vencido)

    const existingVehicle1 = await InventoryItem.findOne({ where: { serialNumber: 'ABC-1234' } });
    if (!existingVehicle1) {
      await InventoryItem.create({
        name: 'Toyota Corolla 2024',
        categoryId: finalVehicleCategory.id,
        categoryName: 'Vehículos',
        type: 'Sedan',
        serialNumber: 'ABC-1234',
        internalCode: 'VEH-001',
        currentLocationId: finalWarehouse.id,
        currentLocationName: finalWarehouse.name,
        currentLocationCity: finalWarehouse.city,
        currentLocationState: finalWarehouse.state,
        currentLocationCoordinates: finalWarehouse.coordinates,
        status: 'available',
        condition: 'excellent',
        purchasePrice: 350000,
        currentValue: 350000,
        rentalPriceDaily: 800,
        purchaseDate: new Date('2024-01-15'),
        lastMaintenanceDate: new Date('2025-10-01'),
        nextMaintenanceDate: in45Days, // VERDE: +45 días
        customFields: {
          make: 'Toyota',
          model: 'Corolla',
          year: 2024,
          color: 'Blanco',
          mileage: 1500,
          fuelType: 'Gasolina',
          transmission: 'Automática',
          licensePlate: 'ABC-1234',
          vin: '1HGBH41JXMN109186',
        },
        notes: 'Vehículo en excelente estado, recientemente adquirido',
      });
    }

    const existingVehicle2 = await InventoryItem.findOne({ where: { serialNumber: 'XYZ-5678' } });
    if (!existingVehicle2) {
      await InventoryItem.create({
        name: 'Honda CR-V 2023',
        categoryId: finalVehicleCategory.id,
        categoryName: 'Vehículos',
        type: 'SUV',
        serialNumber: 'XYZ-5678',
        internalCode: 'VEH-002',
        currentLocationId: finalCustomerLocation.id,
        currentLocationName: finalCustomerLocation.name,
        currentLocationCity: finalCustomerLocation.city,
        currentLocationState: finalCustomerLocation.state,
        currentLocationCoordinates: finalCustomerLocation.coordinates,
        status: 'rented',
        condition: 'good',
        purchasePrice: 450000,
        currentValue: 440000,
        rentalPriceDaily: 1200,
        purchaseDate: new Date('2023-06-10'),
        lastMovementDate: new Date('2025-12-15'),
        lastMaintenanceDate: new Date('2025-11-01'),
        nextMaintenanceDate: in15Days, // AMARILLO: 15 días (parpadeo lento)
        customFields: {
          make: 'Honda',
          model: 'CR-V',
          year: 2023,
          color: 'Gris',
          mileage: 12500,
          fuelType: 'Gasolina',
          transmission: 'Automática',
          licensePlate: 'XYZ-5678',
          vin: '2HGFA16588H123456',
        },
        notes: 'Actualmente rentado a empresa ABC',
      });
    }

    const existingVehicle3 = await InventoryItem.findOne({ where: { serialNumber: 'DEF-9012' } });
    if (!existingVehicle3) {
      await InventoryItem.create({
        name: 'Ford F-150 2024',
        categoryId: finalVehicleCategory.id,
        categoryName: 'Vehículos',
        type: 'Camioneta',
        serialNumber: 'DEF-9012',
        internalCode: 'VEH-003',
        currentLocationId: finalOfficeGDL.id,
        currentLocationName: finalOfficeGDL.name,
        currentLocationCity: finalOfficeGDL.city,
        currentLocationState: finalOfficeGDL.state,
        currentLocationCoordinates: finalOfficeGDL.coordinates,
        status: 'available',
        condition: 'excellent',
        purchasePrice: 650000,
        currentValue: 650000,
        rentalPriceDaily: 1500,
        purchaseDate: new Date('2024-03-20'),
        lastMaintenanceDate: new Date('2025-12-01'),
        nextMaintenanceDate: in3Days, // ROJO: 3 días (parpadeo rápido)
        customFields: {
          make: 'Ford',
          model: 'F-150',
          year: 2024,
          color: 'Negro',
          mileage: 3200,
          fuelType: 'Diesel',
          transmission: 'Automática',
          licensePlate: 'DEF-9012',
          vin: '1FTFW1E84MFA12345',
        },
        notes: 'Camioneta de trabajo pesado - MANTENIMIENTO PRÓXIMO',
      });
    }

    // Vehículo adicional con mantenimiento VENCIDO
    const existingVehicle4 = await InventoryItem.findOne({ where: { serialNumber: 'GHI-3456' } });
    if (!existingVehicle4) {
      await InventoryItem.create({
        name: 'Nissan Sentra 2023',
        categoryId: finalVehicleCategory.id,
        categoryName: 'Vehículos',
        type: 'Sedan',
        serialNumber: 'GHI-3456',
        internalCode: 'VEH-004',
        currentLocationId: finalWarehouse.id,
        currentLocationName: finalWarehouse.name,
        currentLocationCity: finalWarehouse.city,
        currentLocationState: finalWarehouse.state,
        currentLocationCoordinates: { lat: 19.371, lng: -99.163 }, // Ligeramente diferente para ver ambos
        status: 'maintenance',
        condition: 'fair',
        purchasePrice: 320000,
        currentValue: 300000,
        rentalPriceDaily: 700,
        purchaseDate: new Date('2023-02-15'),
        lastMaintenanceDate: new Date('2025-06-01'),
        nextMaintenanceDate: overdue5Days, // ROJO: Vencido hace 5 días (parpadeo rápido)
        customFields: {
          make: 'Nissan',
          model: 'Sentra',
          year: 2023,
          color: 'Azul',
          mileage: 28000,
          fuelType: 'Gasolina',
          transmission: 'Manual',
          licensePlate: 'GHI-3456',
          vin: '3N1AB7AP4KY123456',
        },
        notes: 'URGENTE: Mantenimiento vencido - requiere atención inmediata',
      });
    }

    console.log('  ✅ Vehicle items created');

    // 4. Crear artículos de prueba - Equipos Topográficos
    console.log('  📐 Creating inventory items (survey equipment)...');

    const existingEquip1 = await InventoryItem.findOne({ where: { serialNumber: 'SN-98765' } });
    if (!existingEquip1) {
      await InventoryItem.create({
        name: 'Leica TS16 Total Station',
        categoryId: finalSurveyCategory.id,
        categoryName: 'Equipos Topográficos',
        type: 'Estación Total',
        serialNumber: 'SN-98765',
        internalCode: 'EQ-TS-001',
        currentLocationId: finalWarehouse.id,
        currentLocationName: finalWarehouse.name,
        currentLocationCity: finalWarehouse.city,
        currentLocationState: finalWarehouse.state,
        currentLocationCoordinates: finalWarehouse.coordinates,
        status: 'available',
        condition: 'excellent',
        purchasePrice: 450000,
        currentValue: 450000,
        rentalPriceDaily: 3500,
        purchaseDate: new Date('2023-09-15'),
        lastMaintenanceDate: new Date('2025-11-01'),
        nextMaintenanceDate: new Date('2026-05-01'),
        customFields: {
          brand: 'Leica',
          model: 'TS16',
          year: 2023,
          precision: '1 segundo',
          range: '1000m',
          bluetooth: true,
          wifi: true,
          batteryLife: '8 horas',
          accessories: ['Trípode', 'Prisma', 'Bastón'],
        },
        notes: 'Equipo de alta precisión para levantamientos topográficos',
      });
    }

    const existingEquip2 = await InventoryItem.findOne({ where: { serialNumber: 'GPS-12345' } });
    if (!existingEquip2) {
      await InventoryItem.create({
        name: 'Trimble R12 GNSS',
        categoryId: finalSurveyCategory.id,
        categoryName: 'Equipos Topográficos',
        type: 'GPS/GNSS',
        serialNumber: 'GPS-12345',
        internalCode: 'EQ-GPS-001',
        currentLocationId: finalWarehouse.id,
        currentLocationName: finalWarehouse.name,
        currentLocationCity: finalWarehouse.city,
        currentLocationState: finalWarehouse.state,
        currentLocationCoordinates: finalWarehouse.coordinates,
        status: 'available',
        condition: 'good',
        purchasePrice: 380000,
        currentValue: 370000,
        rentalPriceDaily: 2800,
        purchaseDate: new Date('2023-05-20'),
        customFields: {
          brand: 'Trimble',
          model: 'R12',
          year: 2023,
          precision: 'Sub-centímetro',
          channels: 555,
          rtk: true,
          bluetooth: true,
          batteryLife: '12 horas',
          accessories: ['Controlador', 'Radio', 'Antena'],
        },
        notes: 'GPS de alta precisión con corrección RTK',
      });
    }

    console.log('  ✅ Survey equipment items created');
    console.log('✅ Inventory seed data completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
    throw error;
  }
}
