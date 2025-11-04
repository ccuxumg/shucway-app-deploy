DROP TRIGGER IF EXISTS trg_actualizar_estado_auditoria ON auditoria_detalle;
DROP TRIGGER IF EXISTS trg_bitacora_auditoria_inventario ON auditoria_inventario;
DROP TRIGGER IF EXISTS trg_bitacora_auditoria_detalle ON auditoria_detalle;
DROP FUNCTION IF EXISTS fn_actualizar_estado_auditoria() CASCADE;
DROP FUNCTION IF EXISTS fn_bitacora_auditoria_cambios() CASCADE;

CREATE OR REPLACE FUNCTION fn_actualizar_estado_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_bitacora_auditoria_cambios()
RETURNS TRIGGER AS $$
BEGIN
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Funciones deshabilitadas - Triggers removidos' as resultado;

SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auditoria_inventario', 'auditoria_detalle')
ORDER BY event_object_table, trigger_name;
