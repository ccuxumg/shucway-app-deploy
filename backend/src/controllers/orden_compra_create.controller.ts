
import { Response } from 'express';
import { createOrdenCompra, createDetalleOrdenCompra } from '../services/orden_compra.service';
import { OrdenCompra, DetalleOrdenCompra } from '../types/orden_compra.types';
import { AuthRequest } from '../types/express.types';

export const crearOrdenCompra = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Datos recibidos para crear orden:', req.body);
    console.log('Usuario autenticado:', req.user);
    console.log('ID de perfil del usuario:', req.user?.id_perfil);
    
    // Validar que el usuario esté autenticado
    if (!req.user?.id_perfil) {
      console.error('Usuario no autenticado o sin id_perfil');
      res.status(401).json({
        error: 'Usuario no autenticado'
      });
      return;
    }
    
    // Validar datos requeridos
    const { id_proveedor, fecha_orden } = req.body;
    if (!id_proveedor || !fecha_orden) {
      console.error('Faltan datos requeridos:', { id_proveedor, fecha_orden });
      res.status(400).json({
        error: 'Faltan datos requeridos: id_proveedor y fecha_orden son obligatorios'
      });
      return;
    }
    
    const ordenData: OrdenCompra = {
      ...req.body,
      creado_por: req.user.id_perfil // Agregar el ID del usuario autenticado
    };
    
    console.log('Datos finales para crear orden:', ordenData);
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
