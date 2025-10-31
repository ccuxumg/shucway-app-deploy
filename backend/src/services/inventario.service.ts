import { supabase } from '../config/database';
import {
  Insumo,
  CatalogoInsumo,
  CategoriaInsumo,
  LoteInsumo,
  MovimientoInventario,
  CreateInsumoDTO,
  UpdateInsumoDTO,
  CreateLoteDTO,
  CreatePresentacionDTO,
  CreateMovimientoDTO,
  StockActual,
} from '../types/inventario.types';

// Interface for the raw query result from Supabase with joins
interface CatalogoQueryResult {
  id_insumo: number;
  nombre_insumo: string;
  unidad_base: string;
  stock_minimo: number;
  stock_maximo: number;
  costo_promedio: number;
  activo: boolean;
  fecha_registro: Date;
  id_categoria: number;
  id_proveedor_principal?: number;
  categoria_insumo: Array<{
    tipo_categoria: 'perpetuo' | 'operativo';
    nombre: string;
  }>;
  lote_insumo: Array<{
    cantidad_actual: number;
  }>;
}

// ================================================================
// 📦 SERVICIO DE INVENTARIO
// ================================================================

export class InventarioService {
  // ================== CATEGORÍAS DE INSUMOS ==================

  async getCategoriasInsumo(): Promise<CategoriaInsumo[]> {
    const { data, error } = await supabase
      .from('categoria_insumo')
      .select('*')
      .order('nombre');

    if (error) throw new Error(`Error al obtener categorías de insumos: ${error.message}`);
    return data || [];
  }

  async getCategoriaInsumoById(id: number): Promise<CategoriaInsumo | null> {
    const { data, error } = await supabase
      .from('categoria_insumo')
      .select('*')
      .eq('id_categoria', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }
    return data;
  }

  // ================== INSUMOS ==================

  async getInsumos(activos?: boolean): Promise<Insumo[]> {
    let query = supabase
      .from('insumo')
      .select('*')
      .order('nombre_insumo');

    if (activos !== undefined) {
      query = query.eq('activo', activos);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error al obtener insumos: ${error.message}`);
    return data || [];
  }

  async getInsumoById(id: number): Promise<Insumo | null> {
    const { data, error } = await supabase
      .from('insumo')
      .select('*')
      .eq('id_insumo', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener insumo: ${error.message}`);
    }
    return data;
  }

  async createInsumo(dto: CreateInsumoDTO): Promise<Insumo> {
    // Extraer campos relacionados con presentaciones y lotes
    const { fecha_vencimiento, ...insumoData } = dto;

    const { data, error } = await supabase
      .from('insumo')
      .insert({
        ...insumoData,
        costo_promedio: dto.costo_promedio || 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear insumo: ${error.message}`);

    // Crear presentación principal para el insumo
    if (data?.id_insumo) {
      const presentacionData: CreatePresentacionDTO = {
        id_insumo: data.id_insumo,
        id_proveedor: dto.id_proveedor_principal,
        descripcion_presentacion: dto.descripcion_presentacion,
        unidad_compra: dto.unidad_base, // Usar la misma unidad base como unidad de compra por defecto
        unidades_por_presentacion: 1, // 1 unidad por presentación por defecto
        costo_compra_unitario: dto.costo_promedio || 0,
        es_principal: true, // Esta es la presentación principal
      };

      const { error: presentacionError } = await supabase
        .from('insumo_presentacion')
        .insert(presentacionData);

      if (presentacionError) {
        console.warn(`Error al crear presentación para insumo ${data.id_insumo}: ${presentacionError.message}`);
        // No lanzamos error aquí para no fallar la creación del insumo
      }

      // Si se proporcionó fecha_vencimiento, crear un lote inicial
      if (fecha_vencimiento) {
        const { error: loteError } = await supabase
          .from('lote_insumo')
          .insert({
            id_insumo: data.id_insumo,
            fecha_vencimiento: fecha_vencimiento,
            cantidad_inicial: 0, // El lote se crea vacío inicialmente
            cantidad_actual: 0,
            costo_unitario: dto.costo_promedio || 0,
            ubicacion: 'Bodega Principal' // Ubicación por defecto
          });

        if (loteError) {
          console.warn(`Error al crear lote inicial para insumo ${data.id_insumo}: ${loteError.message}`);
          // No lanzamos error aquí para no fallar la creación del insumo
        }
      }
    }

    return data;
  }

  async updateInsumo(id: number, dto: UpdateInsumoDTO): Promise<Insumo> {
    const { data, error } = await supabase
      .from('insumo')
      .update(dto)
      .eq('id_insumo', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar insumo: ${error.message}`);
    return data;
  }

  async deleteInsumo(id: number): Promise<void> {
    const { error } = await supabase
      .from('insumo')
      .delete()
      .eq('id_insumo', id);

    if (error) throw new Error(`Error al eliminar insumo: ${error.message}`);
  }

  async getProveedorPrincipal(idInsumo: number): Promise<number | null> {
    const { data, error } = await supabase
      .from('insumo_presentacion')
      .select('id_proveedor')
      .eq('id_insumo', idInsumo)
      .eq('es_principal', true)
      .eq('activo', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener proveedor principal: ${error.message}`);
    }
    return data?.id_proveedor || null;
  }

  // ================== CATÁLOGO ==================

  async getCatalogoInsumos(): Promise<CatalogoInsumo[]> {
    console.log('Ejecutando consulta getCatalogoInsumos');
    const { data, error } = await supabase
      .from('insumo')
      .select(`
        id_insumo,
        nombre_insumo,
        unidad_base,
        stock_minimo,
        stock_maximo,
        costo_promedio,
        activo,
        fecha_registro,
        id_categoria,
        categoria_insumo:categoria_insumo(nombre, tipo_categoria),
        lote_insumo:lote_insumo(cantidad_actual),
        insumo_presentacion!inner(id_proveedor, descripcion_presentacion, es_principal, activo)
      `)
      .eq('insumo_presentacion.es_principal', true)
      .eq('insumo_presentacion.activo', true)
      .order('nombre_insumo', { ascending: true });

    if (error) {
      console.error('Error en consulta:', error);
      throw new Error(`Error al obtener catálogo de insumos: ${error.message}`);
    }

    // Mapeo igual que dashboard: incluye insumos sin lotes/categoría
    return (data || []).map((item: CatalogoQueryResult) => {
      // Calcular stock total desde lotes (si no hay, 0)
      const lotes = Array.isArray(item.lote_insumo) ? item.lote_insumo : [];
      const stock_actual = lotes.length ? lotes.reduce((sum, lote) => sum + (lote.cantidad_actual || 0), 0) : 0;

      // Si no hay categoría, asigna tipo 'perpetuo' y nombre '—'
      let categoriaObj: { nombre: string; tipo_categoria: 'perpetuo' | 'operativo' };
      if (Array.isArray(item.categoria_insumo) && item.categoria_insumo.length > 0) {
        const raw = item.categoria_insumo[0];
        categoriaObj = {
          nombre: raw.nombre || '—',
          tipo_categoria: raw.tipo_categoria === 'operativo' ? 'operativo' : 'perpetuo'
        };
      } else {
        categoriaObj = { nombre: '—', tipo_categoria: 'perpetuo' };
      }

      return {
        id_insumo: item.id_insumo,
        nombre: item.nombre_insumo,
        unidad_base: item.unidad_base || 'unidades',
        stock_actual,
        stock_minimo: item.stock_minimo,
        stock_maximo: item.stock_maximo,
        costo_promedio: item.costo_promedio,
        activo: item.activo,
        fecha_creacion: item.fecha_registro,
        id_categoria: item.id_categoria,
        id_proveedor_principal: item.id_proveedor_principal,
        categoria: categoriaObj,
      };
    });
  }

  // ================== LOTES ==================

  async getLotesByInsumo(idInsumo: number): Promise<LoteInsumo[]> {
    const { data, error } = await supabase
      .from('lote_insumo')
      .select('*')
      .eq('id_insumo', idInsumo)
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw new Error(`Error al obtener lotes: ${error.message}`);
    return data || [];
  }

  async getLoteById(id: number): Promise<LoteInsumo | null> {
    const { data, error } = await supabase
      .from('lote_insumo')
      .select('*')
      .eq('id_lote', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener lote: ${error.message}`);
    }
    return data;
  }

  async createLote(dto: CreateLoteDTO): Promise<LoteInsumo> {
    const { data, error } = await supabase
      .from('lote_insumo')
      .insert({
        id_insumo: dto.id_insumo,
        fecha_vencimiento: dto.fecha_vencimiento,
        cantidad_inicial: dto.cantidad_inicial,
        cantidad_actual: dto.cantidad_inicial,
        costo_unitario: dto.costo_unitario,
        ubicacion: dto.ubicacion,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear lote: ${error.message}`);

    // Actualizar costo promedio del insumo (función PL/pgSQL fn_actualizar_costo_promedio)
    await this.actualizarCostoPromedio(dto.id_insumo);

    return data;
  }

  async deleteLote(id: number): Promise<void> {
    const { error } = await supabase
      .from('lote_insumo')
      .delete()
      .eq('id_lote', id);

    if (error) throw new Error(`Error al eliminar lote: ${error.message}`);
  }

  // ================== MOVIMIENTOS ==================

  async getMovimientos(
    idInsumo?: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<MovimientoInventario[]> {
    let query = supabase
      .from('movimiento_inventario')
      .select('*')
      .order('fecha_movimiento', { ascending: false });

    if (idInsumo) {
      query = query.eq('id_insumo', idInsumo);
    }

    if (fechaInicio) {
      query = query.gte('fecha_movimiento', fechaInicio);
    }

    if (fechaFin) {
      query = query.lte('fecha_movimiento', fechaFin);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error al obtener movimientos: ${error.message}`);
    return data || [];
  }

  async createMovimiento(dto: CreateMovimientoDTO): Promise<MovimientoInventario> {
    const { data, error } = await supabase
      .from('movimiento_inventario')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(`Error al registrar movimiento: ${error.message}`);

    // Actualizar costo promedio después del movimiento
    if (dto.tipo_movimiento.startsWith('entrada')) {
      await this.actualizarCostoPromedio(dto.id_insumo);
    }

    return data;
  }

  // ================== STOCK ==================

  /**
   * Obtener stock actual usando función PL/pgSQL fn_obtener_stock_actual
   */
  async getStockActual(idInsumo?: number): Promise<StockActual[]> {
    const query = supabase.rpc('fn_obtener_stock_actual', {
      p_id_insumo: idInsumo || null,
    });

    const { data, error } = await query;

    if (error) throw new Error(`Error al obtener stock actual: ${error.message}`);

    // Determinar estado del stock
    return (data || []).map((item: Record<string, unknown>) => ({
      id_insumo: item.id_insumo as number,
      nombre_insumo: item.nombre_insumo as string,
      cantidad_actual: item.cantidad_actual as number,
      unidad_base: item.unidad_base as string,
      stock_minimo: item.stock_minimo as number,
      stock_maximo: item.stock_maximo as number,
      costo_promedio: item.costo_promedio as number,
      estado_stock:
        (item.cantidad_actual as number) < (item.stock_minimo as number)
          ? 'bajo'
          : (item.cantidad_actual as number) > (item.stock_maximo as number)
          ? 'alto'
          : 'normal',
    }));
  }

  /**
   * Obtener insumos con stock bajo
   */
  async getInsumosStockBajo(): Promise<StockActual[]> {
    const stock = await this.getStockActual();
    return stock.filter((s) => s.estado_stock === 'bajo');
  }

  /**
   * Actualizar costo promedio usando función PL/pgSQL
   */
  private async actualizarCostoPromedio(idInsumo: number): Promise<void> {
    const { error } = await supabase.rpc('fn_actualizar_costo_promedio', {
      p_id_insumo: idInsumo,
    });

    if (error) {
      console.error(`Error al actualizar costo promedio: ${error.message}`);
      // No lanzar error, solo log
    }
  }

  // ================== KARDEX ==================

  async getKardexInsumo(idInsumo: number, fechaDesde?: string, fechaHasta?: string) {
    const { data, error } = await supabase
      .rpc('fn_kardex_insumo', {
        p_id_insumo: idInsumo,
        p_fecha_desde: fechaDesde || null,
        p_fecha_hasta: fechaHasta || null,
      });

    if (error) throw new Error(`Error al obtener kardex del insumo: ${error.message}`);
    return data || [];
  }

  // ================== DETALLES DE INSUMO ==================

  async getInsumoDetails(idInsumo: number) {
    const { data, error } = await supabase
      .from('insumo')
      .select(`
        id_insumo,
        nombre_insumo,
        unidad_base,
        stock_minimo,
        stock_maximo,
        costo_promedio,
        activo,
        fecha_registro,
        categoria_insumo:categoria_insumo(nombre, tipo_categoria),
        proveedor:proveedor(nombre_proveedor, metodo_entrega)
      `)
      .eq('id_insumo', idInsumo)
      .single();

    if (error) throw new Error(`Error al obtener detalles del insumo: ${error.message}`);
    return data;
  }
}

export const inventarioService = new InventarioService();
