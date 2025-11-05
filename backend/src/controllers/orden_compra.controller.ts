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
    
    // Primero: comprobar si existen recepciones (cabeceras) asociadas a la orden
    const { data: recepciones, error: recepcionesError } = await supabase
      .from('recepcion_mercaderia')
      .select('id_recepcion')
      .eq('id_orden', id);

    if (recepcionesError) {
      console.error('Error al verificar recepciones:', recepcionesError);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    if (recepciones && recepciones.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la orden de compra porque tiene recepciones de mercadería asociadas',
        detail: `La orden tiene ${recepciones.length} recepción(es) asociada(s)`
      });
    }

    // Segundo: comprobar si existen detalles de recepción que referencien los detalles de la orden
    const { data: detallesOC, error: detallesOCError } = await supabase
      .from('detalle_orden_compra')
      .select('id_detalle')
      .eq('id_orden', id);

    if (detallesOCError) {
      console.error('Error al consultar detalles de orden:', detallesOCError);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    const detalleIds = (detallesOC || []).map((d: unknown) => {
      const row = d as Record<string, unknown>;
      return Number(row.id_detalle as number | string);
    });
    if (detalleIds.length > 0) {
      const { data: detallesRecepcion, error: detallesRecepcionError } = await supabase
        .from('detalle_recepcion_mercaderia')
        .select('id_detalle')
        .in('id_detalle_orden', detalleIds);

      if (detallesRecepcionError) {
        console.error('Error al verificar referencias en detalle_recepcion_mercaderia:', detallesRecepcionError);
        return res.status(500).json({ message: 'Error interno del servidor' });
      }

      if (detallesRecepcion && detallesRecepcion.length > 0) {
        return res.status(400).json({
          message: 'No se puede eliminar la orden de compra porque existen detalles de recepción que referencian sus líneas',
          detail: `Hay ${detallesRecepcion.length} detalle(s) de recepción que impiden la eliminación`
        });
      }
    }

    // Si pasaron las verificaciones, eliminar primero los detalles de la orden y luego la orden
    const { error: delDetallesError } = await supabase
      .from('detalle_orden_compra')
      .delete()
      .eq('id_orden', id);

    if (delDetallesError) {
      console.error('Error al eliminar detalles de orden de compra:', delDetallesError);
      return res.status(500).json({ message: 'Error interno eliminando detalles' });
    }

    const { error: delOrdenError } = await supabase
      .from('orden_compra')
      .delete()
      .eq('id_orden', id);

    if (delOrdenError) {
      console.error('Error al eliminar orden de compra:', delOrdenError);
      return res.status(500).json({ message: 'Error interno al eliminar la orden' });
    }

    return res.status(200).json({ message: 'Orden de compra eliminada correctamente' });
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const getDetallesOrdenCompra = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('detalle_orden_compra')
      .select(`
        *,
        insumo:insumo(nombre_insumo),
        insumo_presentacion:insumo_presentacion(descripcion_presentacion)
      `)
      .eq('id_orden', id)
      .order('id_detalle', { ascending: true });

    if (error) {
      console.error('Error al consultar detalles de orden de compra:', error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error inesperado:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};