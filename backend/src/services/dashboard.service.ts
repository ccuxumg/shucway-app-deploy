import { StatsData, InventoryItem } from '../types';
import supabase from '../config/database';

export const dashboardService = {
  // Mapa explícito table -> primary key para evitar heurísticas
  primaryKeyMap: {
    rol_usuario: 'id_rol',
    perfil_usuario: 'id_perfil',
    bitacora_seguridad: 'id_bitacora_seguridad',
    categoria_insumo: 'id_categoria',
    proveedor: 'id_proveedor',
    insumo: 'id_insumo',
    lote_insumo: 'id_lote',
    movimiento_inventario: 'id_movimiento',
    orden_compra: 'id_orden',
    detalle_orden_compra: 'id_detalle',
    recepcion_mercaderia: 'id_recepcion',
    detalle_recepcion_mercaderia: 'id_detalle',
    categoria_producto: 'id_categoria',
    producto: 'id_producto',
    producto_variante: 'id_variante',
    receta_detalle: 'id_receta',
    cliente: 'id_cliente',
    venta: 'id_venta',
    detalle_venta: 'id_detalle',
    categoria_gasto: 'id_categoria',
    gasto_operativo: 'id_gasto',
    deposito_banco: 'id_deposito',
    arqueo_caja: 'id_arqueo',
    historial_puntos: 'id_historial',
    bitacora_inventario: 'id_bitacora_inventario',
    bitacora_ventas: 'id_bitacora_venta',
    bitacora_ordenes_compra: 'id_bitacora_orden',
    bitacora_productos: 'id_bitacora_producto'
  } as Record<string, string>,
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

  async createRecord(tableName: string, values: Record<string, unknown>) {
    try {
      const { data, error } = await supabase.from(tableName).insert(values).select().single();
      if (error) {
        console.error('Error creando registro en', tableName, error.message);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error en createRecord:', error);
      throw error;
    }
  },

  async updateRecord(tableName: string, id: string, values: Record<string, unknown>) {
    // Usar primaryKeyMap si existe, sino fallback a 'id'
    const pk = (this.primaryKeyMap && this.primaryKeyMap[tableName]) || 'id';

    try {
      const { data, error } = await supabase.from(tableName).update(values).eq(pk, id).select().single();
      if (error) {
        console.error('Error actualizando registro en', tableName, error.message);
        throw error;
      }
      return data;
    } catch (error: unknown) {
      console.error('Error en updateRecord:', error);
      // Fallback para categoria_producto, producto, producto_variante: si falla constraint en 'estado', intentar con 'estado = 'desactivado''
      const err = error as { code?: string; message?: string };
      if ((tableName === 'categoria_producto' || tableName === 'producto' || tableName === 'producto_variante') && err?.code === '23514' && err?.message?.includes('estado_check')) {
        console.log(`Intentando fallback para ${tableName}: usar estado = desactivado`);
        try {
          const { data, error: fallbackError } = await supabase.from(tableName).update({ estado: 'desactivado' }).eq(pk, id).select().single();
          if (fallbackError) {
            console.error('Fallback también falló:', fallbackError);
            throw fallbackError;
          }
          return data;
        } catch (fallbackErr) {
          console.error('Error en fallback updateRecord:', fallbackErr);
          throw fallbackErr;
        }
      }
      throw error;
    }
  },

  async deleteRecord(tableName: string, id: string) {
    try {
    // Usar primaryKeyMap si existe, sino fallback a 'id'
    const pk = (this.primaryKeyMap && this.primaryKeyMap[tableName]) || 'id';

    const { error } = await supabase.from(tableName).delete().eq(pk, id);
      if (error) {
        console.error('Error eliminando registro en', tableName, error.message);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error en deleteRecord:', error);
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
      // Obtener todos los insumos y su categoría
      const { data: insumos, error } = await supabase
        .from('insumo')
        .select(`
          id_insumo,
          nombre_insumo,
          id_categoria,
          activo,
          unidad_medida,
          stock_minimo,
          stock_maximo,
          categoria_insumo(tipo_categoria),
          lote_insumo(cantidad_actual)
        `)
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

      // Mapear todos los insumos, aunque no tengan lotes
      const mappedAll = insumos.map((row: Record<string, unknown>) => {
        // Calcular stock sumando cantidades de lotes (si existen)
        const lotes = Array.isArray(row.lote_insumo) ? row.lote_insumo as { cantidad_actual?: number }[] : [];
        const cantidad_actual = lotes.length ? lotes.reduce((sum, lote) => sum + (lote.cantidad_actual || 0), 0) : 0;
        const stockMinimo = Number(row.stock_minimo) || 0;
        let estado = 'Normal';
        if (cantidad_actual === 0) {
          estado = 'Sin Stock';
        } else if (cantidad_actual <= stockMinimo) {
          estado = 'Stock Bajo';
        } else if (cantidad_actual > stockMinimo * 2) {
          estado = 'OK';
        }
        return {
          id: row.id_insumo as number,
          name: row.nombre_insumo as string,
          qty: cantidad_actual.toString(),
          cantidad_actual,
          note: estado,
          tipo_insumo: (row.categoria_insumo as { tipo_categoria?: string })?.tipo_categoria || 'perpetuo'
        };
      });

      const perpetualItems = mappedAll.filter(m => m.tipo_insumo === 'perpetuo');
      const operationalItems = mappedAll.filter(m => m.tipo_insumo === 'operativo');

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
