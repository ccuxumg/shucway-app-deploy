import { pool } from '../config/database';
import { StatsData } from '../types';

export const dashboardService = {
  async getStats(): Promise<StatsData> {
    // Obtener ventas totales del día actual
    const ventasQuery = `
      WITH ventas_anteriores AS (
        SELECT SUM(total) as total_anterior
        FROM venta 
        WHERE fecha_venta::date = CURRENT_DATE - INTERVAL '1 day'
        AND estado = 'completada'
      ),
      ventas_actuales AS (
        SELECT SUM(total) as total_actual
        FROM venta 
        WHERE fecha_venta::date = CURRENT_DATE
        AND estado = 'completada'
      )
      SELECT 
        COALESCE(va.total_actual, 0) as total,
        CASE 
          WHEN va.total_anterior = 0 THEN 100
          WHEN va.total_anterior IS NULL THEN 0
          ELSE ((va.total_actual - vp.total_anterior) / vp.total_anterior * 100)
        END as cambio_porcentual
      FROM ventas_actuales va
      CROSS JOIN ventas_anteriores vp;
    `;

    // Obtener total de productos en stock
    const inventarioQuery = `
      WITH stock_anterior AS (
        SELECT SUM(cantidad) as total_anterior
        FROM movimiento_inventario
        WHERE fecha_movimiento::date = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY fecha_movimiento::date
      ),
      stock_actual AS (
        SELECT SUM(cantidad) as total_actual
        FROM movimiento_inventario
        WHERE fecha_movimiento::date = CURRENT_DATE
        GROUP BY fecha_movimiento::date
      )
      SELECT 
        COALESCE(sa.total_actual, 0) as total,
        CASE 
          WHEN sp.total_anterior = 0 THEN 100
          WHEN sp.total_anterior IS NULL THEN 0
          ELSE ((sa.total_actual - sp.total_anterior) / sp.total_anterior * 100)
        END as cambio_porcentual
      FROM stock_actual sa
      CROSS JOIN stock_anterior sp;
    `;

    // Obtener clientes activos (que han comprado en los últimos 30 días)
    const clientesQuery = `
      WITH clientes_mes_anterior AS (
        SELECT COUNT(DISTINCT id_cliente) as total_anterior
        FROM venta
        WHERE fecha_venta >= CURRENT_DATE - INTERVAL '60 days'
        AND fecha_venta < CURRENT_DATE - INTERVAL '30 days'
        AND estado = 'completada'
      ),
      clientes_actuales AS (
        SELECT COUNT(DISTINCT id_cliente) as total_actual
        FROM venta
        WHERE fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
        AND estado = 'completada'
      )
      SELECT 
        ca.total_actual as total,
        CASE 
          WHEN cma.total_anterior = 0 THEN 100
          WHEN cma.total_anterior IS NULL THEN 0
          ELSE ((ca.total_actual - cma.total_anterior) / cma.total_anterior * 100)
        END as cambio_porcentual
      FROM clientes_actuales ca
      CROSS JOIN clientes_mes_anterior cma;
    `;

    // Obtener ganancias (ventas - costos)
    const gananciasQuery = `
      WITH ganancias_anteriores AS (
        SELECT 
          SUM(total - costo_total) as total_anterior
        FROM venta
        WHERE fecha_venta::date = CURRENT_DATE - INTERVAL '1 day'
        AND estado = 'completada'
      ),
      ganancias_actuales AS (
        SELECT 
          SUM(total - costo_total) as total_actual
        FROM venta
        WHERE fecha_venta::date = CURRENT_DATE
        AND estado = 'completada'
      )
      SELECT 
        COALESCE(ga.total_actual, 0) as total,
        CASE 
          WHEN gp.total_anterior = 0 THEN 100
          WHEN gp.total_anterior IS NULL THEN 0
          ELSE ((ga.total_actual - gp.total_anterior) / gp.total_anterior * 100)
        END as cambio_porcentual
      FROM ganancias_actuales ga
      CROSS JOIN ganancias_anteriores gp;
    `;

    const [ventasResult, inventarioResult, clientesResult, gananciasResult] = await Promise.all([
      pool.query(ventasQuery),
      pool.query(inventarioQuery),
      pool.query(clientesQuery),
      pool.query(gananciasQuery)
    ]);

    return {
      ventas: {
        total: ventasResult.rows[0]?.total || 0,
        change: Number(ventasResult.rows[0]?.cambio_porcentual || 0)
      },
      inventario: {
        total: inventarioResult.rows[0]?.total || 0,
        change: Number(inventarioResult.rows[0]?.cambio_porcentual || 0)
      },
      clientes: {
        total: clientesResult.rows[0]?.total || 0,
        change: Number(clientesResult.rows[0]?.cambio_porcentual || 0)
      },
      ganancias: {
        total: gananciasResult.rows[0]?.total || 0,
        change: Number(gananciasResult.rows[0]?.cambio_porcentual || 0)
      }
    };
  },

  async getVentasSemana() {
    const query = `
      SELECT 
        TO_CHAR(fecha_venta, 'Dy') as dia,
        SUM(total) as total
      FROM venta
      WHERE fecha_venta >= CURRENT_DATE - INTERVAL '6 days'
      AND fecha_venta < CURRENT_DATE + INTERVAL '1 day'
      AND estado = 'completada'
      GROUP BY fecha_venta::date, TO_CHAR(fecha_venta, 'Dy')
      ORDER BY fecha_venta::date;
    `;

    const result = await pool.query(query);
    return result.rows;
  },

  async getAlertasRecientes(limit = 5) {
    const query = `
      (
        SELECT 
          'warning' as type,
          'Stock bajo en ' || i.nombre_insumo || ' (' || fn_obtener_stock_actual(i.id_insumo) || ' unidades restantes)' as message,
          NOW() as timestamp
        FROM insumo i
        WHERE fn_obtener_stock_actual(i.id_insumo) <= i.stock_minimo
        AND i.activo = true
        LIMIT $1
      )
      UNION ALL
      (
        SELECT 
          'info' as type,
          'Venta alta detectada: Q' || v.total || ' en la última hora' as message,
          v.fecha_venta as timestamp
        FROM venta v
        WHERE v.fecha_venta >= NOW() - INTERVAL '1 hour'
        AND v.total > 1000
        AND v.estado = 'completada'
        ORDER BY v.total DESC
        LIMIT $1
      )
      ORDER BY timestamp DESC
      LIMIT $1;
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }
};
