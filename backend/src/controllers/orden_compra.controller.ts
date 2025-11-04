import { Request, Response } from 'express';
import supabase from '../config/database';

export const getOrdenesCompra = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orden_compra')
      .select(`
        *,
        proveedor:proveedor(nombre_empresa),
        perfil_usuario:creado_por(primer_nombre, primer_apellido)
      `)
      .order('fecha_orden', { ascending: false });

    if (error) {
      console.error('Error al consultar ordenes de compra:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getOrdenCompraById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
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

    if (error) {
      console.error('Error al consultar orden de compra:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Orden de compra no encontrada' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const updateOrdenCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data, error } = await supabase
      .from('orden_compra')
      .update(updateData)
      .eq('id_orden', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar orden de compra:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const deleteOrdenCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('orden_compra')
      .delete()
      .eq('id_orden', id);

    if (error) {
      console.error('Error al eliminar orden de compra:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    return res.status(200).json({ message: 'Orden de compra eliminada correctamente' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};