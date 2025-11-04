DROP TRIGGER IF EXISTS trg_actualizar_estado_auditoria ON auditoria_detalle;
DROP TRIGGER IF EXISTS trg_bitacora_auditoria_inventario ON auditoria_inventario;
DROP TRIGGER IF EXISTS trg_bitacora_auditoria_detalle ON auditoria_detalle;
DROP FUNCTION IF EXISTS fn_actualizar_estado_auditoria();
DROP FUNCTION IF EXISTS fn_bitacora_auditoria_cambios();

SELECT 'Todos los triggers y funciones de auditoría eliminados' as resultado;

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auditoria_inventario', 'auditoria_detalle');
