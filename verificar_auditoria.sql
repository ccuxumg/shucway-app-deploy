-- ===============================================
-- SCRIPT DE VERIFICACIÓN - SISTEMA DE AUDITORÍA
-- ===============================================

-- 1. Verificar que la función fn_iniciar_auditoria existe
SELECT 
    p.proname AS nombre_funcion,
    pg_get_function_arguments(p.oid) AS parametros,
    pg_get_function_result(p.oid) AS retorno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_iniciar_auditoria';

-- 2. Verificar que la función fn_obtener_stock_actual existe
SELECT 
    p.proname AS nombre_funcion,
    pg_get_function_arguments(p.oid) AS parametros,
    pg_get_function_result(p.oid) AS retorno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_obtener_stock_actual';

-- 3. Verificar que la función fn_actualizar_conteo_auditoria existe
SELECT 
    p.proname AS nombre_funcion,
    pg_get_function_arguments(p.oid) AS parametros,
    pg_get_function_result(p.oid) AS retorno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_actualizar_conteo_auditoria';

-- 4. Verificar que la función fn_completar_auditoria existe
SELECT 
    p.proname AS nombre_funcion,
    pg_get_function_arguments(p.oid) AS parametros,
    pg_get_function_result(p.oid) AS retorno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'fn_completar_auditoria';

-- 5. Verificar que las tablas de auditoría existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name IN ('auditoria_inventario', 'auditoria_detalle', 'bitacora_auditoria')
ORDER BY table_name;

-- 6. Verificar estructura de auditoria_inventario
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'auditoria_inventario'
ORDER BY ordinal_position;

-- 7. Verificar estructura de auditoria_detalle
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'auditoria_detalle'
ORDER BY ordinal_position;

-- 8. Probar crear una auditoría de prueba
DO $$
DECLARE
    v_id_auditoria INTEGER;
    v_id_perfil INTEGER;
BEGIN
    -- Obtener el primer perfil disponible
    SELECT id_perfil INTO v_id_perfil 
    FROM perfil_usuario 
    WHERE activo = TRUE 
    LIMIT 1;
    
    IF v_id_perfil IS NULL THEN
        RAISE NOTICE 'No hay perfiles activos en la base de datos';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Probando con id_perfil: %', v_id_perfil;
    
    -- Intentar crear una auditoría de prueba
    BEGIN
        SELECT fn_iniciar_auditoria(
            'Auditoría de Prueba',
            CURRENT_DATE - INTERVAL '7 days',
            CURRENT_DATE,
            v_id_perfil
        ) INTO v_id_auditoria;
        
        RAISE NOTICE 'Auditoría creada exitosamente con ID: %', v_id_auditoria;
        
        -- Verificar que se crearon los detalles
        DECLARE
            v_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO v_count
            FROM auditoria_detalle
            WHERE id_auditoria = v_id_auditoria;
            
            RAISE NOTICE 'Se crearon % registros en auditoria_detalle', v_count;
        END;
        
        -- Limpiar la prueba (opcional - comenta estas líneas si quieres mantener la prueba)
        DELETE FROM auditoria_detalle WHERE id_auditoria = v_id_auditoria;
        DELETE FROM bitacora_auditoria WHERE id_auditoria = v_id_auditoria;
        DELETE FROM auditoria_inventario WHERE id_auditoria = v_id_auditoria;
        RAISE NOTICE 'Auditoría de prueba eliminada';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error al crear auditoría: % - %', SQLERRM, SQLSTATE;
    END;
END $$;

-- 9. Verificar que hay insumos activos en la base de datos
SELECT 
    COUNT(*) as total_insumos_activos,
    COUNT(CASE WHEN ci.tipo_categoria = 'perpetuo' THEN 1 END) as perpetuos,
    COUNT(CASE WHEN ci.tipo_categoria = 'operativo' THEN 1 END) as operativos
FROM insumo i
JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
WHERE i.activo = TRUE;

-- 10. Verificar perfiles de usuario disponibles
SELECT 
    id_perfil,
    username,
    email,
    activo,
    primer_nombre,
    primer_apellido
FROM perfil_usuario
WHERE activo = TRUE
ORDER BY id_perfil
LIMIT 5;

-- ===============================================
-- INSTRUCCIONES:
-- ===============================================
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Revisa los resultados de cada consulta
-- 3. Si alguna función no existe, ejecuta database_complete_new.sql
-- 4. Si no hay perfiles activos, crea uno o activa uno existente
-- 5. Si no hay insumos activos, crea algunos o actívalos
-- ===============================================
