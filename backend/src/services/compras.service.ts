import { supabase } from '../config/database';
import {
  Proveedor,
  CreateProveedorDTO,
  UpdateProveedorDTO,
} from '../types/compras.types';

// ================================================================
// 🛒 SERVICIO DE COMPRAS (PROVEEDORES)
// ================================================================

export class ComprasService {
  // ================== PROVEEDORES ==================

  async getProveedores(): Promise<Proveedor[]> {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .order('nombre_empresa', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getProveedorById(id: number): Promise<Proveedor | null> {
    const { data, error } = await supabase
      .from('proveedor')
      .select('*')
      .eq('id_proveedor', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data;
  }

  async createProveedor(dto: CreateProveedorDTO): Promise<Proveedor> {
    const { data, error } = await supabase
      .from('proveedor')
      .insert({
        nombre_empresa: dto.nombre_empresa,
        nombre_contacto: dto.nombre_contacto,
        telefono: dto.telefono,
        correo: dto.correo,
        direccion: dto.direccion,
        metodo_entrega: dto.metodo_entrega,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProveedor(id: number, dto: UpdateProveedorDTO): Promise<Proveedor | null> {
    const { data, error } = await supabase
      .from('proveedor')
      .update({
        nombre_empresa: dto.nombre_empresa,
        nombre_contacto: dto.nombre_contacto,
        telefono: dto.telefono,
        correo: dto.correo,
        direccion: dto.direccion,
        estado: dto.estado,
        metodo_entrega: dto.metodo_entrega,
      })
      .eq('id_proveedor', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }
    return data;
  }

  async deleteProveedor(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('proveedor')
      .delete()
      .eq('id_proveedor', id);

    if (error) throw error;
    return true;
  }
}

export const comprasService = new ComprasService();