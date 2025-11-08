-- Script para corregir la función fn_acumular_puntos_venta, el trigger y el sistema de inventario
-- Ejecutar este script en la base de datos para solucionar los errores de columna "puntos" y tabla "inventario"

-- Primero, eliminar triggers y funciones incorrectos
DROP TRIGGER IF EXISTS trg_acumular_puntos_venta ON venta;
DROP TRIGGER IF EXISTS trg_descontar_inventario_venta ON venta;
DROP FUNCTION IF EXISTS fn_acumular_puntos_venta();
DROP FUNCTION IF EXISTS fn_descontar_inventario_venta();

-- Crear la función correcta para descontar inventario (de database_complete_new.sql)
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
            RAISE EXCEPTION 'Stock insuficiente para el insumo "%". Requerido: %, disponible: %',
                v_detalle.nombre_insumo,
                to_char(v_cantidad_a_descontar, 'FM999999990.000'),
                to_char(v_stock_disponible, 'FM999999990.000');
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
                    'Venta #' || p_id_venta || ' - ' || v_detalle.nombre_insumo,
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
                    'Venta #' || p_id_venta || ' - consumo de ' || to_char(v_consumo, 'FM999999990.000') || ' unidades (producto ' || v_detalle.id_producto || ')'
                );

                v_cantidad_restante := ROUND(v_cantidad_restante - v_consumo, 3);
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para descontar inventario cuando se confirma la venta
CREATE OR REPLACE FUNCTION trg_descontar_inventario_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar ventas confirmadas
    IF NEW.estado = 'confirmada' THEN
        -- Llamar a la función de descuento de inventario
        PERFORM fn_descontar_inventario_venta(NEW.id_venta, NEW.id_cajero);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger de inventario
CREATE TRIGGER trg_descontar_inventario_venta
AFTER INSERT OR UPDATE ON venta
FOR EACH ROW EXECUTE FUNCTION trg_descontar_inventario_venta();

-- Crear la función correcta (copiada de database_complete_new.sql)
CREATE OR REPLACE FUNCTION fn_acumular_puntos_venta(p_id_venta INTEGER, p_id_cajero INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_id_cliente INTEGER;
    v_puntos_anteriores INTEGER;
    v_puntos_nuevos INTEGER;
BEGIN
    -- Obtener el cliente de la venta
    SELECT id_cliente INTO v_id_cliente
    FROM venta
    WHERE id_venta = p_id_venta;

    -- Si no hay cliente, no acumular puntos
    IF v_id_cliente IS NULL THEN
        RETURN;
    END IF;

    -- Obtener puntos actuales del cliente
    SELECT COALESCE(puntos_acumulados, 0) INTO v_puntos_anteriores
    FROM cliente
    WHERE id_cliente = v_id_cliente;

    -- Calcular nuevos puntos (1 punto por venta)
    v_puntos_nuevos := v_puntos_anteriores + 1;

    -- Actualizar puntos del cliente
    UPDATE cliente
    SET puntos_acumulados = v_puntos_nuevos,
        ultima_compra = CURRENT_TIMESTAMP
    WHERE id_cliente = v_id_cliente;

    -- Registrar en historial de puntos
    INSERT INTO historial_puntos (
        id_cliente,
        id_venta,
        tipo_movimiento,
        puntos_anterior,
        puntos_movimiento,
        puntos_nuevo,
        descripcion,
        id_cajero
    ) VALUES (
        v_id_cliente,
        p_id_venta,
        'acumulacion',
        v_puntos_anteriores,
        1,
        v_puntos_nuevos,
        'Punto acumulado por venta',
        p_id_cajero
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger correcto (si es necesario, pero en el código se llama manualmente)
-- Nota: En el código actual, se llama manualmente a la función, no con trigger automático