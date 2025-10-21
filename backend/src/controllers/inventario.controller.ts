import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express.types';
import { inventarioService } from '../services/inventario.service';
import {
  CreateInsumoDTO,
  UpdateInsumoDTO,
  CreateLoteDTO,
  CreateMovimientoDTO,
} from '../types/inventario.types';

// ================================================================
// 📦 CONTROLADOR DE INVENTARIO
// ================================================================

export class InventarioController {
  // ================== CATEGORÍAS ==================

  async getCategoriasInsumo(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categorias = await inventarioService.getCategoriasInsumo();
      res.json({
        success: true,
        data: categorias,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoriaInsumoById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const categoria = await inventarioService.getCategoriaInsumoById(id);

      if (!categoria) {
        res.status(404).json({
          success: false,
          message: 'Categoría no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        data: categoria,
      });
    } catch (error) {
      next(error);
    }
  }

  // ================== INSUMOS ==================

  async getInsumos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activos = req.query.activos === 'true' ? true : req.query.activos === 'false' ? false : undefined;
      const insumos = await inventarioService.getInsumos(activos);

      res.json({
        success: true,
        data: insumos,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInsumoById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const insumo = await inventarioService.getInsumoById(id);

      if (!insumo) {
        res.status(404).json({
          success: false,
          message: 'Insumo no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: insumo,
      });
    } catch (error) {
      next(error);
    }
  }

  async createInsumo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto: CreateInsumoDTO = req.body;
      const insumo = await inventarioService.createInsumo(dto);

      res.status(201).json({
        success: true,
        data: insumo,
        message: 'Insumo creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInsumo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateInsumoDTO = req.body;
      const insumo = await inventarioService.updateInsumo(id, dto);

      res.json({
        success: true,
        data: insumo,
        message: 'Insumo actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteInsumo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await inventarioService.deleteInsumo(id);

      res.json({
        success: true,
        message: 'Insumo eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // ================== CATÁLOGO ==================

  async getCatalogoInsumos(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const insumos = await inventarioService.getCatalogoInsumos();
      res.json({
        success: true,
        data: insumos,
      });
    } catch (error) {
      next(error);
    }
  }

  // ================== LOTES ==================

  async getLotesByInsumo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const idInsumo = parseInt(req.params.idInsumo);
      const lotes = await inventarioService.getLotesByInsumo(idInsumo);

      res.json({
        success: true,
        data: lotes,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLoteById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const lote = await inventarioService.getLoteById(id);

      if (!lote) {
        res.status(404).json({
          success: false,
          message: 'Lote no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: lote,
      });
    } catch (error) {
      next(error);
    }
  }

  async createLote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto: CreateLoteDTO = req.body;
      const lote = await inventarioService.createLote(dto);

      res.status(201).json({
        success: true,
        data: lote,
        message: 'Lote creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLote(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      await inventarioService.deleteLote(id);

      res.json({
        success: true,
        message: 'Lote eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // ================== MOVIMIENTOS ==================

  async getMovimientos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const idInsumo = req.query.idInsumo ? parseInt(req.query.idInsumo as string) : undefined;
      const fechaInicio = req.query.fechaInicio as string | undefined;
      const fechaFin = req.query.fechaFin as string | undefined;

      const movimientos = await inventarioService.getMovimientos(idInsumo, fechaInicio, fechaFin);

      res.json({
        success: true,
        data: movimientos,
      });
    } catch (error) {
      next(error);
    }
  }

  async createMovimiento(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto: CreateMovimientoDTO = req.body;
      const movimiento = await inventarioService.createMovimiento(dto);

      res.status(201).json({
        success: true,
        data: movimiento,
        message: 'Movimiento registrado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // ================== STOCK ==================

  async getStockActual(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const idInsumo = req.query.idInsumo ? parseInt(req.query.idInsumo as string) : undefined;
      const stock = await inventarioService.getStockActual(idInsumo);

      res.json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInsumosStockBajo(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const insumos = await inventarioService.getInsumosStockBajo();

      res.json({
        success: true,
        data: insumos,
        count: insumos.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventarioController = new InventarioController();
