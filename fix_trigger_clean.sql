DROP TRIGGER IF EXISTS trg_actualizar_estado_auditoria ON auditoria_detalle;

CREATE OR REPLACE FUNCTION fn_actualizar_estado_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conteo_fisico IS NOT NULL AND (OLD.conteo_fisico IS NULL OR OLD.conteo_fisico != NEW.conteo_fisico) THEN
        IF NOT EXISTS (
            SELECT 1 FROM auditoria_detalle
            WHERE id_auditoria = NEW.id_auditoria
            AND conteo_fisico IS NULL
        ) THEN
            UPDATE auditoria_inventario
            SET
                estado = 'completada',
                fecha_fin_auditoria = CURRENT_DATE
            WHERE id_auditoria = NEW.id_auditoria
            AND estado = 'en_progreso';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_actualizar_estado_auditoria
AFTER UPDATE ON auditoria_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_estado_auditoria();

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auditoria_inventario', 'auditoria_detalle')
ORDER BY event_object_table, trigger_name;
