import sequelize from '../src/config/database';

async function check() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado\n');

    // Ver datos de la categoría
    const [cats] = await sequelize.query('SELECT id, name, icon, color FROM item_categories;');
    console.log('📦 Categorías:');
    (cats as any[]).forEach(c => console.log(`   ${c.id}. ${c.name} - icon: ${c.icon}, color: ${c.color}`));

    // Ver items y sus campos de categoría
    const [items] = await sequelize.query('SELECT id, name, category_id, category_name FROM inventory_items;');
    console.log('\n📍 Items:');
    (items as any[]).forEach(i => console.log(`   ${i.id}. ${i.name} - category_id: ${i.category_id}, category_name: ${i.category_name}`));

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}
check();
