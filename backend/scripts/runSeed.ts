/**
 * Script para ejecutar el seed de inventario
 * Ejecutar con: npx ts-node scripts/runSeed.ts
 */

import sequelize from '../src/config/database';
import { syncDatabase } from '../src/models';
import { seedInventoryData } from '../src/seeders/inventorySeed';

async function runSeed() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    console.log('📦 Sincronizando modelos...');
    await syncDatabase();
    console.log('✅ Modelos sincronizados\n');

    console.log('🌱 Ejecutando seed de inventario...');
    await seedInventoryData();
    console.log('\n✅ Seed completado exitosamente');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runSeed();
