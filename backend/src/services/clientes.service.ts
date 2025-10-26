import { supabase } from '../config/database';
import { Cliente, CreateClienteDTO, UpdateClienteDTO, CanjearPuntosDTO } from '../types/ventas.types';

// ================================================================
// 👥 SERVICIO DE CLIENTES
// ================================================================

export class ClientesService {
  // ================== CLIENTES ==================

  async getClientes(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .order('nombre');

    if (error) throw new Error(`Error al obtener clientes: ${error.message}`);
    return data || [];
  }

  async getClienteById(id: number): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('id_cliente', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener cliente: ${error.message}`);
    }
    return data;
  }

  async buscarClientePorTelefono(telefono: string): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('telefono', telefono)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al buscar cliente: ${error.message}`);
    }
    return data;
  }

  async createCliente(dto: CreateClienteDTO): Promise<Cliente> {
    console.log('📝 Datos del cliente a crear:', dto);

    // Validar que el teléfono sea único si se proporciona
    if (dto.telefono && dto.telefono.trim()) {
      const clienteExistente = await this.buscarClientePorTelefono(dto.telefono.trim());
      if (clienteExistente) {
        throw new Error(`Ya existe un cliente con el teléfono ${dto.telefono}`);
      }
    }

    const { data, error } = await supabase
      .from('cliente')
      .insert(dto)
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase:', error);
      throw new Error(`Error al crear cliente: ${error.message}`);
    }

    console.log('✅ Cliente creado exitosamente:', data);
    return data;
  }

  async updateCliente(id: number, dto: UpdateClienteDTO): Promise<Cliente> {
    const { data, error } = await supabase
      .from('cliente')
      .update(dto)
      .eq('id_cliente', id)
      .select()
      .single();

    if (error) throw new Error(`Error al actualizar cliente: ${error.message}`);
    return data;
  }

  async deleteCliente(id: number): Promise<void> {
    const { error } = await supabase
      .from('cliente')
      .delete()
      .eq('id_cliente', id);

    if (error) throw new Error(`Error al eliminar cliente: ${error.message}`);
  }

  // ================== PUNTOS ==================

  /**
   * Consultar puntos de cliente usando función PL/pgSQL fn_consultar_puntos
   */
  async consultarPuntos(idCliente: number): Promise<number> {
    const { data, error } = await supabase.rpc('fn_consultar_puntos', {
      p_id_cliente: idCliente,
    });

    if (error) throw new Error(`Error al consultar puntos: ${error.message}`);
    return data || 0;
  }

  /**
   * Canjear puntos usando función PL/pgSQL fn_canjear_puntos
   */
  async canjearPuntos(dto: CanjearPuntosDTO): Promise<void> {
    const { error } = await supabase.rpc('fn_canjear_puntos', {
      p_id_cliente: dto.id_cliente,
      p_puntos: dto.puntos_a_canjear,
      p_descripcion: dto.descripcion || 'Canje de puntos',
    });

    if (error) throw new Error(`Error al canjear puntos: ${error.message}`);
  }

  /**
   * Obtener historial de puntos
   */
  async getHistorialPuntos(idCliente: number): Promise<unknown[]> {
    const { data, error } = await supabase
      .from('historial_puntos')
      .select('*')
      .eq('id_cliente', idCliente)
      .order('fecha_movimiento', { ascending: false });

    if (error) throw new Error(`Error al obtener historial de puntos: ${error.message}`);
    return data || [];
  }
}

export const clientesService = new ClientesService();
