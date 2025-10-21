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
  CreateMovimientoDTO,
  StockActual,
} from '../types/inventario.types';

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
    const { data, error } = await supabase
      .from('insumo')
      .insert({
        ...dto,
        costo_promedio: dto.costo_promedio || 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear insumo: ${error.message}`);
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

  // ================== CATÁLOGO ==================

  async getCatalogoInsumos(): Promise<CatalogoInsumo[]> {
    const { data, error } = await supabase
      .from('insumo')
      .select(`
        id_insumo,
        nombre_insumo,
        unidad_medida,
        stock_actual,
        stock_minimo,
        stock_maximo,
        costo_promedio,
        imagen_url,
        activo,
        fecha_registro,
        id_categoria,
        id_proveedor_principal,
        categoria_insumo!inner(tipo_categoria, nombre)
      `)
      .order('nombre_insumo', { ascending: true });

    if (error) throw new Error(`Error al obtener catálogo de insumos: ${error.message}`);
    return (data || []).map((item: any) => ({
      id_insumo: item.id_insumo,
      nombre: item.nombre_insumo,
      unidad_medida: item.unidad_medida,
      stock_actual: item.stock_actual || 0,
      stock_minimo: item.stock_minimo,
      stock_maximo: item.stock_maximo,
      costo_promedio: item.costo_promedio,
      imagen_url: item.imagen_url,
      activo: item.activo,
      fecha_creacion: item.fecha_registro,
      id_categoria: item.id_categoria,
      id_proveedor_principal: item.id_proveedor_principal,
      categoria: item.categoria_insumo as { nombre: string; tipo_categoria: 'perpetuo' | 'operativo' },
    }));
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
      unidad_medida: item.unidad_medida as string,
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
}

export const inventarioService = new InventarioService();
