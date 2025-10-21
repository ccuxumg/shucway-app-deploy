import { StatsData, InventoryItem } from '../types';
import supabase from '../config/database';

export const dashboardService = {
  async getStats(): Promise<StatsData> {
    // TODO: Convertir consultas SQL complejas a usar Supabase API
    // Por ahora devolver datos de ejemplo para que compile
    return {
      ventas: {
        total: 0,
        change: 0
      },
      inventario: {
        total: 0,
        change: 0
      },
      clientes: {
        total: 0,
        change: 0
      },
      ganancias: {
        total: 0,
        change: 0
      }
    };
  },

  async getVentasSemana() {
    // TODO: Convertir consulta SQL a usar Supabase API
    // Por ahora devolver datos de ejemplo
    return [];
  },

  async getAlertasRecientes() {
    // TODO: Convertir consulta SQL a usar Supabase API
    // Por ahora devolver datos de ejemplo
    return [];
  },

  async getAvailableTables(): Promise<string[]> {
    // Lista de tablas disponibles para mantenimiento
    // Estas son las tablas principales del sistema que deberían estar accesibles
    return [
      'rol_usuario',
      'perfil_usuario',
      'categoria_insumo',
      'proveedor',
      'insumo',
      'lote_insumo',
      'movimiento_inventario',
      'orden_compra',
      'detalle_orden_compra',
      'recepcion_mercaderia',
      'detalle_recepcion_mercaderia',
      'categoria_producto',
      'producto',
      'producto_variante',
      'receta_detalle',
      'cliente',
      'venta',
      'detalle_venta',
      'categoria_gasto',
      'gasto_operativo',
      'arqueo_caja',
      'historial_puntos',
      'bitacora_inventario',
      'bitacora_ventas',
      'bitacora_ordenes_compra',
      'bitacora_productos'
    ];
  },

  async getTableColumns(tableName: string): Promise<{ column_name: string; data_type: string; is_nullable: string; ordinal_position: number }[]> {
    try {
      // Intentar consultar las columnas usando information_schema
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, ordinal_position')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');

      if (error) {
        console.warn('No se pudieron obtener columnas desde information_schema:', error.message);
        // Fallback: intentar obtener columnas consultando la tabla con limit 0
        try {
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          if (!sampleError && sampleData && sampleData.length > 0) {
            const columns = Object.keys(sampleData[0]).map((key, index) => ({
              column_name: key,
              data_type: 'text', // No podemos determinar el tipo exacto
              is_nullable: 'YES',
              ordinal_position: index + 1
            }));
            return columns;
          }
        } catch (fallbackError) {
          console.warn('Fallback también falló:', fallbackError);
        }
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener columnas de la tabla:', error);
      return [];
    }
  },

  async getTableData(tableName: string, filters: Record<string, string> = {}): Promise<Record<string, unknown>[]> {
    try {
      let query = supabase.from(tableName).select('*');

      Object.entries(filters).forEach(([key, value]) => {
        if (value) query = query.ilike(key, `%${value}%`);
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error al consultar datos de tabla:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error al obtener datos de la tabla:', error);
      throw error;
    }
  },

  async getInventoryData(): Promise<{ 
    perpetual: InventoryItem[]; 
    operational: InventoryItem[]; 
    totalPerpetualStock: number; 
    totalOperationalStock: number; 
    totalPerpetualItems: number; 
    totalOperationalItems: number; 
  }> {
    try {
      // Primero obtener el mapeo de categorías
      const { data: categorias, error: catError } = await supabase
        .from('categoria_insumo')
        .select('id_categoria, tipo_categoria');

      if (catError) {
        console.error('Error leyendo categorias:', catError);
        throw catError;
      }

      const categoriaMap = new Map(categorias?.map(c => [c.id_categoria, c.tipo_categoria]) || []);

      // Leer insumos con stock_actual incluido
      const { data: insumos, error } = await supabase
        .from('insumo')
        .select('id_insumo, nombre_insumo, id_categoria, activo, stock_actual, unidad_medida, stock_minimo')
        .eq('activo', true)
        .order('nombre_insumo', { ascending: true });

      if (error) {
        console.error('Error leyendo insumo:', error);
        throw error;
      }

      if (!Array.isArray(insumos) || insumos.length === 0) {
        return {
          perpetual: [],
          operational: [],
          totalPerpetualStock: 0,
          totalOperationalStock: 0,
          totalPerpetualItems: 0,
          totalOperationalItems: 0
        };
      }

      // Clasificar insumos por tipo_categoria usando stock_actual directamente
      const mappedAll = insumos.map((row: Record<string, unknown>) => {
        const stock = (row.stock_actual as number) || 0;
        const stockMinimo = (row.stock_minimo as number) || 0;
        let estado = 'Normal';

        if (stock === 0) {
          estado = 'Sin Stock';
        } else if (stock <= stockMinimo) {
          estado = 'Stock Bajo';
        } else if (stock > stockMinimo * 2) {
          estado = 'OK';
        }

        return {
          id: row.id_insumo as number,
          name: row.nombre_insumo as string,
          qty: stock.toString(),
          note: estado,
          tipo_insumo: categoriaMap.get(row.id_categoria as number) || 'perpetuo'
        };
      });

        const perpetualItems = mappedAll
          .filter(m => m.tipo_insumo === 'perpetuo')
          .map(({ id, name, qty, note }) => ({ id, name, qty, note }));

        const operationalItems = mappedAll
          .filter(m => m.tipo_insumo === 'operativo')
          .map(({ id, name, qty, note }) => ({ id, name, qty, note }));

        // Calcular totales
        const totalPerpetualStock = perpetualItems.reduce((sum, item) => sum + (parseFloat(item.qty || '0') || 0), 0);
        const totalOperationalStock = operationalItems.reduce((sum, item) => sum + (parseFloat(item.qty || '0') || 0), 0);
        const totalPerpetualItems = perpetualItems.length;
        const totalOperationalItems = operationalItems.length;

        return { 
          perpetual: perpetualItems, 
          operational: operationalItems, 
          totalPerpetualStock, 
          totalOperationalStock, 
          totalPerpetualItems, 
          totalOperationalItems 
        };
    } catch (error) {
      console.error('Error cargando datos de inventario:', error);
      throw error;
    }
  }
};
