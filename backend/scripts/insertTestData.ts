/**
 * Script para insertar datos de prueba directamente con SQL
 * Ejecutar con: npx ts-node scripts/insertTestData.ts
 */

import sequelize from '../src/config/database';

async function insertTestData() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    const today = new Date();
    const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
    const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const overdue5Days = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

    // Primero verificar si hay categorías
    const [categories] = await sequelize.query(`
      SELECT id, name FROM item_categories LIMIT 1;
    `);

    let categoryId = 1;
    if ((categories as any[]).length === 0) {
      console.log('📦 Creando categoría de vehículos...');
      await sequelize.query(`
        INSERT INTO item_categories (name, slug, description, icon, color, types, is_active, created_at, updated_at)
        VALUES ('Vehículos', 'vehicles', 'Flota de vehículos', 'DirectionsCar', '#8b5cf6', '["Sedan", "SUV", "Camioneta"]', true, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING;
      `);
      const [newCat] = await sequelize.query(`SELECT id FROM item_categories WHERE slug = 'vehicles' LIMIT 1;`);
      if ((newCat as any[]).length > 0) {
        categoryId = (newCat as any[])[0].id;
      }
    } else {
      categoryId = (categories as any[])[0].id;
      console.log(`✅ Usando categoría existente: ${(categories as any[])[0].name} (ID: ${categoryId})`);
    }

    // Verificar cuántos items hay
    const [count] = await sequelize.query(`SELECT COUNT(*) as total FROM inventory_items;`);
    if ((count as any[])[0].total > 0) {
      console.log(`\n⚠️ Ya existen ${(count as any[])[0].total} items. Actualizando fechas de mantenimiento...\n`);

      // Actualizar los items existentes con fechas variadas
      await sequelize.query(`
        UPDATE inventory_items
        SET next_maintenance_date = $1, last_maintenance_date = NOW() - INTERVAL '90 days'
        WHERE id = (SELECT MIN(id) FROM inventory_items);
      `, { bind: [in45Days] });

      await sequelize.query(`
        UPDATE inventory_items
        SET next_maintenance_date = $1, last_maintenance_date = NOW() - INTERVAL '75 days'
        WHERE id = (SELECT MIN(id) + 1 FROM inventory_items WHERE id > (SELECT MIN(id) FROM inventory_items));
      `, { bind: [in15Days] });

      await sequelize.query(`
        UPDATE inventory_items
        SET next_maintenance_date = $1, last_maintenance_date = NOW() - INTERVAL '87 days'
        WHERE id = (SELECT MIN(id) + 2 FROM inventory_items WHERE id > (SELECT MIN(id) + 1 FROM inventory_items));
      `, { bind: [in3Days] });

      await sequelize.query(`
        UPDATE inventory_items
        SET next_maintenance_date = $1, last_maintenance_date = NOW() - INTERVAL '180 days'
        WHERE id = (SELECT MAX(id) FROM inventory_items);
      `, { bind: [overdue5Days] });

    } else {
      console.log('\n📍 Insertando artículos de prueba...\n');

      // Insertar items de prueba con fechas de mantenimiento variadas
      const items = [
        {
          name: 'Toyota Corolla 2024',
          type: 'Sedan',
          serialNumber: 'ABC-1234',
          internalCode: 'VEH-001',
          city: 'Ciudad de México',
          state: 'CDMX',
          coords: { lat: 19.37, lng: -99.162 },
          status: 'available',
          condition: 'excellent',
          currentValue: 350000,
          rentalPriceDaily: 800,
          nextMaintenanceDate: in45Days,
          expectedColor: '🟢 VERDE (+45 días) - Sin parpadeo'
        },
        {
          name: 'Honda CR-V 2023',
          type: 'SUV',
          serialNumber: 'XYZ-5678',
          internalCode: 'VEH-002',
          city: 'Ciudad de México',
          state: 'CDMX',
          coords: { lat: 19.4326, lng: -99.1332 },
          status: 'rented',
          condition: 'good',
          currentValue: 440000,
          rentalPriceDaily: 1200,
          nextMaintenanceDate: in15Days,
          expectedColor: '🟡 AMARILLO (15 días) - Parpadeo LENTO'
        },
        {
          name: 'Ford F-150 2024',
          type: 'Camioneta',
          serialNumber: 'DEF-9012',
          internalCode: 'VEH-003',
          city: 'Guadalajara',
          state: 'Jalisco',
          coords: { lat: 20.6597, lng: -103.3496 },
          status: 'available',
          condition: 'excellent',
          currentValue: 650000,
          rentalPriceDaily: 1500,
          nextMaintenanceDate: in3Days,
          expectedColor: '🔴 ROJO (3 días) - Parpadeo RÁPIDO'
        },
        {
          name: 'Nissan Sentra 2023',
          type: 'Sedan',
          serialNumber: 'GHI-3456',
          internalCode: 'VEH-004',
          city: 'Monterrey',
          state: 'Nuevo León',
          coords: { lat: 25.6866, lng: -100.3161 },
          status: 'maintenance',
          condition: 'fair',
          currentValue: 300000,
          rentalPriceDaily: 700,
          nextMaintenanceDate: overdue5Days,
          expectedColor: '🔴 ROJO (Vencido -5 días) - Parpadeo RÁPIDO'
        },
        {
          name: 'Chevrolet Equinox 2024',
          type: 'SUV',
          serialNumber: 'JKL-7890',
          internalCode: 'VEH-005',
          city: 'Querétaro',
          state: 'Querétaro',
          coords: { lat: 20.5888, lng: -100.3899 },
          status: 'available',
          condition: 'excellent',
          currentValue: 480000,
          rentalPriceDaily: 1100,
          nextMaintenanceDate: null, // Sin programar
          expectedColor: '⚫ GRIS (Sin programar) - Sin parpadeo'
        },
      ];

      for (const item of items) {
        await sequelize.query(`
          INSERT INTO inventory_items (
            name, category_id, category_name, type, serial_number, internal_code,
            current_location_id, current_location_name, current_location_city, current_location_state,
            current_location_coordinates, status, condition, current_value, rental_price_daily,
            last_maintenance_date, next_maintenance_date, custom_fields, created_at, updated_at
          ) VALUES (
            $1, $2, 'Vehículos', $3, $4, $5,
            1, 'Ubicación Principal', $6, $7,
            $8, $9, $10, $11, $12,
            NOW() - INTERVAL '90 days', $13, '{}', NOW(), NOW()
          )
          ON CONFLICT (serial_number) DO UPDATE SET
            next_maintenance_date = EXCLUDED.next_maintenance_date,
            last_maintenance_date = EXCLUDED.last_maintenance_date;
        `, {
          bind: [
            item.name, categoryId, item.type, item.serialNumber, item.internalCode,
            item.city, item.state, JSON.stringify(item.coords),
            item.status, item.condition, item.currentValue, item.rentalPriceDaily,
            item.nextMaintenanceDate
          ]
        });

        console.log(`✅ ${item.name} (${item.serialNumber})`);
        console.log(`   → ${item.expectedColor}\n`);
      }
    }

    // Mostrar resumen final
    const [finalItems] = await sequelize.query(`
      SELECT id, name, serial_number, next_maintenance_date,
        CASE
          WHEN next_maintenance_date IS NULL THEN 'GRIS - Sin programar'
          WHEN next_maintenance_date < NOW() THEN 'ROJO - Vencido (parpadeo rápido)'
          WHEN next_maintenance_date <= NOW() + INTERVAL '7 days' THEN 'ROJO - Urgente (parpadeo rápido)'
          WHEN next_maintenance_date <= NOW() + INTERVAL '30 days' THEN 'AMARILLO - Advertencia (parpadeo lento)'
          ELSE 'VERDE - OK (sin parpadeo)'
        END as color_esperado
      FROM inventory_items
      ORDER BY id;
    `);

    console.log('\n═'.repeat(50));
    console.log('📋 RESUMEN FINAL - Items en la BD:');
    console.log('═'.repeat(50));
    (finalItems as any[]).forEach(item => {
      const fecha = item.next_maintenance_date
        ? new Date(item.next_maintenance_date).toLocaleDateString('es-MX')
        : 'Sin programar';
      console.log(`${item.id}. ${item.name}`);
      console.log(`   Mantenimiento: ${fecha}`);
      console.log(`   Color: ${item.color_esperado}`);
      console.log('');
    });

    console.log('═'.repeat(50));
    console.log('✅ Datos insertados/actualizados correctamente');
    console.log('🔄 Recarga el frontend para ver los marcadores con colores y parpadeo');
    console.log('═'.repeat(50));

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

insertTestData();
