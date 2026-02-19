-- ═══════════════════════════════════════════
-- SEED COMPLETO PARA MOVICAR - Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════
-- 1. SUCURSALES (locations con IDs altos)
-- ═══════════════════════════════════════════
INSERT INTO locations (id, name, address, city, state, country, coordinates, is_active, created_at, updated_at)
VALUES
  (100, 'Sucursal CDMX Centro', 'Av. Reforma 123, Col. Juárez', 'Ciudad de México', 'CDMX', 'México', '{"lat":19.4326,"lng":-99.1332}', true, NOW(), NOW()),
  (101, 'Sucursal Guadalajara', 'Av. Vallarta 1234, Col. Providencia', 'Guadalajara', 'Jalisco', 'México', '{"lat":20.6597,"lng":-103.3496}', true, NOW(), NOW()),
  (102, 'Sucursal Monterrey', 'Av. Constitución 567, Col. Centro', 'Monterrey', 'Nuevo León', 'México', '{"lat":25.6866,"lng":-100.3161}', true, NOW(), NOW()),
  (103, 'Sucursal Querétaro', 'Blvd. Bernardo Quintana 789, Centro Sur', 'Querétaro', 'Querétaro', 'México', '{"lat":20.5888,"lng":-100.3899}', true, NOW(), NOW()),
  (104, 'Sucursal Puebla', 'Blvd. Hermanos Serdán 456, La Paz', 'Puebla', 'Puebla', 'México', '{"lat":19.0414,"lng":-98.2063}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Mover vehículos existentes a sucursal CDMX
UPDATE vehicles SET location_id = 100 WHERE location_id = 1;

-- ═══════════════════════════════════════════
-- 2. VEHÍCULOS ADICIONALES (8 más)
-- ═══════════════════════════════════════════
INSERT INTO vehicles (make, model, year, vin, license_plate, color, mileage, status, daily_rate, purchase_price, current_value, monthly_depreciation, vehicle_type_id, location_id, condition, fuel_type, transmission, insurance_expiry, next_maintenance, created_at, updated_at)
VALUES
  ('Kia', 'Rio', 2024, '3KPA24AD5RE123456', 'ABC-123-D', 'Blanco', 8500, 'available', 1200, 280000, 265000, 1200, 1, 100, 'excellent', 'gasoline', 'automatic', '2026-03-15', '2026-03-01', NOW(), NOW()),
  ('Volkswagen', 'Jetta', 2023, '3VW2B7AJ8PM456789', 'DEF-456-E', 'Gris', 22000, 'rented', 1800, 420000, 380000, 1800, 2, 101, 'good', 'gasoline', 'automatic', '2026-04-20', '2026-02-28', NOW(), NOW()),
  ('Mercedes-Benz', 'Sprinter', 2023, 'WD3PE8CD2PP789012', 'GHI-789-F', 'Blanco', 35000, 'available', 3500, 850000, 780000, 3500, 4, 100, 'good', 'diesel', 'manual', '2026-06-10', '2026-04-15', NOW(), NOW()),
  ('Ford', 'Transit', 2024, '1FTYR2CM5RKA01234', 'JKL-012-G', 'Azul', 12000, 'rented', 3200, 720000, 690000, 3000, 4, 102, 'excellent', 'diesel', 'automatic', '2026-05-01', '2026-03-20', NOW(), NOW()),
  ('BMW', 'Serie 3', 2024, 'WBA5R1C50RFH56789', 'MNO-345-H', 'Negro', 5000, 'available', 4500, 950000, 920000, 4200, 5, 100, 'excellent', 'gasoline', 'automatic', '2026-07-15', '2026-05-01', NOW(), NOW()),
  ('Audi', 'A4', 2023, 'WAUDAAF44RN890123', 'PQR-678-I', 'Gris Plata', 15000, 'rented', 4200, 880000, 810000, 3800, 5, 101, 'good', 'gasoline', 'automatic', '2026-08-01', '2026-04-01', NOW(), NOW()),
  ('Chevrolet', 'Equinox', 2024, '2GNAXKEV5R6234567', 'STU-901-J', 'Rojo', 9000, 'available', 2500, 550000, 520000, 2300, 3, 103, 'excellent', 'gasoline', 'automatic', '2026-09-01', '2026-06-15', NOW(), NOW()),
  ('Mazda', '3', 2024, '3MZBPAAM9PM901234', 'VWX-234-K', 'Azul', 7000, 'available', 1600, 450000, 430000, 1900, 2, 100, 'excellent', 'gasoline', 'automatic', '2026-05-20', '2026-03-10', NOW(), NOW());

-- Actualizar fechas de alertas en vehículos existentes
UPDATE vehicles SET insurance_expiry = '2026-02-25', next_maintenance = '2026-02-22' WHERE id = 1;
UPDATE vehicles SET insurance_expiry = '2026-03-10', next_maintenance = '2026-03-05' WHERE id = 2;
UPDATE vehicles SET insurance_expiry = '2026-02-20', next_maintenance = '2026-02-10' WHERE id = 3;
UPDATE vehicles SET insurance_expiry = '2026-04-01', next_maintenance = '2026-02-28' WHERE id = 4;
UPDATE vehicles SET insurance_expiry = '2026-02-28', next_maintenance = '2026-03-15' WHERE id = 5;

-- ═══════════════════════════════════════════
-- 3. CLIENTES ADICIONALES (5 más)
-- ═══════════════════════════════════════════
INSERT INTO customers (name, contact_person, email, phone, address, city, country, tax_id, customer_type, credit_limit, is_active, created_at, updated_at)
VALUES
  ('Logística Express SA de CV', 'Fernando Ruiz Torres', 'fernando@logisticaexpress.mx', '+52-55-6666-6666', 'Av. Central 456, Col. Industrial', 'Ciudad de México', 'México', 'LEX201015AB1', 'corporate', 200000, true, NOW(), NOW()),
  ('Ana Sofía Mendoza Ríos', 'Ana Sofía Mendoza', 'ana.mendoza@outlook.com', '+52-33-7777-7777', 'Calle Hidalgo 78, Col. Centro', 'Guadalajara', 'México', 'MERA900315QR7', 'individual', 50000, true, NOW(), NOW()),
  ('Hotel Marriott Reforma', 'Lic. Patricia Vega', 'patricia.vega@marriott.mx', '+52-55-8888-8888', 'Paseo de la Reforma 465', 'Ciudad de México', 'México', 'HMR180520KL3', 'corporate', 500000, true, NOW(), NOW()),
  ('Constructora Vanguardia SA', 'Ing. Miguel Ángel Torres', 'miguel@vanguardia.mx', '+52-81-9999-9999', 'Blvd. Roble 1200, Col. Valle', 'Monterrey', 'México', 'CVA160810MN5', 'corporate', 300000, true, NOW(), NOW()),
  ('Carlos Eduardo Jiménez', 'Carlos Jiménez', 'carlos.jimenez@gmail.com', '+52-22-1010-1010', 'Av. Juárez 890, Col. Centro', 'Puebla', 'México', 'JIGC850920PQ2', 'individual', 80000, true, NOW(), NOW());

COMMIT;
