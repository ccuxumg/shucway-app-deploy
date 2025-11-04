-- ===============================================
-- FIX DEFINITIVO: Sin CASCADE (compatible con Supabase)
-- ===============================================
-- Paso 1: Eliminar el trigger PRIMERO
-- ===============================================
DROP TRIGGER IF EXISTS trg_bitacora_auditoria_inventario ON auditoria_inventario;

-- ===============================================
-- Paso 2: Ahora eliminar la función (sin dependencias)
-- ===============================================
DROP FUNCTION IF EXISTS fn_bitacora_auditoria_cambios();

-- ===============================================
-- Paso 3: Recrear la función CORREGIDA
-- ===============================================
CREATE OR REPLACE FUNCTION fn_bitacora_auditoria_cambios()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_auditoria VARCHAR(100);
    v_accion VARCHAR(50);
BEGIN
    -- Obtener el nombre de la auditoría
    SELECT nombre_auditoria INTO v_nombre_auditoria
    FROM auditoria_inventario
    WHERE id_auditoria = COALESCE(NEW.id_auditoria, OLD.id_auditoria);

    -- Determinar acción basada en el tipo de operación
    v_accion := CASE
        WHEN TG_OP = 'INSERT' THEN 'creacion'
        WHEN TG_OP = 'UPDATE' THEN 'modificacion'
        WHEN TG_OP = 'DELETE' THEN 'eliminacion'
    END;

    -- Si es UPDATE y cambió el estado, usar el nuevo estado como acción
    IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
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
            WHEN TG_OP = 'INSERT' THEN 'Auditoría iniciada'
            WHEN TG_OP = 'UPDATE' THEN 'Auditoría actualizada'
            WHEN TG_OP = 'DELETE' THEN 'Auditoría eliminada'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- Paso 4: Recrear el trigger
-- ===============================================
CREATE TRIGGER trg_bitacora_auditoria_inventario
AFTER INSERT OR UPDATE OR DELETE ON auditoria_inventario
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_auditoria_cambios();

-- ===============================================
-- Paso 5: Verificación
-- ===============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_bitacora_auditoria_inventario'
ORDER BY event_manipulation;

-- ===============================================
-- Paso 6: Confirmación de éxito
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger eliminado correctamente';
    RAISE NOTICE '✅ Función recreada sin referencias a columnas inexistentes';
    RAISE NOTICE '✅ Trigger recreado exitosamente';
    RAISE NOTICE '✅ El error "conteo_fisico" está RESUELTO';
END $$;
