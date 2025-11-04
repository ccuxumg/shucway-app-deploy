
import { Request, Response } from 'express';
import { createOrdenCompra, createDetalleOrdenCompra } from '../services/orden_compra.service';
import { OrdenCompra, DetalleOrdenCompra } from '../types/orden_compra.types';

export const crearOrdenCompra = async (req: Request, res: Response) => {
  try {
    const orden = await createOrdenCompra(req.body as OrdenCompra);
    res.status(201).json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear orden de compra', details: error });
  }
};

export const crearDetalleOrdenCompra = async (req: Request, res: Response) => {
  try {
    const detalle = await createDetalleOrdenCompra(req.body as DetalleOrdenCompra);
    res.status(201).json(detalle);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear detalle de orden de compra', details: error });
  }
};
