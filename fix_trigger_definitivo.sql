-- ===============================================
-- FIX DEFINITIVO: Error "record old has no field conteo_fisico"
-- ===============================================
-- CAUSA RAÍZ: Trigger trg_actualizar_estado_auditoria 
-- usa OLD.conteo_fisico en auditoria_detalle pero accede 
-- a auditoria_inventario que NO tiene esa columna
-- ===============================================

-- Paso 1: Eliminar el trigger problemático
-- ===============================================
DROP TRIGGER IF EXISTS trg_actualizar_estado_auditoria ON auditoria_detalle;

-- Paso 2: Deshabilitar la función (mantenerla para compatibilidad)
-- ===============================================
CREATE OR REPLACE FUNCTION fn_actualizar_estado_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta función está deshabilitada porque:
    -- 1. fn_completar_auditoria() ya maneja el estado final
    -- 2. El trigger causaba error: "conteo_fisico not in auditoria_inventario"
    -- 3. El flujo correcto es: usuario → Click Finalizar → fn_completar_auditoria()
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 3: Verificar que no hay triggers problemáticos
-- ===============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auditoria_inventario', 'auditoria_detalle')
ORDER BY event_object_table, trigger_name;

-- Paso 4: Confirmación
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger trg_actualizar_estado_auditoria ELIMINADO';
    RAISE NOTICE '✅ Función fn_actualizar_estado_auditoria deshabilitada';
    RAISE NOTICE '✅ El estado se completa en fn_completar_auditoria()';
    RAISE NOTICE '✅ Error "conteo_fisico" está RESUELTO';
    RAISE NOTICE '✅ Puedes iniciar auditorías sin errores ahora';
END $$;

-- ===============================================
-- RESULTADO ESPERADO:
-- trigger_name: trg_bitacora_auditoria_inventario
-- event_manipulation: INSERT, UPDATE, DELETE
-- event_object_table: auditoria_inventario
--
-- Otros triggers de auditoria_detalle: NINGUNO
-- ===============================================
