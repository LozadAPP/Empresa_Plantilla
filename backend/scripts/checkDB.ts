/**
 * Script para verificar el estado de la base de datos
 */

import sequelize from '../src/config/database';

async function checkDB() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Verificar tablas que existen
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('📋 Tablas existentes:');
    (tables as any[]).forEach(t => console.log(`   - ${t.table_name}`));
    console.log('');

    // Verificar columnas de inventory_items
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'inventory_items'
      ORDER BY ordinal_position;
    `);
    if ((columns as any[]).length > 0) {
      console.log('📦 Columnas de inventory_items:');
      (columns as any[]).forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
      console.log('');

      // Contar registros
      const [count] = await sequelize.query(`
        SELECT COUNT(*) as total FROM inventory_items;
      `);
      console.log(`📊 Total de registros en inventory_items: ${(count as any[])[0].total}`);

      // Mostrar datos si hay
      if ((count as any[])[0].total > 0) {
        const [items] = await sequelize.query(`
          SELECT id, name, serial_number, next_maintenance_date
          FROM inventory_items
          ORDER BY id;
        `);
        console.log('\n📍 Items actuales:');
        (items as any[]).forEach(item => {
          console.log(`   ${item.id}. ${item.name} (${item.serial_number})`);
          console.log(`      → next_maintenance_date: ${item.next_maintenance_date || 'NULL'}`);
        });
      }
    } else {
      console.log('❌ La tabla inventory_items NO existe');
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDB();
