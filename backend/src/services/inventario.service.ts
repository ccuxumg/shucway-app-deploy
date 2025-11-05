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
    ubicacion?: string;
  }>;
  insumo_presentacion?: Array<{
    id_proveedor?: number;
    descripcion_presentacion?: string;
    es_principal?: boolean;
    activo?: boolean;
  }>;
}

// Interface for presentaciones with related data
interface PresentacionCompleta {
  insumo: {
    id_insumo: number;
    nombre_insumo: string;
    unidad_base: string;
    costo_promedio: number | null;
    stock_minimo: number;
    stock_maximo: number;
    stock_actual: number;
    activo: boolean;
  };
  presentacion: {
    id_presentacion: number;
    descripcion_presentacion: string;
    unidad_compra: string;
    unidades_por_presentacion: number;
    costo_compra_unitario: number;
    es_principal: boolean;
    activo: boolean;
  };
  proveedor: {
    id_proveedor: number;
    nombre_proveedor: string;
  } | null;
  lotes_disponibles: LoteInsumo[];
}

// ================================================================
// 📦 SERVICIO DE INVENTARIO
// ================================================================

export class InventarioService {
  // ================== HELPERS ==================

  /**
   * Actualiza el id_proveedor_principal del insumo basado en sus presentaciones activas
   */
  private async updateProveedorPrincipal(idInsumo: number): Promise<void> {
    try {
      // Obtener presentaciones activas del insumo
      const { data: presentaciones, error } = await supabase
        .from('insumo_presentacion')
        .select('id_proveedor')
        .eq('id_insumo', idInsumo)
        .eq('activo', true)
        .order('es_principal', { ascending: false }); // Primero las principales

      if (error) {
        console.warn(`Error al obtener presentaciones para actualizar proveedor principal: ${error.message}`);
        return;
      }

      let nuevoProveedorPrincipal = null;
      if (presentaciones && presentaciones.length > 0) {
        // Usar el proveedor de la primera presentación (ya ordenada por es_principal)
        nuevoProveedorPrincipal = presentaciones[0].id_proveedor;
      }

      // Actualizar el insumo
      const { error: updateError } = await supabase
        .from('insumo')
        .update({ id_proveedor_principal: nuevoProveedorPrincipal })
        .eq('id_insumo', idInsumo);

      if (updateError) {
        console.warn(`Error al actualizar proveedor principal del insumo ${idInsumo}: ${updateError.message}`);
      } else {
        console.log(`Proveedor principal actualizado para insumo ${idInsumo}: ${nuevoProveedorPrincipal}`);
      }
    } catch (error) {
      console.error(`Error en updateProveedorPrincipal para insumo ${idInsumo}:`, error);
    }
  }
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
      .select(`
        *,
        categoria_insumo(tipo_categoria),
        lote_insumo(cantidad_actual)
      `)
      .order('nombre_insumo');

    if (activos !== undefined) {
      query = query.eq('activo', activos);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error al obtener insumos: ${error.message}`);

    // Calcular stock_actual sumando cantidad_actual de todos los lotes
    const insumosConStock = (data || []).map(insumo => ({
      ...insumo,
      tipo_insumo: insumo.categoria_insumo?.tipo_categoria || 'operativo',
      stock_actual: Array.isArray(insumo.lote_insumo)
        ? insumo.lote_insumo.reduce((sum: number, lote: { cantidad_actual: number }) => sum + (lote.cantidad_actual || 0), 0)
        : 0
    }));

    return insumosConStock;
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
    // Extraer campos que no pertenecen a la tabla insumo
    const { fecha_vencimiento, ubicacion, descripcion_presentacion, ...insumoData } = dto;

    const { data, error } = await supabase
      .from('insumo')
      .insert({
        ...insumoData,
        costo_promedio: dto.costo_promedio || 0,
      })
      .select()
      .single();

    if (error) throw new Error(`Error al crear insumo: ${error.message}`);

    // Crear presentación principal para el insumo SIEMPRE
    if (data?.id_insumo) {
      console.log(`Creando presentación y lote para insumo ${data.id_insumo} (${dto.nombre_insumo})`);
      
      const presentacionData: CreatePresentacionDTO = {
        id_insumo: data.id_insumo,
        id_proveedor: dto.id_proveedor_principal,
        descripcion_presentacion: descripcion_presentacion || `Presentación principal de ${dto.nombre_insumo}`,
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
      } else {
        console.log(`Presentación creada exitosamente para insumo ${data.id_insumo}`);
        // Actualizar el proveedor principal del insumo
        await this.updateProveedorPrincipal(data.id_insumo);
      }

      // Crear lote inicial SIEMPRE (incluso sin fecha de vencimiento)
      console.log(`Creando lote para insumo ${data.id_insumo}, fecha_vencimiento proporcionada:`, fecha_vencimiento);
      
      const loteData: Record<string, unknown> = {
        id_insumo: data.id_insumo,
        cantidad_inicial: 0,
        cantidad_actual: 0,
        costo_unitario: dto.costo_promedio || 0,
        ubicacion: ubicacion || 'Bodega Principal'
      };

      // Solo agregar fecha_vencimiento si se proporcionó
      if (fecha_vencimiento) {
        loteData.fecha_vencimiento = fecha_vencimiento;
      }

      console.log('Datos del lote a insertar:', loteData);

      const { data: loteInsertado, error: loteError } = await supabase
        .from('lote_insumo')
        .insert(loteData)
        .select();

      if (loteError) {
        console.error(`Error al crear lote inicial para insumo ${data.id_insumo}:`, loteError);
        console.warn(`Error al crear lote inicial para insumo ${data.id_insumo}: ${loteError.message}`);
        // No lanzamos error aquí para no fallar la creación del insumo
      } else {
        console.log(`Lote creado exitosamente para insumo ${data.id_insumo}:`, loteInsertado);
      }
    }

    return data;
  }

  async updateInsumo(id: number, dto: UpdateInsumoDTO): Promise<Insumo> {
    // Extraer campos relacionados con presentaciones y lotes
    const { fecha_vencimiento, ubicacion, id_proveedor_principal, descripcion_presentacion, ...insumoData } = dto;

    // Actualizar el insumo principal
    const { data, error } = await supabase
      .from('insumo')
      .update(insumoData)
      .eq('id_insumo', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar insumo: ${error.message}`);

    // Actualizar presentación principal si se proporcionaron datos
    if (id_proveedor_principal || descripcion_presentacion) {
      const presentacionUpdate: Partial<CreatePresentacionDTO> = {};
      if (id_proveedor_principal) presentacionUpdate.id_proveedor = id_proveedor_principal;
      if (descripcion_presentacion) presentacionUpdate.descripcion_presentacion = descripcion_presentacion;

      if (Object.keys(presentacionUpdate).length > 0) {
        const { error: presentacionError } = await supabase
          .from('insumo_presentacion')
          .update(presentacionUpdate)
          .eq('id_insumo', id)
          .eq('es_principal', true);

        if (presentacionError) {
          console.warn(`Error al actualizar presentación para insumo ${id}: ${presentacionError.message}`);
        }
      }
    }

    // Actualizar ubicación en lotes si se proporcionó
    if (ubicacion) {
      const { error: loteError } = await supabase
        .from('lote_insumo')
        .update({ ubicacion })
        .eq('id_insumo', id);

      if (loteError) {
        console.warn(`Error al actualizar ubicación en lotes para insumo ${id}: ${loteError.message}`);
      }
    }

    // Si se proporcionó fecha_vencimiento, actualizar o crear lote
    if (fecha_vencimiento) {
      // Verificar si ya existe un lote para este insumo
      const { data: existingLote, error: loteCheckError } = await supabase
        .from('lote_insumo')
        .select('id_lote')
        .eq('id_insumo', id)
        .limit(1)
        .single();

      if (loteCheckError && loteCheckError.code !== 'PGRST116') {
        console.warn(`Error al verificar lote existente para insumo ${id}: ${loteCheckError.message}`);
      } else if (existingLote) {
        // Actualizar lote existente
        const { error: loteUpdateError } = await supabase
          .from('lote_insumo')
          .update({ fecha_vencimiento })
          .eq('id_insumo', id);

        if (loteUpdateError) {
          console.warn(`Error al actualizar lote para insumo ${id}: ${loteUpdateError.message}`);
        }
      } else {
        // Crear nuevo lote si no existe
        const { error: loteCreateError } = await supabase
          .from('lote_insumo')
          .insert({
            id_insumo: id,
            fecha_vencimiento: fecha_vencimiento,
            cantidad_inicial: 0,
            cantidad_actual: 0,
            costo_unitario: data.costo_promedio || 0,
            ubicacion: ubicacion || 'Bodega Principal'
          });

        if (loteCreateError) {
          console.warn(`Error al crear lote para insumo ${id}: ${loteCreateError.message}`);
        }
      }
    }

    return data;
  }

  async deleteInsumo(id: number): Promise<void> {
    // Primero eliminar movimientos de inventario relacionados
    const { error: movimientosError } = await supabase
      .from('movimiento_inventario')
      .delete()
      .eq('id_insumo', id);

    if (movimientosError) {
      throw new Error(`Error al eliminar movimientos para insumo ${id}: ${movimientosError.message}`);
    }

    // Eliminar lotes relacionados
    const { error: lotesError } = await supabase
      .from('lote_insumo')
      .delete()
      .eq('id_insumo', id);

    if (lotesError) {
      throw new Error(`Error al eliminar lotes para insumo ${id}: ${lotesError.message}`);
    }

    // Eliminar presentaciones relacionadas
    const { error: presentacionesError } = await supabase
      .from('insumo_presentacion')
      .delete()
      .eq('id_insumo', id);

    if (presentacionesError) {
      throw new Error(`Error al eliminar presentaciones para insumo ${id}: ${presentacionesError.message}`);
    }

    // Finalmente eliminar el insumo principal
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
        lote_insumo:lote_insumo(cantidad_actual, ubicacion),
        insumo_presentacion(id_proveedor, descripcion_presentacion, es_principal, activo)
      `)
      .order('nombre_insumo', { ascending: true });

    if (error) {
      console.error('Error en consulta:', error);
      throw new Error(`Error al obtener catálogo de insumos: ${error.message}`);
    }

    // Mapeo igual que dashboard: incluye insumos sin lotes/categoría
    const result = (data || []).map((item: CatalogoQueryResult) => {
      // Calcular stock total desde lotes (si no hay, 0)
      const lotes = Array.isArray(item.lote_insumo) ? item.lote_insumo : [];
      const stock_actual = lotes.length ? lotes.reduce((sum, lote) => sum + (lote.cantidad_actual || 0), 0) : 0;

      // Calcular ubicación: tomar ubicaciones únicas de los lotes
      const ubicaciones = lotes
        .map(lote => lote.ubicacion)
        .filter(ubicacion => ubicacion && ubicacion.trim() !== '');
      const ubicacion = ubicaciones.length > 0 ? [...new Set(ubicaciones)].join(', ') : undefined;

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

      // Obtener proveedor principal SIEMPRE de las presentaciones activas
      let id_proveedor_principal = undefined;
      if (Array.isArray(item.insumo_presentacion) && item.insumo_presentacion.length > 0) {
        // Buscar la presentación principal (es_principal = true)
        let presentacionPrincipal = item.insumo_presentacion.find(p => p.es_principal && p.activo);
        
        // Si no hay presentación principal, usar la primera activa
        if (!presentacionPrincipal) {
          presentacionPrincipal = item.insumo_presentacion.find(p => p.activo);
        }
        
        if (presentacionPrincipal) {
          id_proveedor_principal = presentacionPrincipal.id_proveedor;
        }
      }
      
      // Si no hay presentaciones, usar el campo del insumo como fallback
      if (!id_proveedor_principal) {
        id_proveedor_principal = item.id_proveedor_principal;
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
        id_proveedor_principal,
        categoria: categoriaObj,
        ubicacion,
      };
    });
    return result;
  }

  // ================== PRESENTACIONES ==================

  async getPresentacionesByInsumo(idInsumo: number): Promise<PresentacionCompleta[]> {
    console.log(`[BACKEND] getPresentacionesByInsumo service called with idInsumo: ${idInsumo}`);

    // Primero obtenemos el insumo para incluir su información
    const { data: insumoData, error: insumoError } = await supabase
      .from('insumo')
      .select(`
        id_insumo,
        nombre_insumo,
        unidad_base,
        costo_promedio,
        stock_minimo,
        stock_maximo,
        activo
      `)
      .eq('id_insumo', idInsumo)
      .single();

    if (insumoError) {
      console.error(`[BACKEND] Error al obtener insumo ${idInsumo}:`, insumoError);
      // Si el insumo no existe, devolver array vacío en lugar de error
      if (insumoError.code === 'PGRST116') {
        console.log(`[BACKEND] Insumo ${idInsumo} no encontrado, retornando array vacío`);
        return [];
      }
      throw new Error(`Error al obtener insumo: ${insumoError.message}`);
    }

    if (!insumoData.activo) {
      console.log(`[BACKEND] Insumo ${idInsumo} inactivo, retornando array vacío`);
      return [];
    }

    console.log(`[BACKEND] Insumo encontrado:`, insumoData.nombre_insumo);

    // Obtenemos las presentaciones activas
    const { data: presentacionesData, error: presentacionesError } = await supabase
      .from('insumo_presentacion')
      .select(`
        id_presentacion,
        id_insumo,
        id_proveedor,
        descripcion_presentacion,
        unidad_compra,
        unidades_por_presentacion,
        costo_compra_unitario,
        es_principal,
        activo
      `)
      .eq('id_insumo', idInsumo)
      .eq('activo', true)
      .order('es_principal', { ascending: false });

    if (presentacionesError) {
      throw new Error(`Error al obtener presentaciones del insumo: ${presentacionesError.message}`);
    }

    // Obtenemos los lotes activos para calcular stock disponible
    const { data: lotesData, error: lotesError } = await supabase
      .from('lote_insumo')
      .select(`
        id_lote,
        id_insumo,
        cantidad_inicial,
        cantidad_actual,
        costo_unitario,
        fecha_vencimiento,
        ubicacion
      `)
      .eq('id_insumo', idInsumo)
      .gt('cantidad_actual', 0)
      .order('fecha_vencimiento', { ascending: true });

    if (lotesError) {
      console.warn(`Error al obtener lotes del insumo: ${lotesError.message}`);
    }

    // Calculamos el stock total disponible
    const stockTotal = lotesData ? lotesData.reduce((sum, lote) => sum + (lote.cantidad_actual || 0), 0) : 0;

    // Combinamos toda la información
    const result = await Promise.all((presentacionesData || []).map(async (presentacion) => {
      // Obtener información del proveedor si existe
      let proveedorInfo = null;
      if (presentacion.id_proveedor) {
        const { data: proveedorData } = await supabase
          .from('proveedor')
          .select('id_proveedor, nombre_empresa')
          .eq('id_proveedor', presentacion.id_proveedor)
          .single();

        if (proveedorData) {
          proveedorInfo = {
            id_proveedor: proveedorData.id_proveedor,
            nombre_proveedor: proveedorData.nombre_empresa
          };
        }
      }

      return {
        // Información del insumo
        insumo: {
          id_insumo: insumoData.id_insumo,
          nombre_insumo: insumoData.nombre_insumo,
          unidad_base: insumoData.unidad_base,
          costo_promedio: insumoData.costo_promedio,
          stock_minimo: insumoData.stock_minimo,
          stock_maximo: insumoData.stock_maximo,
          stock_actual: stockTotal,
          activo: insumoData.activo
        },
        // Información de la presentación
        presentacion: {
          id_presentacion: presentacion.id_presentacion,
          descripcion_presentacion: presentacion.descripcion_presentacion,
          unidad_compra: presentacion.unidad_compra,
          unidades_por_presentacion: presentacion.unidades_por_presentacion,
          costo_compra_unitario: presentacion.costo_compra_unitario,
          es_principal: presentacion.es_principal,
          activo: presentacion.activo
        },
        // Información del proveedor
        proveedor: proveedorInfo,
        // Información de lotes disponibles
        lotes_disponibles: lotesData || []
      };
    }));

    return result;
  }

  async updatePresentacion(idPresentacion: number, updates: { descripcion_presentacion?: string; unidades_por_presentacion?: number; unidad_compra?: string }) {
    const { data, error } = await supabase
      .from('insumo_presentacion')
      .update({
        ...(updates.descripcion_presentacion !== undefined && { descripcion_presentacion: updates.descripcion_presentacion }),
        ...(updates.unidades_por_presentacion !== undefined && { unidades_por_presentacion: updates.unidades_por_presentacion }),
        ...(updates.unidad_compra !== undefined && { unidad_compra: updates.unidad_compra }),
      })
      .eq('id_presentacion', idPresentacion)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar presentación: ${error.message}`);
    return data;
  }

  async updateLote(idLote: number, updates: { costo_unitario?: number }) {
    const { data, error } = await supabase
      .from('lote_insumo')
      .update({
        ...(updates.costo_unitario !== undefined && { costo_unitario: updates.costo_unitario }),
      })
      .eq('id_lote', idLote)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar lote: ${error.message}`);
    return data;
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
    // Obtener datos básicos del insumo SIN JOIN con proveedor para evitar conflictos
    const { data: insumoData, error: insumoError } = await supabase
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
        id_proveedor_principal,
        categoria_insumo:categoria_insumo(nombre, tipo_categoria)
      `)
      .eq('id_insumo', idInsumo)
      .single();

    if (insumoError) throw new Error(`Error al obtener detalles del insumo: ${insumoError.message}`);

    // Obtener proveedor principal por separado si existe
    let proveedorPrincipal = null;
    if (insumoData.id_proveedor_principal) {
      const { data: provData } = await supabase
        .from('proveedor')
        .select('id_proveedor, nombre_empresa')
        .eq('id_proveedor', insumoData.id_proveedor_principal)
        .single();
      if (provData) {
        proveedorPrincipal = {
          id_proveedor: provData.id_proveedor,
          nombre: provData.nombre_empresa,
          nombre_empresa: provData.nombre_empresa
        };
      }
    }

    // Obtener presentaciones activas (no solo principal)
    let presentacionesData: unknown[] = [];
    try {
      const { data } = await supabase
        .from('insumo_presentacion')
        .select(`
          id_presentacion,
          id_proveedor,
          descripcion_presentacion,
          es_principal,
          activo,
          costo_compra_unitario,
          unidades_por_presentacion
        `)
        .eq('id_insumo', idInsumo)
        .eq('activo', true)
        .order('es_principal', { ascending: false }); // Principales primero
      presentacionesData = data || [];
    } catch (error) {
      console.warn(`Error al obtener presentaciones del insumo ${idInsumo}:`, error);
    }

    // Obtener lotes del insumo
    let lotesData: unknown[] = [];
    try {
      const { data } = await supabase
        .from('lote_insumo')
        .select(`
          id_lote,
          cantidad_inicial,
          cantidad_actual,
          costo_unitario,
          ubicacion,
          fecha_vencimiento
        `)
        .eq('id_insumo', idInsumo);
      lotesData = data || [];
    } catch (error) {
      console.warn(`Error al obtener lotes del insumo ${idInsumo}:`, error);
    }

    // Combinar los datos - mantener estructura compatible con frontend
    const result = {
      ...insumoData,
      // Agregar proveedor principal directamente al objeto insumo
      ...(proveedorPrincipal && { proveedor_principal: proveedorPrincipal }),
      insumo_presentacion: presentacionesData,
      lote_insumo: lotesData
    };

    // Si tenemos presentaciones con proveedor, obtener datos del proveedor para cada una
    if (result.insumo_presentacion && result.insumo_presentacion.length > 0) {
      for (const presentacion of result.insumo_presentacion) {
        if ((presentacion as Record<string, unknown>).id_proveedor) {
          const { data: proveedorData, error: proveedorError } = await supabase
            .from('proveedor')
            .select('id_proveedor, nombre_empresa')
            .eq('id_proveedor', (presentacion as Record<string, unknown>).id_proveedor)
            .single();

          if (!proveedorError && proveedorData) {
            (presentacion as Record<string, unknown>).proveedor = {
              id_proveedor: proveedorData.id_proveedor,
              nombre: proveedorData.nombre_empresa,
              nombre_empresa: proveedorData.nombre_empresa
            };
          }
        }
      }
    }

    return result;
  }

  // ================== RECEPCIONES DE MERCADERÍA ==================

  async getRecepcionesMercaderia() {
    // Primero obtener las recepciones básicas
    const { data: recepciones, error: recepcionesError } = await supabase
      .from('recepcion_mercaderia')
      .select(`
        id_recepcion,
        id_orden,
        fecha_recepcion,
        numero_factura,
        id_perfil
      `)
      .order('fecha_recepcion', { ascending: false });

    if (recepcionesError) {
      throw new Error(`Error al obtener recepciones de mercadería: ${recepcionesError.message}`);
    }

    // Para cada recepción, obtener los datos relacionados por separado
    const result = await Promise.all((recepciones || []).map(async (recepcion) => {
      // Obtener perfil de usuario
      const { data: perfil } = await supabase
        .from('perfil_usuario')
        .select('primer_nombre, primer_apellido')
        .eq('id_perfil', recepcion.id_perfil)
        .single();

      // Obtener orden de compra si existe
      let ordenCompra = null;
      if (recepcion.id_orden) {
        // Obtener orden de compra
        const { data: orden, error: ordenError } = await supabase
          .from('orden_compra')
          .select('id_orden, fecha_orden, estado, id_proveedor')
          .eq('id_orden', recepcion.id_orden)
          .single();

        if (ordenError) {
          console.error('Error obteniendo orden de compra:', ordenError);
          ordenCompra = null;
        } else {
          // Obtener proveedor por separado si existe
          let proveedor = null;
          if (orden.id_proveedor) {
            const { data: prov } = await supabase
              .from('proveedor')
              .select('id_proveedor, nombre_empresa')
              .eq('id_proveedor', orden.id_proveedor)
              .single();
            proveedor = prov;
          }

          ordenCompra = {
            ...orden,
            numero_orden: `OC-${orden.id_orden}`,
            proveedor: proveedor ? {
              id_proveedor: proveedor.id_proveedor,
              nombre: proveedor.nombre_empresa,
              nombre_empresa: proveedor.nombre_empresa
            } : null
          };
        }

        // Obtener detalles de recepción
        const { data: detalles } = await supabase
          .from('detalle_recepcion_mercaderia')
          .select(`
            id_detalle,
            id_recepcion,
            id_detalle_orden,
            cantidad_recibida,
            cantidad_aceptada,
            id_lote,
            id_presentacion,
            insumo_presentacion!detalle_recepcion_mercaderia_id_presentacion_fkey (
              id_insumo,
              insumo!insumo_presentacion_id_insumo_fkey (
                nombre_insumo
              )
            )
          `)
          .eq('id_recepcion', recepcion.id_recepcion);

        return {
          ...recepcion,
          numero_orden: recepcion.id_orden ? `OC-${recepcion.id_orden}` : 'Sin orden',
          perfil_usuario: perfil || null,
          orden_compra: ordenCompra,
          detalle_recepcion_mercaderia: detalles || [],
          _count: {
            detalle_recepcion_mercaderia: detalles?.length || 0
          }
        };
      } else {
        // Si no hay orden, obtener detalles de recepción directamente
        const { data: detalles } = await supabase
          .from('detalle_recepcion_mercaderia')
          .select(`
            id_detalle,
            id_recepcion,
            id_detalle_orden,
            cantidad_recibida,
            cantidad_aceptada,
            id_lote,
            id_presentacion,
            insumo_presentacion!detalle_recepcion_mercaderia_id_presentacion_fkey (
              id_insumo,
              insumo!insumo_presentacion_id_insumo_fkey (
                nombre_insumo
              )
            )
          `)
          .eq('id_recepcion', recepcion.id_recepcion);

        return {
          ...recepcion,
          numero_orden: 'Sin orden',
          perfil_usuario: perfil || null,
          orden_compra: null,
          detalle_recepcion_mercaderia: detalles || [],
          _count: {
            detalle_recepcion_mercaderia: detalles?.length || 0
          }
        };
      }
    }));

    return result;
  }

  async createRecepcionMercaderia(recepcionData: {
    id_orden: number;
    fecha_recepcion: string;
    id_perfil: number;
    numero_factura?: string;
  }): Promise<{ id_recepcion: number }> {
    const { data, error } = await supabase
      .from('recepcion_mercaderia')
      .insert({
        id_orden: recepcionData.id_orden,
        fecha_recepcion: recepcionData.fecha_recepcion,
        id_perfil: recepcionData.id_perfil,
        numero_factura: recepcionData.numero_factura,
      })
      .select('id_recepcion')
      .single();

    if (error) throw new Error(`Error creando recepción: ${error.message}`);
    return data;
  }

  async createDetalleRecepcionMercaderia(detalleData: {
    id_recepcion: number;
    id_detalle_orden: number;
    cantidad_recibida: number;
    cantidad_aceptada: number;
    id_presentacion: number;
  }): Promise<{ id_detalle: number }> {
    const { data, error } = await supabase
      .from('detalle_recepcion_mercaderia')
      .insert({
        id_recepcion: detalleData.id_recepcion,
        id_detalle_orden: detalleData.id_detalle_orden,
        cantidad_recibida: detalleData.cantidad_recibida,
        cantidad_aceptada: detalleData.cantidad_aceptada,
        id_presentacion: detalleData.id_presentacion,
      })
      .select('id_detalle')
      .single();

    if (error) throw new Error(`Error creando detalle recepción: ${error.message}`);
    return data;
  }
}

export const inventarioService = new InventarioService();
