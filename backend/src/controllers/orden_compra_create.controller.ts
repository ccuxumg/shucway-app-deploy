
import { Response } from 'express';
import { createOrdenCompra, createDetalleOrdenCompra } from '../services/orden_compra.service';
import { OrdenCompra, DetalleOrdenCompra } from '../types/orden_compra.types';
import { AuthRequest } from '../types/express.types';

export const crearOrdenCompra = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Datos recibidos para crear orden:', req.body);
    const ordenData: OrdenCompra = {
      ...req.body,
      creado_por: req.user?.id_perfil // Agregar el ID del usuario autenticado
    };
    const orden = await createOrdenCompra(ordenData);
    console.log('Orden creada:', orden);
    res.status(201).json(orden);
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    res.status(500).json({
      error: 'Error al crear orden de compra',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const crearDetalleOrdenCompra = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Datos recibidos para crear detalle:', req.body);
    const detalleData: DetalleOrdenCompra = req.body;
    const detalle = await createDetalleOrdenCompra(detalleData);
    console.log('Detalle creado:', detalle);
    res.status(201).json(detalle);
  } catch (error) {
    console.error('Error al crear detalle de orden de compra:', error);
    res.status(500).json({
      error: 'Error al crear detalle de orden de compra',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};
