/**
 * Script para actualizar fechas de mantenimiento en inventory_items
 * Ejecutar con: npx ts-node scripts/updateMaintenanceDates.ts
 */

import sequelize from '../src/config/database';
import InventoryItem from '../src/models/InventoryItem';

async function updateMaintenanceDates() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Obtener todos los items
    const items = await InventoryItem.findAll();
    console.log(`📦 Encontrados ${items.length} artículos\n`);

    const today = new Date();

    // Definir fechas relativas
    const in45Days = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
    const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
    const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const overdue5Days = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
    const lastMaint90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Actualizar cada item basado en su serial number
    for (const item of items) {
      let nextMaintenanceDate: Date | undefined = undefined;
      let lastMaintenanceDate: Date | undefined = undefined;
      let colorExpected = '';

      // Asignar fechas variadas para testing
      switch (item.serialNumber) {
        case 'ABC-1234': // Toyota Corolla
          nextMaintenanceDate = in45Days;
          lastMaintenanceDate = lastMaint90Days;
          colorExpected = '🟢 VERDE (+45 días) - Sin parpadeo';
          break;

        case 'XYZ-5678': // Honda CR-V
          nextMaintenanceDate = in15Days;
          lastMaintenanceDate = lastMaint90Days;
          colorExpected = '🟡 AMARILLO (15 días) - Parpadeo LENTO (1s)';
          break;

        case 'DEF-9012': // Ford F-150
          nextMaintenanceDate = in3Days;
          lastMaintenanceDate = lastMaint90Days;
          colorExpected = '🔴 ROJO (3 días) - Parpadeo RÁPIDO (0.5s)';
          break;

        case 'SN-98765': // Leica TS16 (equipo topográfico)
          nextMaintenanceDate = overdue5Days;
          lastMaintenanceDate = new Date(today.getTime() - 185 * 24 * 60 * 60 * 1000);
          colorExpected = '🔴 ROJO (Vencido -5 días) - Parpadeo RÁPIDO';
          break;

        case 'GPS-12345': // Trimble R12 - Sin mantenimiento (gris)
          nextMaintenanceDate = undefined;
          lastMaintenanceDate = undefined;
          colorExpected = '⚫ GRIS (Sin programar) - Sin parpadeo';
          break;

        case 'GHI-3456': // Nissan Sentra (si existe)
          nextMaintenanceDate = overdue5Days;
          lastMaintenanceDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
          colorExpected = '🔴 ROJO (Vencido) - Parpadeo RÁPIDO';
          break;

        default:
          // Para items nuevos sin configuración específica, asignar aleatoriamente
          const random = Math.random();
          if (random < 0.25) {
            nextMaintenanceDate = undefined; // Gris
            colorExpected = '⚫ GRIS (Sin programar)';
          } else if (random < 0.5) {
            nextMaintenanceDate = in45Days; // Verde
            colorExpected = '🟢 VERDE (+30 días)';
          } else if (random < 0.75) {
            nextMaintenanceDate = in15Days; // Amarillo
            colorExpected = '🟡 AMARILLO (7-30 días)';
          } else {
            nextMaintenanceDate = in3Days; // Rojo
            colorExpected = '🔴 ROJO (<7 días)';
          }
          lastMaintenanceDate = lastMaint90Days;
      }

      // Actualizar el item
      await item.update({
        nextMaintenanceDate,
        lastMaintenanceDate,
      });

      console.log(`✅ ${item.name} (${item.serialNumber})`);
      console.log(`   → ${colorExpected}`);
      if (nextMaintenanceDate) {
        console.log(`   → Próximo: ${nextMaintenanceDate.toLocaleDateString('es-MX')}`);
      }
      console.log('');
    }

    console.log('═'.repeat(50));
    console.log('✅ Todas las fechas de mantenimiento actualizadas');
    console.log('');
    console.log('📋 RESUMEN DE COLORES EN EL MAPA:');
    console.log('   🟢 Verde = Mantenimiento en +30 días (tranquilo)');
    console.log('   🟡 Amarillo = Mantenimiento en 7-30 días (parpadeo lento)');
    console.log('   🔴 Rojo = Mantenimiento en <7 días o vencido (parpadeo rápido)');
    console.log('   ⚫ Gris = Sin mantenimiento programado');
    console.log('');
    console.log('🔄 Recarga el frontend para ver los cambios');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateMaintenanceDates();
