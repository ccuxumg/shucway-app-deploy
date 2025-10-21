import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  async getStats(_req: Request, res: Response) {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
    }
  },

  async getVentasSemana(_req: Request, res: Response) {
    try {
      const ventas = await dashboardService.getVentasSemana();
      res.json(ventas);
    } catch (error) {
      console.error('Error al obtener ventas de la semana:', error);
      res.status(500).json({ message: 'Error al obtener ventas de la semana' });
    }
  },

  async getAlertasRecientes(_req: Request, res: Response) {
    try {
      const alertas = await dashboardService.getAlertasRecientes();
      res.json(alertas);
    } catch (error) {
      console.error('Error al obtener alertas recientes:', error);
      res.status(500).json({ message: 'Error al obtener alertas recientes' });
    }
  },

  async getAvailableTables(_req: Request, res: Response) {
    try {
      const tables = await dashboardService.getAvailableTables();
      res.json({ tables });
    } catch (error) {
      console.error('Error al obtener tablas disponibles:', error);
      res.status(500).json({ message: 'Error al obtener tablas disponibles' });
    }
  },

  async getTableColumns(req: Request, res: Response) {
    try {
      const { tableName } = req.params;
      if (!tableName) {
        return res.status(400).json({ message: 'Nombre de tabla requerido' });
      }

      const columns = await dashboardService.getTableColumns(tableName);
      res.json({ columns });
      return;
    } catch (error) {
      console.error('Error al obtener columnas de la tabla:', error);
      res.status(500).json({ message: 'Error al obtener columnas de la tabla' });
      return;
    }
  },

  async getTableData(req: Request, res: Response) {
    try {
      const { tableName } = req.params;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      if (!tableName) {
        return res.status(400).json({ message: 'Nombre de tabla requerido' });
      }

      const data = await dashboardService.getTableData(tableName, filters);
      res.json({ data });
      return;
    } catch (error) {
      console.error('Error al obtener datos de la tabla:', error);
      if (error instanceof Error && error.message.includes('permission denied')) {
        res.status(403).json({ message: `No tienes permisos para acceder a la tabla ${req.params.tableName}` });
      } else {
        res.status(500).json({ message: 'Error al obtener datos de la tabla' });
      }
      return;
    }
  },

  async getInventoryData(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getInventoryData();
      res.json(data);
    } catch (error) {
      console.error('Error al obtener datos de inventario:', error);
      res.status(500).json({ message: 'Error al obtener datos de inventario' });
    }
  }
};