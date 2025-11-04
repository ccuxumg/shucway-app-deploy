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

export async function createDetalleOrdenCompra(data: DetalleOrdenCompra) {
  const { data: detalle, error } = await supabase
    .from('detalle_orden_compra')
    .insert([data])
    .select();
  if (error) throw error;
  return detalle?.[0];
}
