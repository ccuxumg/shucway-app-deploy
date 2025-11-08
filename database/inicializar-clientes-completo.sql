-- Script completo para inicializar clientes y arreglar secuencia
-- Ejecutar en SQL Editor de Supabase

-- PASO 1: Verificar estado actual
SELECT
  'Estado actual:' as diagnostico,
  COUNT(*) as total_clientes,
  COALESCE(MAX(id_cliente), 0) as max_id
FROM cliente;

-- PASO 2: Insertar clientes de prueba si no existen
INSERT INTO cliente (id_cliente, nombre, telefono, puntos_acumulados, ultima_compra)
SELECT * FROM (VALUES
  (1, 'Andrea Sofia Chafolla Mendez', '87654321', 1, '2025-10-25T10:30:00Z'::timestamp),
  (2, 'Carmi Emileny Cuxum Gonzalez', '76543210', 2, '2025-10-24T14:20:00Z'::timestamp),
  (3, 'Josué Daniel Figueroa Herrera', '65432109', 7, '2025-10-23T16:45:00Z'::timestamp),
  (4, 'Dilan René Escobar Rodríguez', '54321098', 3, '2025-10-22T12:15:00Z'::timestamp),
  (5, 'Bartola Angelica Grave Barrera', '43210987', 1, '2025-10-21T18:30:00Z'::timestamp)
) AS v(id_cliente, nombre, telefono, puntos_acumulados, ultima_compra)
WHERE NOT EXISTS (SELECT 1 FROM cliente WHERE id_cliente = v.id_cliente);

-- PASO 3: Resetear la secuencia correctamente
SELECT setval('cliente_id_cliente_seq',
  COALESCE((SELECT MAX(id_cliente) FROM cliente), 0) + 1,
  false
);

-- PASO 4: Verificar resultado final
SELECT
  'Resultado final:' as estado,
  COUNT(*) as total_clientes_despues,
  MAX(id_cliente) as max_id_despues,
  currval('cliente_id_cliente_seq') as secuencia_actual,
  nextval('cliente_id_cliente_seq') as proximo_id_disponible
FROM cliente;