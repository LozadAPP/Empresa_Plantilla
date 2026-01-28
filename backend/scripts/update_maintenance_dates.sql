-- Script para actualizar fechas de mantenimiento en inventory_items
-- Esto permite probar los colores y parpadeo en el mapa

-- Primero, veamos qué items tenemos
SELECT id, name, serial_number, next_maintenance_date FROM inventory_items;

-- Actualizar items con diferentes fechas de mantenimiento para testing:

-- 1. Toyota Corolla: Verde (+45 días) - mantenimiento lejano, sin parpadeo
UPDATE inventory_items
SET
  next_maintenance_date = CURRENT_DATE + INTERVAL '45 days',
  last_maintenance_date = CURRENT_DATE - INTERVAL '90 days'
WHERE serial_number = 'ABC-1234';

-- 2. Honda CR-V: Amarillo (15 días) - advertencia, parpadeo LENTO
UPDATE inventory_items
SET
  next_maintenance_date = CURRENT_DATE + INTERVAL '15 days',
  last_maintenance_date = CURRENT_DATE - INTERVAL '75 days'
WHERE serial_number = 'XYZ-5678';

-- 3. Ford F-150: Rojo (3 días) - urgente, parpadeo RÁPIDO
UPDATE inventory_items
SET
  next_maintenance_date = CURRENT_DATE + INTERVAL '3 days',
  last_maintenance_date = CURRENT_DATE - INTERVAL '87 days'
WHERE serial_number = 'DEF-9012';

-- 4. Leica TS16: Rojo VENCIDO (-5 días) - muy urgente, parpadeo RÁPIDO
UPDATE inventory_items
SET
  next_maintenance_date = CURRENT_DATE - INTERVAL '5 days',
  last_maintenance_date = CURRENT_DATE - INTERVAL '185 days'
WHERE serial_number = 'SN-98765';

-- 5. Trimble R12: Gris (sin fecha) - equipo que NO requiere mantenimiento programado
-- Este ya debería estar NULL, pero lo dejamos explícitamente
UPDATE inventory_items
SET
  next_maintenance_date = NULL,
  last_maintenance_date = NULL
WHERE serial_number = 'GPS-12345';

-- Verificar los cambios
SELECT
  id,
  name,
  serial_number,
  category_name,
  last_maintenance_date,
  next_maintenance_date,
  CASE
    WHEN next_maintenance_date IS NULL THEN 'GRIS - Sin programar'
    WHEN next_maintenance_date < CURRENT_DATE THEN 'ROJO - Vencido (parpadeo rápido)'
    WHEN next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'ROJO - Urgente (parpadeo rápido)'
    WHEN next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'AMARILLO - Advertencia (parpadeo lento)'
    ELSE 'VERDE - OK (sin parpadeo)'
  END as estado_mapa
FROM inventory_items
ORDER BY
  CASE
    WHEN next_maintenance_date IS NULL THEN 4
    WHEN next_maintenance_date < CURRENT_DATE THEN 1
    WHEN next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1
    WHEN next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' THEN 2
    ELSE 3
  END;
