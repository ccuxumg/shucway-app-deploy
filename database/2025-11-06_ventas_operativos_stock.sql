-- =============================================================
-- ACTUALIZACIONES VENTAS / INVENTARIO OPERATIVO
-- Fecha: 2025-11-06
-- Descripción:
--   1. Ajusta fn_obtener_stock_actual para que los insumos operativos
--      también descuenten ventas (tipo_movimiento = 'salida_venta').
--   2. Reemplaza fn_descontar_inventario_venta con la nueva versión que:
--        - Trabaja únicamente con insumos de categoría 'operativo'.
--        - Valida stock disponible en lote_insumo.
--        - Descuenta por lotes y registra movimientos y bitácora.
-- =============================================================

-- =====================================
-- 1) fn_obtener_stock_actual (actualizado)
-- =====================================
CREATE OR REPLACE FUNCTION fn_obtener_stock_actual(p_id_insumo INTEGER)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    v_stock_actual DECIMAL(10, 2);
    v_tipo_categoria VARCHAR(20);
BEGIN
    SELECT ci.tipo_categoria INTO v_tipo_categoria
    FROM insumo i
    JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
    WHERE i.id_insumo = p_id_insumo;
    
    IF v_tipo_categoria = 'perpetuo' THEN
        SELECT COALESCE(SUM(
            CASE 
                WHEN tipo_movimiento IN ('entrada_compra', 'entrada_ajuste', 'devolucion', 'ajuste_perpetuo') THEN cantidad
                WHEN tipo_movimiento IN ('salida_venta', 'salida_ajuste', 'perdida') THEN -cantidad
                ELSE 0
            END
        ), 0) INTO v_stock_actual
        FROM movimiento_inventario
        WHERE id_insumo = p_id_insumo;
    ELSE
        SELECT COALESCE(SUM(
            CASE 
                WHEN tipo_movimiento IN ('entrada_compra', 'entrada_ajuste', 'devolucion', 'ajuste_operativo') THEN cantidad
                WHEN tipo_movimiento IN ('salida_venta', 'salida_ajuste', 'perdida') THEN -cantidad
                ELSE 0
            END
        ), 0) INTO v_stock_actual
        FROM movimiento_inventario
        WHERE id_insumo = p_id_insumo;
    END IF;
    
    RETURN v_stock_actual;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- 2) fn_descontar_inventario_venta (nuevo comportamiento)
-- =================================================
CREATE OR REPLACE FUNCTION fn_descontar_inventario_venta(p_id_venta INTEGER, p_id_perfil INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_detalle RECORD;
    v_cantidad_a_descontar NUMERIC(12,3);
    v_costo_actual NUMERIC(12,2);
    v_stock_disponible NUMERIC(12,3);
    v_cantidad_restante NUMERIC(12,3);
    v_lote RECORD;
    v_consumo NUMERIC(12,3);
    v_valor_anterior NUMERIC(12,3);
    v_valor_nuevo NUMERIC(12,3);
BEGIN
    FOR v_detalle IN
        SELECT 
            dv.cantidad AS cantidad_vendida,
            rd.id_insumo, 
            rd.cantidad_requerida AS cantidad_receta,
            ci.tipo_categoria,
            i.costo_promedio,
            i.nombre_insumo,
            dv.id_producto
        FROM detalle_venta dv
        JOIN receta_detalle rd ON dv.id_producto = rd.id_producto
        JOIN insumo i ON rd.id_insumo = i.id_insumo
        JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
        WHERE dv.id_venta = p_id_venta
        AND (rd.id_variante IS NULL OR rd.id_variante = dv.id_variante)
        AND ci.tipo_categoria = 'operativo'
    LOOP
        v_cantidad_a_descontar := ROUND(v_detalle.cantidad_vendida * v_detalle.cantidad_receta, 3);
        v_costo_actual := COALESCE(v_detalle.costo_promedio, 0);

        SELECT COALESCE(SUM(cantidad_actual), 0)
        INTO v_stock_disponible
        FROM lote_insumo
        WHERE id_insumo = v_detalle.id_insumo;

        IF v_stock_disponible < v_cantidad_a_descontar THEN
            RAISE EXCEPTION USING MESSAGE = format(
                'Stock insuficiente para el insumo "%s". Requerido: %.3f, disponible: %.3f',
                v_detalle.nombre_insumo,
                v_cantidad_a_descontar,
                v_stock_disponible
            );
        END IF;

        v_cantidad_restante := v_cantidad_a_descontar;

        FOR v_lote IN
            SELECT id_lote, cantidad_actual
            FROM lote_insumo
            WHERE id_insumo = v_detalle.id_insumo
            ORDER BY fecha_vencimiento ASC NULLS FIRST, id_lote
            FOR UPDATE
        LOOP
            EXIT WHEN v_cantidad_restante <= 0;

            v_consumo := LEAST(v_lote.cantidad_actual, v_cantidad_restante);

            IF v_consumo > 0 THEN
                v_valor_anterior := v_lote.cantidad_actual;
                v_valor_nuevo := ROUND(v_lote.cantidad_actual - v_consumo, 3);

                UPDATE lote_insumo
                SET cantidad_actual = v_valor_nuevo
                WHERE id_lote = v_lote.id_lote;

                INSERT INTO movimiento_inventario (
                    id_insumo,
                    id_lote,
                    tipo_movimiento,
                    cantidad,
                    id_perfil,
                    id_referencia,
                    descripcion,
                    costo_unitario_momento
                ) VALUES (
                    v_detalle.id_insumo,
                    v_lote.id_lote,
                    'salida_venta',
                    ROUND(v_consumo, 3),
                    p_id_perfil,
                    p_id_venta,
                    format('Venta #%s - %s', p_id_venta, v_detalle.nombre_insumo),
                    v_costo_actual
                );

                INSERT INTO bitacora_inventario (
                    id_insumo,
                    accion,
                    campo_modificado,
                    valor_anterior,
                    valor_nuevo,
                    id_perfil,
                    descripcion
                ) VALUES (
                    v_detalle.id_insumo,
                    'actualizacion',
                    'cantidad_actual',
                    to_char(v_valor_anterior, 'FM999999990.000'),
                    to_char(v_valor_nuevo, 'FM999999990.000'),
                    p_id_perfil,
                    format('Venta #%s - consumo de %.3f unidades (producto %s)', p_id_venta, v_consumo, v_detalle.id_producto)
                );

                v_cantidad_restante := ROUND(v_cantidad_restante - v_consumo, 3);
            END IF;
        END LOOP;

        IF v_cantidad_restante > 0.0001 THEN
            RAISE EXCEPTION USING MESSAGE = format(
                'No se pudo consumir completamente el insumo "%s" para la venta %s. Faltante: %.3f',
                v_detalle.nombre_insumo,
                p_id_venta,
                v_cantidad_restante
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- FIN DEL SCRIPT
-- =============================================================
