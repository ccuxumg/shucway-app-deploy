-- Script para arreglar la secuencia de orden_compra después de inserciones manuales
-- Ejecutar después de database_inserts_adapted.sql

-- Actualizar la secuencia de orden_compra para que esté por encima del último ID
SELECT setval('orden_compra_id_orden_seq', (SELECT COALESCE(MAX(id_orden), 0) + 1 FROM orden_compra));

-- Verificar que la secuencia esté correcta
SELECT last_value FROM orden_compra_id_orden_seq;