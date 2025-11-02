import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const getFullBackup = async (_req: Request, res: Response) => {
  try {
    // Supabase no permite conexiones directas de PostgreSQL desde clientes externos
    // por razones de seguridad. Los backups deben hacerse desde el panel de Supabase.
    logger.warn('Intento de backup directo rechazado - usar panel de Supabase');

    res.status(403).json({
      success: false,
      error: 'Backup directo no disponible',
      message: 'Para backups completos, usa el panel de administración de Supabase en https://supabase.com/dashboard/project/cdrzomyyxyfhazkzuwou/sql',
      details: 'Supabase no permite conexiones PostgreSQL directas desde aplicaciones externas por seguridad.'
    });
  } catch (error) {
    logger.error('Error en backup completo:', error);
    res.status(500).json({
      success: false,
      error: 'Error generando backup completo',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getIncrementalBackup = async (_req: Request, res: Response) => {
  try {
    // Para Supabase free tier, no hay soporte nativo para backups incrementales
    // Simulamos ofreciendo un backup completo como alternativa
    const message = 'Los backups incrementales no están disponibles en el plan gratuito de Supabase. ' +
                   'Se recomienda usar el backup completo como alternativa. ' +
                   'Para backups incrementales reales, considera actualizar a un plan pago de Supabase.';

    res.json({
      success: true,
      message,
      recommendation: 'Usar backup completo',
      availableOptions: ['full-backup'],
      limitations: {
        freeTier: 'Sin soporte incremental',
        alternative: 'Backup completo programado',
        paidPlans: 'Incremental disponible en Pro/Team plans'
      }
    });

  } catch (error) {
    logger.error('Error procesando solicitud de backup incremental:', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando backup incremental',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};