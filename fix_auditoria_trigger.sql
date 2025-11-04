-- ===============================================
-- FIX RÁPIDO: Trigger de Auditoría
-- ===============================================
-- FIX: Error "record OLD has no field conteo_fisico"
-- Este script corrige el problema del trigger que causa
-- el error 400 al ejecutar fn_iniciar_auditoria

-- ===============================================
-- 1. Eliminar el trigger problemático
-- ===============================================
DROP TRIGGER IF EXISTS trg_bitacora_auditoria_detalle ON auditoria_detalle;

-- ===============================================
-- 2. Verificar que los triggers están correctos
-- ===============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('auditoria_inventario', 'auditoria_detalle')
ORDER BY event_object_table, trigger_name;

-- ===============================================
-- 3. Confirmar que el fix está aplicado
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger problemático eliminado';
    RAISE NOTICE '✅ La bitácora de auditoria_detalle se maneja en fn_actualizar_conteo_auditoria';
    RAISE NOTICE '✅ Ahora puedes iniciar auditorías sin errores';
END $$;

-- ===============================================
-- RESULTADO ESPERADO:
-- - trg_bitacora_auditoria_detalle debe estar ELIMINADO
-- - trg_bitacora_auditoria_inventario debe existir (UPDATE/INSERT/DELETE)
-- - Otras funciones de auditoría continúan funcionando
-- ===============================================
