-- Resetear secuencia de la tabla cliente
-- Corrige el error: "duplicate key value violates unique constraint 'cliente_pkey'"

-- PASO 1: Verificar el máximo ID actual y contar registros
SELECT
  'Total de clientes:' as info,
  COUNT(*) as total_clientes,
  'Máximo id_cliente:' as max_info,
  COALESCE(MAX(id_cliente), 0) as max_id
FROM cliente;

-- PASO 2: Solo resetear si hay registros existentes
-- Esto evita resetear a 1 cuando no hay datos
DO $$
DECLARE
    max_id INTEGER;
    total_clientes INTEGER;
BEGIN
    -- Obtener estadísticas
    SELECT COUNT(*), COALESCE(MAX(id_cliente), 0)
    INTO total_clientes, max_id
    FROM cliente;

    -- Solo resetear si hay clientes registrados
    IF total_clientes > 0 THEN
        -- Resetear la secuencia al siguiente valor disponible
        PERFORM setval('cliente_id_cliente_seq', max_id + 1, false);
        RAISE NOTICE 'Secuencia reseteada exitosamente. Próximo ID será: %', max_id + 1;
    ELSE
        RAISE NOTICE 'No hay clientes registrados. La secuencia se mantiene en su valor actual.';
    END IF;
END $$;

-- PASO 3: Verificar el resultado
SELECT
  'Estado actual de la secuencia:' as info,
  currval('cliente_id_cliente_seq') as current_value,
  nextval('cliente_id_cliente_seq') as next_value;