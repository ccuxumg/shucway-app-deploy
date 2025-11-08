-- Script simple para resetear secuencia de clientes
-- Ejecutar en SQL Editor de Supabase

-- PASO 1: Ver qué tenemos actualmente
SELECT
  COUNT(*) as total_clientes,
  MAX(id_cliente) as max_id_actual,
  CASE
    WHEN COUNT(*) = 0 THEN 'No hay clientes - secuencia OK'
    ELSE 'Hay clientes - verificar secuencia'
  END as estado
FROM cliente;

-- PASO 2: Resetear la secuencia (solo si hay clientes)
-- Esto toma el ID más alto y dice "el próximo ID será max_id + 1"
SELECT setval('cliente_id_cliente_seq',
  COALESCE((SELECT MAX(id_cliente) FROM cliente), 0) + 1,
  false
);

-- PASO 3: Verificar que funcionó
SELECT
  'Próximo ID de cliente será:' as mensaje,
  nextval('cliente_id_cliente_seq') as proximo_id,
  'Si este número es mayor que el max_id_actual de arriba, está OK' as explicacion;