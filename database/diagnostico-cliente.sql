-- Diagnóstico completo de la tabla cliente
-- Ejecutar en SQL Editor de Supabase

-- 1. Verificar si existe la tabla
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'cliente'
) as tabla_existe;

-- 2. Ver estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'cliente'
ORDER BY ordinal_position;

-- 3. Verificar secuencia actual
SELECT
  sequence_name,
  last_value,
  is_called
FROM pg_sequences
WHERE sequence_name = 'cliente_id_cliente_seq';

-- 4. Ver datos actuales en cliente
SELECT
  COUNT(*) as total_registros,
  MIN(id_cliente) as id_minimo,
  MAX(id_cliente) as id_maximo,
  array_agg(id_cliente ORDER BY id_cliente) as ids_existentes
FROM cliente;

-- 5. Si hay datos, mostrarlos
SELECT id_cliente, nombre, telefono, puntos_acumulados
FROM cliente
ORDER BY id_cliente;