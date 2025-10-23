import { Request, Response } from 'express';
import supabase from '../config/database';

export const getOrdenesCompra = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orden_compra')
      .select('*');

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