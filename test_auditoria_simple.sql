-- ===============================================
-- TEST RÁPIDO - Iniciar Auditoría
-- ===============================================

-- Paso 1: Ver perfiles disponibles
SELECT id_perfil, username, email 
FROM perfil_usuario 
WHERE activo = TRUE 
LIMIT 5;

-- Paso 2: Probar la función con un perfil real
-- NOTA: Reemplaza el "1" con un id_perfil que exista en tu BD
SELECT fn_iniciar_auditoria(
    'Test Manual',              -- p_nombre_auditoria
    '2024-10-01'::DATE,         -- p_fecha_inicio_periodo
    '2024-10-31'::DATE,         -- p_fecha_fin_periodo
    1                            -- p_id_perfil (CAMBIA ESTE NÚMERO)
);

-- Paso 3: Ver la auditoría creada
SELECT * FROM auditoria_inventario 
ORDER BY id_auditoria DESC 
LIMIT 1;

-- Paso 4: Ver los detalles (primeros 10 registros)
SELECT 
    ad.id_detalle,
    i.nombre_insumo,
    ci.nombre as categoria,
    ad.tipo_categoria,
    ad.stock_esperado,
    ad.conteo_fisico,
    ad.diferencia
FROM auditoria_detalle ad
JOIN insumo i ON ad.id_insumo = i.id_insumo
JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
WHERE ad.id_auditoria = (
    SELECT id_auditoria FROM auditoria_inventario 
    ORDER BY id_auditoria DESC 
    LIMIT 1
)
LIMIT 10;
