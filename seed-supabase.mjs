import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.weoyurgqyozhxfqhubds',
  password: 'claudecode2026xd',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ═══════════════════════════════════════════
    // 1. SUCURSALES (locations con IDs altos para no colisionar)
    // ═══════════════════════════════════════════
    console.log('📍 Creando sucursales...');
    await client.query(`
      INSERT INTO locations (id, name, address, city, state, country, coordinates, is_active, created_at, updated_at)
      VALUES
        (100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', 'México', '{"lat":19.4326,"lng":-99.1332}', true, NOW(), NOW()),
        (101, 'Sucursal Guadalajara', 'Av. Vallarta 1234, Col. Providencia', 'Guadalajara', 'Jalisco', 'México', '{"lat":20.6597,"lng":-103.3496}', true, NOW(), NOW()),
        (102, 'Sucursal Monterrey', 'Av. Constitución 567, Col. Centro', 'Monterrey', 'Nuevo León', 'México', '{"lat":25.6866,"lng":-100.3161}', true, NOW(), NOW()),
        (103, 'Sucursal Querétaro', 'Blvd. Bernardo Quintana 789, Centro Sur', 'Querétaro', 'Querétaro', 'México', '{"lat":20.5888,"lng":-100.3899}', true, NOW(), NOW()),
        (104, 'Sucursal Puebla', 'Blvd. Hermanos Serdán 456, La Paz', 'Puebla', 'Puebla', 'México', '{"lat":19.0414,"lng":-98.2063}', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    // Mover vehículos existentes a sucursal CDMX
    await client.query(`UPDATE vehicles SET location_id = 100 WHERE location_id = 1`);

    // ═══════════════════════════════════════════
    // 2. VEHÍCULOS ADICIONALES (8 más, IDs 6-13)
    // ═══════════════════════════════════════════
    console.log('🚗 Insertando vehículos adicionales...');
    await client.query(`
      INSERT INTO vehicles (make, model, year, vin, license_plate, color, mileage, status, daily_rate, purchase_price, current_value, monthly_depreciation, vehicle_type_id, location_id, condition, fuel_type, transmission, insurance_expiry, next_maintenance, created_at, updated_at)
      VALUES
        ('Kia', 'Rio', 2024, '3KPA24AD5RE123456', 'ABC-123-D', 'Blanco', 8500, 'available', 1200, 280000, 265000, 1200, 1, 100, 'excellent', 'gasoline', 'automatic', '2026-03-15', '2026-03-01', NOW(), NOW()),
        ('Volkswagen', 'Jetta', 2023, '3VW2B7AJ8PM456789', 'DEF-456-E', 'Gris', 22000, 'rented', 1800, 420000, 380000, 1800, 2, 101, 'good', 'gasoline', 'automatic', '2026-04-20', '2026-02-28', NOW(), NOW()),
        ('Mercedes-Benz', 'Sprinter', 2023, 'WD3PE8CD2PP789012', 'GHI-789-F', 'Blanco', 35000, 'available', 3500, 850000, 780000, 3500, 4, 100, 'good', 'diesel', 'manual', '2026-06-10', '2026-04-15', NOW(), NOW()),
        ('Ford', 'Transit', 2024, '1FTYR2CM5RKA01234', 'JKL-012-G', 'Azul', 12000, 'rented', 3200, 720000, 690000, 3000, 4, 102, 'excellent', 'diesel', 'automatic', '2026-05-01', '2026-03-20', NOW(), NOW()),
        ('BMW', 'Serie 3', 2024, 'WBA5R1C50RFH56789', 'MNO-345-H', 'Negro', 5000, 'available', 4500, 950000, 920000, 4200, 5, 100, 'excellent', 'gasoline', 'automatic', '2026-07-15', '2026-05-01', NOW(), NOW()),
        ('Audi', 'A4', 2023, 'WAUDAAF44RN890123', 'PQR-678-I', 'Gris Plata', 15000, 'rented', 4200, 880000, 810000, 3800, 5, 101, 'good', 'gasoline', 'automatic', '2026-08-01', '2026-04-01', NOW(), NOW()),
        ('Chevrolet', 'Equinox', 2024, '2GNAXKEV5R6234567', 'STU-901-J', 'Rojo', 9000, 'available', 2500, 550000, 520000, 2300, 3, 103, 'excellent', 'gasoline', 'automatic', '2026-09-01', '2026-06-15', NOW(), NOW()),
        ('Mazda', '3', 2024, '3MZBPAAM9PM901234', 'VWX-234-K', 'Azul', 7000, 'available', 1600, 450000, 430000, 1900, 2, 100, 'excellent', 'gasoline', 'automatic', '2026-05-20', '2026-03-10', NOW(), NOW())
    `);

    // Actualizar fechas de alertas en vehículos existentes
    await client.query(`UPDATE vehicles SET insurance_expiry = '2026-02-25', next_maintenance = '2026-02-22' WHERE id = 1`);
    await client.query(`UPDATE vehicles SET insurance_expiry = '2026-03-10', next_maintenance = '2026-03-05' WHERE id = 2`);
    await client.query(`UPDATE vehicles SET insurance_expiry = '2026-02-20', next_maintenance = '2026-02-10' WHERE id = 3`);
    await client.query(`UPDATE vehicles SET insurance_expiry = '2026-04-01', next_maintenance = '2026-02-28' WHERE id = 4`);
    await client.query(`UPDATE vehicles SET insurance_expiry = '2026-02-28', next_maintenance = '2026-03-15' WHERE id = 5`);

    // ═══════════════════════════════════════════
    // 3. CLIENTES ADICIONALES (5 más)
    // ═══════════════════════════════════════════
    console.log('👥 Insertando clientes adicionales...');
    await client.query(`
      INSERT INTO customers (name, contact_person, email, phone, address, city, country, tax_id, customer_type, credit_limit, is_active, created_at, updated_at)
      VALUES
        ('Logística Express SA de CV', 'Fernando Ruiz Torres', 'fernando@logisticaexpress.mx', '+52-55-6666-6666', 'Av. Central 456, Col. Industrial', 'Ciudad de México', 'México', 'LEX201015AB1', 'corporate', 200000, true, NOW(), NOW()),
        ('Ana Sofía Mendoza Ríos', 'Ana Sofía Mendoza', 'ana.mendoza@outlook.com', '+52-33-7777-7777', 'Calle Hidalgo 78, Col. Centro', 'Guadalajara', 'México', 'MERA900315QR7', 'individual', 50000, true, NOW(), NOW()),
        ('Hotel Marriott Reforma', 'Lic. Patricia Vega', 'patricia.vega@marriott.mx', '+52-55-8888-8888', 'Paseo de la Reforma 465', 'Ciudad de México', 'México', 'HMR180520KL3', 'corporate', 500000, true, NOW(), NOW()),
        ('Constructora Vanguardia SA', 'Ing. Miguel Ángel Torres', 'miguel@vanguardia.mx', '+52-81-9999-9999', 'Blvd. Roble 1200, Col. Valle', 'Monterrey', 'México', 'CVA160810MN5', 'corporate', 300000, true, NOW(), NOW()),
        ('Carlos Eduardo Jiménez', 'Carlos Jiménez', 'carlos.jimenez@gmail.com', '+52-22-1010-1010', 'Av. Juárez 890, Col. Centro', 'Puebla', 'México', 'JIGC850920PQ2', 'individual', 80000, true, NOW(), NOW())
    `);

    // ═══════════════════════════════════════════
    // 4. RENTAS (8 rentas)
    // ═══════════════════════════════════════════
    console.log('📋 Insertando rentas...');
    // Renta 1: Completada - Nissan Versa (veh 3) a Turismo XYZ (cli 1)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, actual_return_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, end_mileage, fuel_level_start, fuel_level_end, created_by, created_at, updated_at)
      VALUES ('RNT-2026-001', 1, 3, 100, '2026-01-15', '2026-01-18', '2026-01-18', 3, 1500, 4500, 16, 720, 5220, 5220, 'completed', 'credit_card', 15000, 15450, 'full', 'three_quarters', 1, '2026-01-15', '2026-01-18')
    `);
    // Renta 2: Activa - Toyota Corolla (veh 1) a Geo Solutions (cli 2)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, fuel_level_start, created_by, created_at, updated_at)
      VALUES ('RNT-2026-002', 2, 1, 100, '2026-02-10', '2026-02-24', 14, 2000, 28000, 16, 4480, 32480, 16240, 'active', 'transfer', 20000, 'full', 1, '2026-02-10', '2026-02-10')
    `);
    // Renta 3: Reservada - Honda Civic (veh 2) a Roberto Martínez (cli 4)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, created_by, created_at, updated_at)
      VALUES ('RNT-2026-003', 4, 2, 100, '2026-02-22', '2026-02-28', 6, 2100, 12600, 16, 2016, 14616, 0, 'reserved', 'credit_card', 1, '2026-02-18', '2026-02-18')
    `);
    // Renta 4: Activa - VW Jetta (veh 7) a Logística Express (cli 6)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, fuel_level_start, created_by, created_at, updated_at)
      VALUES ('RNT-2026-004', 6, 7, 101, '2026-02-12', '2026-02-19', 7, 1800, 12600, 16, 2016, 14616, 7308, 'active', 'transfer', 22000, 'full', 1, '2026-02-12', '2026-02-12')
    `);
    // Renta 5: Activa - Ford Transit (veh 10) a Constructora Vanguardia (cli 9)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, fuel_level_start, created_by, created_at, updated_at)
      VALUES ('RNT-2026-005', 9, 10, 102, '2026-02-10', '2026-02-17', 7, 3200, 22400, 16, 3584, 25984, 12000, 'active', 'credit_card', 12000, 'full', 1, '2026-02-10', '2026-02-10')
    `);
    // Renta 6: Activa - Audi A4 (veh 12) a Hotel Marriott (cli 8)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, fuel_level_start, created_by, created_at, updated_at)
      VALUES ('RNT-2026-006', 8, 12, 101, '2026-02-16', '2026-02-23', 7, 4200, 29400, 16, 4704, 34104, 17000, 'active', 'transfer', 15000, 'full', 1, '2026-02-16', '2026-02-16')
    `);
    // Renta 7: Completada - Toyota RAV4 (veh 4) a Gobierno EdoMex (cli 5)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, actual_return_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, end_mileage, fuel_level_start, fuel_level_end, created_by, created_at, updated_at)
      VALUES ('RNT-2026-007', 5, 4, 100, '2026-01-25', '2026-02-01', '2026-02-01', 7, 2800, 19600, 16, 3136, 22736, 22736, 'completed', 'transfer', 18000, 18850, 'full', 'full', 1, '2026-01-25', '2026-02-01')
    `);
    // Renta 8: Completada - Hyundai Tucson (veh 5) a Ana Mendoza (cli 7)
    await client.query(`
      INSERT INTO rentals (rental_code, customer_id, vehicle_id, location_id, start_date, end_date, actual_return_date, days, daily_rate, subtotal, tax_percentage, tax_amount, total_amount, deposit_amount, status, payment_method, start_mileage, end_mileage, fuel_level_start, fuel_level_end, created_by, created_at, updated_at)
      VALUES ('RNT-2026-008', 7, 5, 100, '2026-02-01', '2026-02-08', '2026-02-08', 7, 2700, 18900, 16, 3024, 21924, 21924, 'completed', 'credit_card', 25000, 25600, 'full', 'three_quarters', 1, '2026-02-01', '2026-02-08')
    `);

    // ═══════════════════════════════════════════
    // 5. PAGOS (13 pagos distribuidos en el tiempo)
    // ═══════════════════════════════════════════
    console.log('💰 Insertando pagos...');
    const rentalIds = await client.query(`SELECT id, rental_code FROM rentals ORDER BY id`);
    const rMap = {};
    rentalIds.rows.forEach(r => { rMap[r.rental_code] = r.id; });

    // Pagos para Renta 1 (completada - $5,220)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-001', $1, 1, 5220, 'credit_card', 'rental_payment', 'completed', '2026-01-18', 'Pago completo renta Nissan Versa', 1, '2026-01-18', '2026-01-18')`, [rMap['RNT-2026-001']]);

    // Pagos para Renta 7 (completada - $22,736)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-002', $1, 5, 15000, 'transfer', 'rental_payment', 'completed', '2026-01-25', 'Anticipo renta RAV4 gobierno', 1, '2026-01-25', '2026-01-25')`, [rMap['RNT-2026-007']]);
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-003', $1, 5, 7736, 'transfer', 'rental_payment', 'completed', '2026-02-01', 'Liquidación renta RAV4', 1, '2026-02-01', '2026-02-01')`, [rMap['RNT-2026-007']]);

    // Pagos para Renta 8 (completada - $21,924)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-004', $1, 7, 21924, 'credit_card', 'rental_payment', 'completed', '2026-02-01', 'Pago completo renta Tucson', 1, '2026-02-01', '2026-02-01')`, [rMap['RNT-2026-008']]);

    // Pagos para Renta 2 (activa - anticipo $16,240)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-005', $1, 2, 5000, 'transfer', 'deposit', 'completed', '2026-02-03', 'Anticipo parcial Corolla', 1, '2026-02-03', '2026-02-03')`, [rMap['RNT-2026-002']]);
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-006', $1, 2, 3000, 'credit_card', 'deposit', 'completed', '2026-02-05', 'Segundo anticipo Corolla', 1, '2026-02-05', '2026-02-05')`, [rMap['RNT-2026-002']]);
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-007', $1, 2, 4000, 'credit_card', 'rental_payment', 'completed', '2026-02-10', 'Pago parcial Corolla', 1, '2026-02-10', '2026-02-10')`, [rMap['RNT-2026-002']]);
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-008', $1, 2, 3240, 'transfer', 'rental_payment', 'completed', '2026-02-15', 'Abono adicional Corolla', 1, '2026-02-15', '2026-02-15')`, [rMap['RNT-2026-002']]);

    // Pagos para Renta 4 (activa - $14,616)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-009', $1, 6, 7308, 'transfer', 'deposit', 'completed', '2026-02-08', 'Depósito 50% Jetta', 1, '2026-02-08', '2026-02-08')`, [rMap['RNT-2026-004']]);

    // Pagos para Renta 5 (activa - $25,984)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-010', $1, 9, 12000, 'credit_card', 'deposit', 'completed', '2026-02-10', 'Anticipo Transit constructora', 1, '2026-02-10', '2026-02-10')`, [rMap['RNT-2026-005']]);

    // Pagos para Renta 6 (activa - $34,104)
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-011', $1, 8, 5000, 'transfer', 'deposit', 'completed', '2026-02-12', 'Anticipo Audi A4 Marriott', 1, '2026-02-12', '2026-02-12')`, [rMap['RNT-2026-006']]);
    await client.query(`INSERT INTO payments (payment_code, rental_id, customer_id, amount, payment_method, payment_type, status, transaction_date, notes, processed_by, created_at, updated_at) VALUES ('PAY-2026-012', $1, 8, 12000, 'credit_card', 'rental_payment', 'completed', '2026-02-16', 'Pago parcial Audi Marriott', 1, '2026-02-16', '2026-02-16')`, [rMap['RNT-2026-006']]);

    // ═══════════════════════════════════════════
    // 6. FACTURAS
    // ═══════════════════════════════════════════
    console.log('🧾 Insertando facturas...');
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-001', $1, 1, '2026-01-18', '2026-01-25', 4500, 720, 5220, 5220, 0, 'paid', 1, '2026-01-18', '2026-01-18')`, [rMap['RNT-2026-001']]);
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-002', $1, 2, '2026-02-10', '2026-02-17', 28000, 4480, 32480, 15240, 17240, 'sent', 1, '2026-02-10', '2026-02-15')`, [rMap['RNT-2026-002']]);
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-003', $1, 5, '2026-01-25', '2026-02-01', 19600, 3136, 22736, 22736, 0, 'paid', 1, '2026-01-25', '2026-02-01')`, [rMap['RNT-2026-007']]);
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-004', $1, 7, '2026-02-01', '2026-02-08', 18900, 3024, 21924, 21924, 0, 'paid', 1, '2026-02-01', '2026-02-08')`, [rMap['RNT-2026-008']]);
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-005', $1, 6, '2026-02-12', '2026-02-19', 12600, 2016, 14616, 7308, 7308, 'sent', 1, '2026-02-12', '2026-02-12')`, [rMap['RNT-2026-004']]);
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-006', $1, 9, '2026-02-10', '2026-02-17', 22400, 3584, 25984, 12000, 13984, 'sent', 1, '2026-02-10', '2026-02-10')`, [rMap['RNT-2026-005']]);
    await client.query(`INSERT INTO invoices (invoice_code, rental_id, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, paid_amount, balance, status, created_by, created_at, updated_at) VALUES ('INV-2026-007', $1, 8, '2026-02-16', '2026-02-23', 29400, 4704, 34104, 17000, 17104, 'sent', 1, '2026-02-16', '2026-02-16')`, [rMap['RNT-2026-006']]);

    // ═══════════════════════════════════════════
    // 7. ITEM CATEGORIES
    // ═══════════════════════════════════════════
    console.log('📦 Insertando categorías de inventario...');
    await client.query(`
      INSERT INTO item_categories (name, slug, description, icon, color, types, is_active, created_at, updated_at)
      VALUES
        ('Vehículos', 'vehiculos', 'Flota de vehículos para renta', 'DirectionsCar', '#8b5cf6', '{"sedán","suv","compacto","camioneta","van"}', true, NOW(), NOW()),
        ('Equipo Pesado', 'equipo-pesado', 'Maquinaria y equipo pesado', 'Construction', '#f59e0b', '{"retroexcavadora","montacargas","grúa","compresor"}', true, NOW(), NOW()),
        ('Herramientas', 'herramientas', 'Herramientas eléctricas y manuales', 'Build', '#10b981', '{"taladro","soldadora","generador","compresor"}', true, NOW(), NOW())
    `);

    // ═══════════════════════════════════════════
    // 8. INVENTORY ITEMS (11 items)
    // ═══════════════════════════════════════════
    console.log('📦 Insertando items de inventario...');
    await client.query(`
      INSERT INTO inventory_items (name, category_id, category_name, serial_number, description, status, condition, current_value, current_location_id, current_location_name, current_location_city, current_location_state, current_location_coordinates, rental_price_daily, photos, created_at, updated_at)
      VALUES
        ('Nissan Versa 2023', 1, 'Vehículos', '3N1CN7AD8PL678901', 'Sedán compacto ideal para ciudad', 'available', 'excellent', 285000, 100, 'Sucursal CDMX Centro', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 1500, '{}', NOW(), NOW()),
        ('Toyota Hilux 2022', 1, 'Vehículos', 'MROFR22GX50123456', 'Camioneta pickup doble cabina', 'rented', 'good', 520000, 100, 'Sucursal CDMX Centro', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 2200, '{}', NOW(), NOW()),
        ('Chevrolet Aveo 2024', 1, 'Vehículos', '3G1TC5CF5RL789012', 'Sedán económico', 'available', 'excellent', 240000, 101, 'Sucursal Guadalajara', 'Guadalajara', 'Jalisco', '{"lat":20.6597,"lng":-103.3496}', 1200, '{}', NOW(), NOW()),
        ('Honda CR-V 2023', 1, 'Vehículos', '5J6RW2H56PL345678', 'SUV familiar', 'maintenance', 'good', 450000, 100, 'Sucursal CDMX Centro', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 2800, '{}', NOW(), NOW()),
        ('Mazda 3 2023', 1, 'Vehículos', '3MZBPAAM9PM901234', 'Sedán deportivo', 'available', 'excellent', 380000, 100, 'Sucursal CDMX Centro', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 1800, '{}', NOW(), NOW()),
        ('Retroexcavadora CAT 420F2', 2, 'Equipo Pesado', 'CAT-420F2-2022-001', 'Retroexcavadora para obras medianas', 'available', 'good', 1850000, 100, 'Sucursal CDMX Centro', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 8500, '{}', NOW(), NOW()),
        ('Montacargas Toyota 8FGU25', 2, 'Equipo Pesado', 'TOY-8FGU25-2023-002', 'Montacargas capacidad 2.5 ton', 'rented', 'good', 680000, 101, 'Sucursal Guadalajara', 'Guadalajara', 'Jalisco', '{"lat":20.6597,"lng":-103.3496}', 5500, '{}', NOW(), NOW()),
        ('Compresor Atlas Copco XAS 185', 2, 'Equipo Pesado', 'AC-XAS185-2023-003', 'Compresor portátil 185 CFM', 'available', 'good', 320000, 102, 'Sucursal Monterrey', 'Monterrey', 'Nuevo León', '{"lat":25.6866,"lng":-100.3161}', 3200, '{}', NOW(), NOW()),
        ('Taladro Dewalt DCD996', 3, 'Herramientas', 'DW-DCD996-2024-001', 'Taladro percutor inalámbrico 20V', 'available', 'excellent', 8500, 100, 'Sucursal CDMX Centro', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 350, '{}', NOW(), NOW()),
        ('Soldadora Miller 220V', 3, 'Herramientas', 'ML-220V-2023-002', 'Soldadora multiproceso MIG/TIG', 'rented', 'good', 45000, 101, 'Sucursal Guadalajara', 'Guadalajara', 'Jalisco', '{"lat":20.6597,"lng":-103.3496}', 850, '{}', NOW(), NOW()),
        ('Generador Honda EU7000', 3, 'Herramientas', 'HN-EU7000-2023-003', 'Generador portátil 7000W inverter', 'available', 'excellent', 95000, 103, 'Sucursal Querétaro', 'Querétaro', 'Querétaro', '{"lat":20.5888,"lng":-100.3899}', 1500, '{}', NOW(), NOW())
    `);

    // ═══════════════════════════════════════════
    // 9. INVENTORY MOVEMENTS (14)
    // ═══════════════════════════════════════════
    console.log('🔄 Insertando movimientos de inventario...');
    const itemIds = await client.query(`SELECT id, serial_number FROM inventory_items ORDER BY id`);
    const iMap = {};
    itemIds.rows.forEach(i => { iMap[i.serial_number] = i.id; });

    // Entradas iniciales (purchase) - Enero
    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, purchase_price, notes, user_id, user_name, document_generated, document_type, document_number, created_at, updated_at) VALUES ('MOV-2026-0001', $1, 'Nissan Versa 2023', 'Vehículos', '3N1CN7AD8PL678901', 'entry', 'purchase', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', '2026-01-05 09:00:00-06', 285000, 'Ingreso inicial de unidad Nissan Versa', 1, 'Admin Sistema', true, 'entry', 'DOC-ENT-0001', '2026-01-05', '2026-01-05')`, [iMap['3N1CN7AD8PL678901']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, purchase_price, notes, user_id, user_name, document_generated, document_type, document_number, created_at, updated_at) VALUES ('MOV-2026-0002', $1, 'Toyota Hilux 2022', 'Vehículos', 'MROFR22GX50123456', 'entry', 'purchase', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', '2026-01-05 10:30:00-06', 520000, 'Ingreso camioneta Toyota Hilux', 1, 'Admin Sistema', true, 'entry', 'DOC-ENT-0002', '2026-01-05', '2026-01-05')`, [iMap['MROFR22GX50123456']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, purchase_price, notes, user_id, user_name, document_generated, document_type, document_number, created_at, updated_at) VALUES ('MOV-2026-0003', $1, 'Retroexcavadora CAT 420F2', 'Equipo Pesado', 'CAT-420F2-2022-001', 'entry', 'purchase', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', '2026-01-08 08:00:00-06', 1850000, 'Adquisición retroexcavadora CAT', 1, 'Admin Sistema', true, 'entry', 'DOC-ENT-0003', '2026-01-08', '2026-01-08')`, [iMap['CAT-420F2-2022-001']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, purchase_price, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0004', $1, 'Montacargas Toyota 8FGU25', 'Equipo Pesado', 'TOY-8FGU25-2023-002', 'entry', 'purchase', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', '2026-01-08 11:00:00-06', 680000, 'Adquisición montacargas Toyota', 1, 'Admin Sistema', false, '2026-01-08', '2026-01-08')`, [iMap['TOY-8FGU25-2023-002']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, purchase_price, notes, user_id, user_name, document_generated, document_type, document_number, created_at, updated_at) VALUES ('MOV-2026-0005', $1, 'Generador Honda EU7000', 'Herramientas', 'HN-EU7000-2023-003', 'entry', 'purchase', 103, 'Sucursal Querétaro', 'Blvd. Bernardo Quintana 789, Centro Sur', 'Querétaro', 'Querétaro', '{"lat":20.5888,"lng":-100.3899}', '2026-01-10 14:00:00-06', 95000, 'Compra generador Honda Querétaro', 1, 'Admin Sistema', true, 'entry', 'DOC-ENT-0005', '2026-01-10', '2026-01-10')`, [iMap['HN-EU7000-2023-003']]);

    // Salidas por renta - Enero/Febrero
    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, customer_id, customer_name, customer_company, movement_date, expected_return_date, rental_price, notes, user_id, user_name, document_generated, document_type, document_number, created_at, updated_at) VALUES ('MOV-2026-0006', $1, 'Toyota Hilux 2022', 'Vehículos', 'MROFR22GX50123456', 'exit', 'rental', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', '{"lat":19.4326,"lng":-99.1332}', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', 1, 'José García', 'Turismo XYZ SA de CV', '2026-01-20 10:00:00-06', '2026-02-20', 1800, 'Renta mensual Toyota Hilux', 1, 'Admin Sistema', true, 'exit', 'DOC-SAL-0006', '2026-01-20', '2026-01-20')`, [iMap['MROFR22GX50123456']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, customer_id, customer_name, customer_company, movement_date, expected_return_date, rental_price, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0007', $1, 'Montacargas Toyota 8FGU25', 'Equipo Pesado', 'TOY-8FGU25-2023-002', 'exit', 'rental', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', '{"lat":19.4326,"lng":-99.1332}', 101, 'Sucursal Guadalajara', 'Av. Vallarta 1234, Col. Providencia', 'Guadalajara', 'Jalisco', '{"lat":20.6597,"lng":-103.3496}', 2, 'María López', 'Geo Solutions Colombia', '2026-01-25 08:30:00-06', '2026-03-25', 5500, 'Renta montacargas para proyecto GDL', 1, 'Admin Sistema', false, '2026-01-25', '2026-01-25')`, [iMap['TOY-8FGU25-2023-002']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, customer_id, customer_name, movement_date, expected_return_date, rental_price, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0008', $1, 'Soldadora Miller 220V', 'Herramientas', 'ML-220V-2023-002', 'exit', 'rental', 101, 'Sucursal Guadalajara', 'Av. Vallarta 1234, Col. Providencia', '{"lat":20.6597,"lng":-103.3496}', 101, 'Sucursal Guadalajara', 'Av. Vallarta 1234, Col. Providencia', 'Guadalajara', 'Jalisco', '{"lat":20.6597,"lng":-103.3496}', 4, 'Roberto Martínez', '2026-02-01 11:00:00-06', '2026-02-15', 850, 'Renta soldadora herrería', 1, 'Admin Sistema', false, '2026-02-01', '2026-02-01')`, [iMap['ML-220V-2023-002']]);

    // Transferencias - Febrero
    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0009', $1, 'Compresor Atlas Copco XAS 185', 'Equipo Pesado', 'AC-XAS185-2023-003', 'transfer', 'transfer', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', '{"lat":19.4326,"lng":-99.1332}', 102, 'Sucursal Monterrey', 'Av. Constitución 567, Col. Centro', 'Monterrey', 'Nuevo León', '{"lat":25.6866,"lng":-100.3161}', '2026-02-05 07:00:00-06', 'Transfer compresor a Monterrey', 1, 'Admin Sistema', false, '2026-02-05', '2026-02-05')`, [iMap['AC-XAS185-2023-003']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0010', $1, 'Taladro Dewalt DCD996', 'Herramientas', 'DW-DCD996-2024-001', 'transfer', 'transfer', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', '{"lat":19.4326,"lng":-99.1332}', 104, 'Sucursal Puebla', 'Blvd. Hermanos Serdán 456, La Paz', 'Puebla', 'Puebla', '{"lat":19.0414,"lng":-98.2063}', '2026-02-08 09:00:00-06', 'Préstamo temporal taladro a Puebla', 1, 'Admin Sistema', false, '2026-02-08', '2026-02-08')`, [iMap['DW-DCD996-2024-001']]);

    // Mantenimiento
    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0011', $1, 'Honda CR-V 2023', 'Vehículos', '5J6RW2H56PL345678', 'exit', 'maintenance', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', '{"lat":19.4326,"lng":-99.1332}', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', '2026-02-10 08:00:00-06', 'Mantenimiento preventivo frenos', 1, 'Admin Sistema', false, '2026-02-10', '2026-02-10')`, [iMap['5J6RW2H56PL345678']]);

    // Movimientos recientes (esta semana)
    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0012', $1, 'Chevrolet Aveo 2024', 'Vehículos', '3G1TC5CF5RL789012', 'transfer', 'transfer', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', '{"lat":19.4326,"lng":-99.1332}', 101, 'Sucursal Guadalajara', 'Av. Vallarta 1234, Col. Providencia', 'Guadalajara', 'Jalisco', '{"lat":20.6597,"lng":-103.3496}', '2026-02-15 07:30:00-06', 'Transfer Aveo a GDL', 1, 'Admin Sistema', false, '2026-02-15', '2026-02-15')`, [iMap['3G1TC5CF5RL789012']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0013', $1, 'Generador Honda EU7000', 'Herramientas', 'HN-EU7000-2023-003', 'entry', 'return', 103, 'Sucursal Querétaro', 'Blvd. Bernardo Quintana 789, Centro Sur', '{"lat":20.5888,"lng":-100.3899}', 103, 'Sucursal Querétaro', 'Blvd. Bernardo Quintana 789, Centro Sur', 'Querétaro', 'Querétaro', '{"lat":20.5888,"lng":-100.3899}', '2026-02-16 16:00:00-06', 'Regreso generador de obra Celaya', 1, 'Admin Sistema', false, '2026-02-16', '2026-02-16')`, [iMap['HN-EU7000-2023-003']]);

    await client.query(`INSERT INTO inventory_movements (movement_number, item_id, item_name, item_category, item_serial_number, movement_type, movement_subtype, from_location_id, from_location_name, from_location_address, from_location_coordinates, to_location_id, to_location_name, to_location_address, to_location_city, to_location_state, to_location_coordinates, movement_date, notes, user_id, user_name, document_generated, created_at, updated_at) VALUES ('MOV-2026-0014', $1, 'Taladro Dewalt DCD996', 'Herramientas', 'DW-DCD996-2024-001', 'transfer', 'transfer', 104, 'Sucursal Puebla', 'Blvd. Hermanos Serdán 456, La Paz', '{"lat":19.0414,"lng":-98.2063}', 100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', '{"lat":19.4326,"lng":-99.1332}', '2026-02-17 10:00:00-06', 'Retorno taladro de Puebla a CDMX', 1, 'Admin Sistema', false, '2026-02-17', '2026-02-17')`, [iMap['DW-DCD996-2024-001']]);

    await client.query('COMMIT');
    console.log('✅ Todos los datos insertados correctamente en Supabase!');

    // Verificación
    const counts = await client.query(`
      SELECT 'vehicles' as t, COUNT(*) as c FROM vehicles UNION ALL
      SELECT 'customers', COUNT(*) FROM customers UNION ALL
      SELECT 'rentals', COUNT(*) FROM rentals UNION ALL
      SELECT 'payments', COUNT(*) FROM payments UNION ALL
      SELECT 'invoices', COUNT(*) FROM invoices UNION ALL
      SELECT 'inventory_items', COUNT(*) FROM inventory_items UNION ALL
      SELECT 'inventory_movements', COUNT(*) FROM inventory_movements UNION ALL
      SELECT 'item_categories', COUNT(*) FROM item_categories
      ORDER BY t
    `);
    console.log('\n📊 Conteos finales:');
    counts.rows.forEach(r => console.log(`  ${r.t}: ${r.c}`));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
