-- Scripts SQL corregidos para evitar errores de triggers existentes

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS trg_descontar_inventario_venta ON venta;
DROP TRIGGER IF EXISTS trg_acumular_puntos_venta ON venta;

-- Función para descontar inventario en ventas
CREATE OR REPLACE FUNCTION fn_descontar_inventario_venta()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar ventas confirmadas
  IF NEW.estado = 'confirmada' THEN
    -- Descontar del inventario de cada producto vendido
    UPDATE inventario
    SET cantidad = cantidad - (
      SELECT dv.cantidad
      FROM detalle_venta dv
      WHERE dv.id_venta = NEW.id_venta
      AND dv.id_inventario = inventario.id_inventario
    )
    WHERE id_inventario IN (
      SELECT dv.id_inventario
      FROM detalle_venta dv
      WHERE dv.id_venta = NEW.id_venta
    );

    -- Registrar movimientos en kardex
    INSERT INTO movimiento_inventario (id_inventario, tipo_movimiento, cantidad, motivo, fecha_movimiento)
    SELECT
      dv.id_inventario,
      'salida',
      dv.cantidad,
      'Venta confirmada - ID: ' || NEW.id_venta,
      NEW.fecha_venta
    FROM detalle_venta dv
    WHERE dv.id_venta = NEW.id_venta;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para acumular puntos en ventas
CREATE OR REPLACE FUNCTION fn_acumular_puntos_venta()
RETURNS TRIGGER AS $$
DECLARE
  puntos_ganados INTEGER;
  id_cliente_actual INTEGER;
BEGIN
  -- Solo procesar ventas confirmadas
  IF NEW.estado = 'confirmada' THEN
    -- Obtener el ID del cliente
    SELECT id_cliente INTO id_cliente_actual
    FROM venta
    WHERE id_venta = NEW.id_venta;

    -- Solo acumular puntos si hay un cliente asociado
    IF id_cliente_actual IS NOT NULL THEN
      -- Calcular puntos ganados (1 punto por cada Q5.00 gastados)
      SELECT FLOOR(NEW.total_venta / 5.00) INTO puntos_ganados;

      -- Actualizar puntos del cliente
      UPDATE cliente
      SET puntos_acumulados = puntos_acumulados + puntos_ganados
      WHERE id_cliente = id_cliente_actual;

      -- Registrar en historial de puntos
      INSERT INTO historial_puntos (id_cliente, puntos, tipo_operacion, descripcion, fecha_operacion)
      VALUES (
        id_cliente_actual,
        puntos_ganados,
        'acumular',
        'Compra realizada - Venta ID: ' || NEW.id_venta,
        NEW.fecha_venta
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
CREATE TRIGGER trg_descontar_inventario_venta
AFTER INSERT OR UPDATE ON venta
FOR EACH ROW EXECUTE FUNCTION fn_descontar_inventario_venta();

CREATE TRIGGER trg_acumular_puntos_venta
AFTER INSERT OR UPDATE ON venta
FOR EACH ROW EXECUTE FUNCTION fn_acumular_puntos_venta();