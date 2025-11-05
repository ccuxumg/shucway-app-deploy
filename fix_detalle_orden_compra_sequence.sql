-- Script para arreglar la secuencia de detalle_orden_compra después de inserciones manuales
-- Ejecutar después de database_inserts_adapted.sql

-- Actualizar la secuencia de detalle_orden_compra para que esté por encima del último ID
SELECT setval('detalle_orden_compra_id_detalle_seq', (SELECT COALESCE(MAX(id_detalle), 0) + 1 FROM detalle_orden_compra));

-- Verificar que la secuencia esté correcta
SELECT last_value FROM detalle_orden_compra_id_detalle_seq;