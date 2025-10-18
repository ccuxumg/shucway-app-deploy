import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas del dashboard' });
    }
  },

  async getVentasSemana(req: Request, res: Response) {
    try {
      const ventas = await dashboardService.getVentasSemana();
      res.json(ventas);
    } catch (error) {
      console.error('Error al obtener ventas de la semana:', error);
      res.status(500).json({ message: 'Error al obtener ventas de la semana' });
    }
  },

  async getAlertasRecientes(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 5;
      const alertas = await dashboardService.getAlertasRecientes(limit);
      res.json(alertas);
    } catch (error) {
      console.error('Error al obtener alertas recientes:', error);
      res.status(500).json({ message: 'Error al obtener alertas recientes' });
    }
  }
};