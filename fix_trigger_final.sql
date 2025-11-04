-- ===============================================
-- FIX DEFINITIVO: Función fn_bitacora_auditoria_cambios()
-- ===============================================
-- ERROR: record "old" has no field "conteo_fisico"
-- CAUSA: La función intenta acceder a OLD.conteo_fisico
--        pero auditoria_inventario NO tiene esa columna
-- SOLUCIÓN: Reescribir función para SOLO auditoria_inventario

-- ===============================================
-- 1. Reemplazar la función problemática
-- ===============================================
DROP FUNCTION IF EXISTS fn_bitacora_auditoria_cambios();

CREATE OR REPLACE FUNCTION fn_bitacora_auditoria_cambios()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_auditoria VARCHAR(100);
    v_accion VARCHAR(50);
BEGIN
    -- Esta función SOLO debe ejecutarse para auditoria_inventario
    -- No para auditoria_detalle
    
    -- Obtener el nombre de la auditoría
    SELECT nombre_auditoria INTO v_nombre_auditoria
    FROM auditoria_inventario
    WHERE id_auditoria = COALESCE(NEW.id_auditoria, OLD.id_auditoria);

    -- Determinar acción basada en el tipo de operación
    v_accion := CASE
        WHEN TG_OP = 'INSERT' THEN 'creacion'
        WHEN TG_OP = 'UPDATE' THEN 'modificacion'
        WHEN TG_OP = 'DELETE' THEN 'eliminacion'
        ELSE 'desconocida'
    END;

    -- Solo insertar si se cambió el estado
    IF TG_OP = 'UPDATE' AND OLD.estado != NEW.estado THEN
        v_accion := NEW.estado;
    END IF;

    INSERT INTO bitacora_auditoria (
        id_auditoria, nombre_auditoria, accion, id_perfil, descripcion,
        datos_anteriores, datos_nuevos
    ) VALUES (
        COALESCE(NEW.id_auditoria, OLD.id_auditoria),
        v_nombre_auditoria,
        v_accion,
        COALESCE(NEW.id_perfil, OLD.id_perfil),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Auditoría creada'
            WHEN TG_OP = 'UPDATE' THEN 'Auditoría actualizada - Estado: ' || NEW.estado
            WHEN TG_OP = 'DELETE' THEN 'Auditoría eliminada'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- 2. Verificar que el trigger existe correctamente
-- ===============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_bitacora_auditoria_inventario'
ORDER BY event_manipulation;

-- ===============================================
-- 3. Confirmación
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Función fn_bitacora_auditoria_cambios() corregida';
    RAISE NOTICE '✅ Ya no intenta acceder a columnas inexistentes';
    RAISE NOTICE '✅ El error 42703 debe estar resuelto';
END $$;

-- ===============================================
-- CAMBIOS PRINCIPALES:
-- - Removido: OLD.conteo_fisico (no existe en auditoria_inventario)
-- - Removido: lógica de conteo_actualizado
-- - Mantenido: OLD.estado (existe en auditoria_inventario)
-- - Simplificada la lógica de acción
-- ===============================================
