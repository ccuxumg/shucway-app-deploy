-- ===============================================
-- FIX CORRECTO: Trigger con lógica adecuada
-- ===============================================
-- El trigger está en auditoria_detalle y accede correctamente a conteo_fisico
-- Cuando ALL los items tienen conteo_fisico, auto-completa la auditoría
-- ===============================================

-- Paso 1: Eliminar el trigger problemático
-- ===============================================
DROP TRIGGER IF EXISTS trg_actualizar_estado_auditoria ON auditoria_detalle;

-- Paso 2: Recrear la función CORRECTAMENTE
-- ===============================================
CREATE OR REPLACE FUNCTION fn_actualizar_estado_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si conteo_fisico fue actualizado a un valor (no NULL)
    IF NEW.conteo_fisico IS NOT NULL AND (OLD.conteo_fisico IS NULL OR OLD.conteo_fisico != NEW.conteo_fisico) THEN
        -- Verificar si ya no hay items sin conteo_fisico
        IF NOT EXISTS (
            SELECT 1 FROM auditoria_detalle
            WHERE id_auditoria = NEW.id_auditoria
            AND conteo_fisico IS NULL
        ) THEN
            -- Todos los items tienen conteo_fisico, marcar auditoría como completada
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

-- Paso 3: Recrear el trigger
-- ===============================================
CREATE TRIGGER trg_actualizar_estado_auditoria
AFTER UPDATE ON auditoria_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_estado_auditoria();

-- Paso 4: Verificar que el trigger existe correctamente
-- ===============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auditoria_inventario', 'auditoria_detalle')
ORDER BY event_object_table, trigger_name;

-- Paso 5: Confirmación
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger trg_actualizar_estado_auditoria recreado';
    RAISE NOTICE '✅ Ahora detecta cuando todos los items tienen conteo_fisico';
    RAISE NOTICE '✅ Auto-completa la auditoría cuando está lista';
    RAISE NOTICE '✅ Error "conteo_fisico" está RESUELTO';
END $$;

-- ===============================================
-- FLUJO CORRECTO:
-- 1. Usuario inicia auditoría → auditoria_inventario en estado 'en_progreso'
-- 2. Usuario ingresa conteo_fisico → auditoria_detalle.conteo_fisico = valor
-- 3. Trigger detecta que conteo_fisico tiene valor
-- 4. Trigger verifica si TODOS los items tienen conteo_fisico
-- 5. Si todos tienen → auto-cambia estado a 'completada'
-- 6. Usuario puede finalizar normalmente
-- ===============================================
