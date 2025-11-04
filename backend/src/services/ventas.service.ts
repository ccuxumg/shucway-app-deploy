import { supabase } from '../config/database';
import {
  Venta,
  DetalleVenta,
  CreateVentaDTO,
  VentaCompleta,
  ProductoPopular,
} from '../types/ventas.types';

// ================================================================
// 💰 SERVICIO DE VENTAS
// ================================================================

export class VentasService {
  // ================== VENTAS ==================

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  async getVentas(
    estado?: string,
    fechaInicio?: string,
    fechaFin?: string,
    idCajero?: number
  ): Promise<Venta[]> {
    try {
      let query = supabase
        .from('venta')
        .select('*')
        .order('fecha_venta', { ascending: false });

      if (estado) {
        query = query.eq('estado', estado);
      }

      if (fechaInicio) {
        query = query.gte('fecha_venta', fechaInicio);
      }

      if (fechaFin) {
        query = query.lte('fecha_venta', fechaFin);
      }

      if (idCajero) {
        query = query.eq('id_cajero', idCajero);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error obteniendo ventas:', error);
        throw new Error(`Error al obtener ventas: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getVentas:', error);
      throw error;
    }
  }

  /**
   * Obtener venta por ID
   */
  async getVentaById(id: number): Promise<Venta | null> {
    const { data, error } = await supabase
      .from('venta')
      .select('*')
      .eq('id_venta', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener venta: ${error.message}`);
    }
    return data;
  }

  /**
   * Obtener venta completa con detalles, cliente y cajero
   */
  async getVentaCompleta(id: number): Promise<VentaCompleta | null> {
    // Obtener venta
    const venta = await this.getVentaById(id);
    if (!venta) return null;

    // Obtener detalles
    const { data: detalles, error: detallesError } = await supabase
      .from('detalle_venta')
      .select('*')
      .eq('id_venta', id);

    if (detallesError) {
      throw new Error(`Error al obtener detalles de venta: ${detallesError.message}`);
    }

    // Obtener cliente si existe
    let cliente = null;
    if (venta.id_cliente) {
      const { data: clienteData, error: clienteError } = await supabase
        .from('cliente')
        .select('*')
        .eq('id_cliente', venta.id_cliente)
        .single();

      if (clienteError && clienteError.code !== 'PGRST116') {
        throw new Error(`Error al obtener cliente: ${clienteError.message}`);
      }
      cliente = clienteData;
    }

    // Obtener cajero si existe
    let cajero = null;
    if (venta.id_cajero) {
      const { data: cajeroData, error: cajeroError } = await supabase
        .from('perfil_usuario')
        .select('id_perfil, nombre')
        .eq('id_perfil', venta.id_cajero)
        .single();

      if (cajeroError && cajeroError.code !== 'PGRST116') {
        throw new Error(`Error al obtener cajero: ${cajeroError.message}`);
      }
      cajero = cajeroData;
    }

    return {
      ...venta,
      detalles: detalles || [],
      cliente: cliente || undefined,
      cajero: cajero || undefined,
    };
  }

  /**
   * Crear venta con detalles
   * Esta función crea la venta y sus detalles, luego llama a las funciones PL/pgSQL:
   * - fn_descontar_inventario_venta: Descuenta inventario operativo
   * - fn_acumular_puntos_venta: Se ejecuta automáticamente por trigger cuando estado='confirmada'
   */
  async createVenta(dto: CreateVentaDTO, idCajero: number): Promise<VentaCompleta> {
    // 1. Crear venta principal (estado 'pendiente' por defecto)
    const { data: venta, error: ventaError } = await supabase
      .from('venta')
      .insert({
        id_cliente: dto.id_cliente,
        tipo_pago: dto.tipo_pago,
        estado: 'pendiente', // Siempre empieza en pendiente
        id_cajero: idCajero,
        notas: dto.notas,
      })
      .select()
      .single();

    if (ventaError) throw new Error(`Error al crear venta: ${ventaError.message}`);

    // 2. Crear detalles de venta (triggers calculan precio_unitario, costo_unitario y totales)
    const detallesConVenta = dto.detalles.map((detalle) => ({
      id_venta: venta.id_venta,
      id_producto: detalle.id_producto,
      id_variante: detalle.id_variante,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      costo_unitario: 0, // Se calcula automáticamente por trigger fn_calcular_precio_costo_venta
      descuento: detalle.descuento || 0,
      es_canje_puntos: detalle.es_canje_puntos || false,
      puntos_canjeados: detalle.puntos_canjeados || 0,
    }));

    const { error: detallesError } = await supabase
      .from('detalle_venta')
      .insert(detallesConVenta);

    if (detallesError) {
      // Si falla la inserción de detalles, eliminar la venta
      await supabase.from('venta').delete().eq('id_venta', venta.id_venta);
      throw new Error(`Error al crear detalles de venta: ${detallesError.message}`);
    }

    // 3. Confirmar venta (cambia estado a 'confirmada')
    // Esto dispara:
    // - fn_descontar_inventario_venta (manual)
    // - fn_acumular_puntos_venta (trigger automático)
    const { error: confirmarError } = await supabase
      .from('venta')
      .update({ estado: 'confirmada' })
      .eq('id_venta', venta.id_venta);

    if (confirmarError) {
      throw new Error(`Error al confirmar venta: ${confirmarError.message}`);
    }

    // 4. Descontar inventario usando función PL/pgSQL
    const { error: inventarioError } = await supabase.rpc('fn_descontar_inventario_venta', {
      p_id_venta: venta.id_venta,
      p_id_perfil: idCajero,
    });

    if (inventarioError) {
      console.error(`Error al descontar inventario: ${inventarioError.message}`);
      // No lanzar error, solo log (la venta ya está creada)
    }

    // 5. Manejar canje de puntos si existe
    if (dto.puntos_usados && dto.puntos_usados > 0 && dto.id_cliente) {
      const { error: canjeError } = await supabase.rpc('fn_canjear_puntos', {
        p_id_cliente: dto.id_cliente,
        p_id_venta: venta.id_venta,
        p_id_cajero: idCajero,
      });

      if (canjeError) {
        console.error(`Error al canjear puntos: ${canjeError.message}`);
        // No lanzar error, solo log
      }
    }

    // 6. Retornar venta completa
    const ventaCompleta = await this.getVentaCompleta(venta.id_venta);
    if (!ventaCompleta) {
      throw new Error('Error al obtener venta creada');
    }

    return ventaCompleta;
  }

  /**
   * Actualizar estado de venta
   */
  async updateEstadoVenta(
    id: number,
    estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
  ): Promise<Venta> {
    const { data, error } = await supabase
      .from('venta')
      .update({ estado })
      .eq('id_venta', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar estado de venta: ${error.message}`);
    return data;
  }

  /**
   * Cancelar venta
   */
  async cancelarVenta(id: number): Promise<Venta> {
    // Verificar que la venta existe y no está cancelada
    const venta = await this.getVentaById(id);
    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    if (venta.estado === 'cancelada') {
      throw new Error('La venta ya está cancelada');
    }

    // Cambiar estado a cancelada
    return this.updateEstadoVenta(id, 'cancelada');
  }

  /**
   * Eliminar venta (solo si está en estado 'pendiente')
   */
  async deleteVenta(id: number): Promise<void> {
    const venta = await this.getVentaById(id);
    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    if (venta.estado !== 'pendiente') {
      throw new Error('Solo se pueden eliminar ventas en estado pendiente');
    }

    const { error } = await supabase.from('venta').delete().eq('id_venta', id);

    if (error) throw new Error(`Error al eliminar venta: ${error.message}`);
  }

  // ================== DETALLES DE VENTA ==================

  /**
   * Obtener detalles de una venta
   */
  async getDetallesByVenta(idVenta: number): Promise<DetalleVenta[]> {
    const { data, error } = await supabase
      .from('detalle_venta')
      .select('*')
      .eq('id_venta', idVenta);

    if (error) throw new Error(`Error al obtener detalles de venta: ${error.message}`);
    return data || [];
  }

  // ================== REPORTES BÁSICOS ==================

  /**
   * Obtener ventas del día actual
   */
  async getVentasDelDia(idCajero?: number): Promise<Venta[]> {
    const hoy = new Date().toISOString().split('T')[0];
    return this.getVentas('confirmada', hoy, undefined, idCajero);
  }

  /**
   * Obtener total de ventas en un rango de fechas
   */
  async getTotalVentas(fechaInicio: string, fechaFin: string): Promise<number> {
    const { data, error } = await supabase
      .from('venta')
      .select('total_venta')
      .eq('estado', 'confirmada')
      .gte('fecha_venta', fechaInicio)
      .lte('fecha_venta', fechaFin);

    if (error) throw new Error(`Error al obtener total de ventas: ${error.message}`);

    return (data || []).reduce((sum, venta) => sum + (venta.total_venta || 0), 0);
  }

  /**
   * Obtener ventas por cajero en un rango de fechas
   */
  async getVentasPorCajero(
    idCajero: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<Venta[]> {
    return this.getVentas('confirmada', fechaInicio, fechaFin, idCajero);
  }

  /**
   * Obtener productos más populares (más vendidos)
   */
  async getProductosPopulares(limit: number = 5): Promise<ProductoPopular[]> {
    try {
      // Consulta simplificada que funciona con datos actuales
      // Cuando no hay ventas, devolver productos disponibles
      const { data, error } = await supabase
        .from('producto')
        .select(`
          id_producto,
          nombre_producto,
          precio_venta,
          imagen_url
        `)
        .eq('estado', 'activo')
        .order('id_producto', { ascending: false }) // Más recientes primero
        .limit(limit);

      if (error) {
        console.error('Error obteniendo productos:', error);
        throw new Error(`Error al obtener productos: ${error.message}`);
      }

      // Por ahora devolver productos sin estadísticas de venta
      // Cuando haya ventas, se puede mejorar esta lógica
      return (data || []).map((producto) => ({
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        total_vendido: 0, // TODO: calcular cuando haya ventas
        veces_vendido: 0, // TODO: calcular cuando haya ventas
        categoria: 'Producto', // Categoría por defecto
        imagen_url: producto.imagen_url,
      }));

    } catch (error) {
      console.error('Error obteniendo productos populares:', error);
      throw error;
    }
  }
}

export const ventasService = new VentasService();
