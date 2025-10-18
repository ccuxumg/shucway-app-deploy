-- Función para obtener estadísticas de ventas
CREATE OR REPLACE FUNCTION fn_obtener_estadisticas_ventas()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH ventas_periodo AS (
        SELECT 
            SUM(total_venta) as total_actual,
            (SELECT SUM(total_venta) 
             FROM venta 
             WHERE fecha_venta >= NOW() - INTERVAL '2 month'
             AND fecha_venta < NOW() - INTERVAL '1 month') as total_anterior
        FROM venta 
        WHERE fecha_venta >= NOW() - INTERVAL '1 month'
    )
    SELECT json_build_object(
        'total', COALESCE(total_actual, 0),
        'cambio_porcentual', 
        CASE 
            WHEN total_anterior = 0 OR total_anterior IS NULL THEN 0
            ELSE ((total_actual - total_anterior) / total_anterior * 100)
        END
    ) INTO v_resultado
    FROM ventas_periodo;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de inventario
CREATE OR REPLACE FUNCTION fn_obtener_estadisticas_inventario()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH stock_actual AS (
        SELECT COUNT(*) as total_actual
        FROM insumo i
        WHERE activo = true
        AND fn_obtener_stock_actual(i.id_insumo) > 0
    ),
    stock_anterior AS (
        SELECT COUNT(*) as total_anterior
        FROM insumo i
        JOIN movimiento_inventario m ON m.id_insumo = i.id_insumo
        WHERE m.fecha_movimiento >= NOW() - INTERVAL '2 month'
        AND m.fecha_movimiento < NOW() - INTERVAL '1 month'
        GROUP BY i.id_insumo
        HAVING SUM(CASE WHEN m.tipo_movimiento = 'entrada' THEN m.cantidad ELSE -m.cantidad END) > 0
    )
    SELECT json_build_object(
        'total', total_actual,
        'cambio_porcentual',
        CASE 
            WHEN total_anterior = 0 OR total_anterior IS NULL THEN 0
            ELSE ((total_actual::numeric - total_anterior::numeric) / total_anterior::numeric * 100)
        END
    ) INTO v_resultado
    FROM stock_actual, stock_anterior;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de clientes
CREATE OR REPLACE FUNCTION fn_obtener_estadisticas_clientes()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH clientes_periodo AS (
        SELECT 
            COUNT(DISTINCT id_cliente) as total_actual
        FROM venta 
        WHERE fecha_venta >= NOW() - INTERVAL '1 month'
        AND id_cliente IS NOT NULL
    ),
    clientes_anterior AS (
        SELECT 
            COUNT(DISTINCT id_cliente) as total_anterior
        FROM venta 
        WHERE fecha_venta >= NOW() - INTERVAL '2 month'
        AND fecha_venta < NOW() - INTERVAL '1 month'
        AND id_cliente IS NOT NULL
    )
    SELECT json_build_object(
        'total', total_actual,
        'cambio_porcentual',
        CASE 
            WHEN total_anterior = 0 OR total_anterior IS NULL THEN 0
            ELSE ((total_actual - total_anterior) / total_anterior * 100)
        END
    ) INTO v_resultado
    FROM clientes_periodo, clientes_anterior;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de ganancias
CREATE OR REPLACE FUNCTION fn_obtener_estadisticas_ganancias()
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    WITH ganancias_periodo AS (
        SELECT 
            SUM(total_venta - total_costo) as total_actual,
            (SELECT SUM(total_venta - total_costo)
             FROM venta 
             WHERE fecha_venta >= NOW() - INTERVAL '2 month'
             AND fecha_venta < NOW() - INTERVAL '1 month'
             AND estado = 'completada') as total_anterior
        FROM venta 
        WHERE fecha_venta >= NOW() - INTERVAL '1 month'
        AND estado = 'completada'
    )
    SELECT json_build_object(
        'total', COALESCE(total_actual, 0),
        'cambio_porcentual',
        CASE 
            WHEN total_anterior = 0 OR total_anterior IS NULL THEN 0
            ELSE ((total_actual - total_anterior) / total_anterior * 100)
        END
    ) INTO v_resultado
    FROM ganancias_periodo;
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;