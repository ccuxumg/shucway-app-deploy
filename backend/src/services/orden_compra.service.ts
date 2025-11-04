import { supabase } from '../config/database';
import { OrdenCompra, DetalleOrdenCompra } from '../types/orden_compra.types';

export async function createOrdenCompra(data: OrdenCompra) {
  const { data: orden, error } = await supabase
    .from('orden_compra')
    .insert([data])
    .select();
  if (error) throw error;
  return orden?.[0];
}

export async function getOrdenCompraById(id: number) {
  const { data, error } = await supabase
    .from('orden_compra')
    .select(`
      *,
      proveedor:proveedor(*),
      detalle_orden_compra(
        *,
        insumo:insumo(nombre_insumo),
        insumo_presentacion:insumo_presentacion(descripcion_presentacion)
      )
    `)
    .eq('id_orden', id)
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrdenCompra(id: number, data: Partial<OrdenCompra>) {
  const { data: orden, error } = await supabase
    .from('orden_compra')
    .update(data)
    .eq('id_orden', id)
    .select()
    .single();
  if (error) throw error;
  return orden;
}

export async function deleteOrdenCompra(id: number) {
  const { error } = await supabase
    .from('orden_compra')
    .delete()
    .eq('id_orden', id);
  if (error) throw error;
  return true;
}

export async function createDetalleOrdenCompra(data: DetalleOrdenCompra) {
  const { data: detalle, error } = await supabase
    .from('detalle_orden_compra')
    .insert([data])
    .select();
  if (error) throw error;
  return detalle?.[0];
}
