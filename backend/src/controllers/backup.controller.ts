import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { logger } from '../utils/logger';

interface VentaBackupRecord {
  id_venta: number;
  total_venta?: number | null;
  [key: string]: unknown;
}

interface DetalleVentaBackupRecord {
  id_detalle: number;
  id_venta: number;
  [key: string]: unknown;
}

interface InsumoBackupRecord {
  id_insumo: number;
  stock_actual?: number;
  [key: string]: unknown;
}

interface LoteBackupRecord {
  id_insumo: number;
  cantidad_actual?: number | null;
  [key: string]: unknown;
}

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

export const getIncrementalBackup = async (req: Request, res: Response) => {
  try {
    const summaryParam = Array.isArray(req.query.summary) ? req.query.summary[0] : req.query.summary;
    const modeParam = Array.isArray(req.query.mode) ? req.query.mode[0] : req.query.mode;

    const normalizeParam = (value?: string) => (value ? value.toLowerCase().trim() : '');
    const summaryValue = typeof summaryParam === 'string' ? normalizeParam(summaryParam) : '';
    const modeValue = typeof modeParam === 'string' ? normalizeParam(modeParam) : '';

    const summaryOnly = summaryValue === 'true' || summaryValue === '1' || modeValue === 'summary';

    if (summaryOnly) {
      const [ventasCountResult, detallesCountResult, insumosCountResult] = await Promise.all([
        supabase.from('venta').select('id_venta', { count: 'exact', head: true }),
        supabase.from('detalle_venta').select('id_detalle', { count: 'exact', head: true }),
        supabase.from('insumo').select('id_insumo', { count: 'exact', head: true })
      ]);

      if (ventasCountResult.error) {
        throw new Error(`Error obteniendo conteo de ventas: ${ventasCountResult.error.message}`);
      }

      if (detallesCountResult.error) {
        throw new Error(`Error obteniendo conteo de detalles de venta: ${detallesCountResult.error.message}`);
      }

      if (insumosCountResult.error) {
        throw new Error(`Error obteniendo conteo de insumos: ${insumosCountResult.error.message}`);
      }

      const generatedAt = new Date().toISOString();

      return res.json({
        success: true,
        message: 'Resumen de backup incremental disponible.',
        metadata: {
          generatedAt,
          ventasCount: ventasCountResult.count ?? 0,
          detallesCount: detallesCountResult.count ?? 0,
          insumosCount: insumosCountResult.count ?? 0,
          note: 'Los datos completos incluyen ventas con sus detalles e insumos con stock calculado.'
        }
      });
    }

    const [ventasResult, detallesResult, insumosResult, lotesResult] = await Promise.all([
      supabase.from('venta').select('*').order('fecha_venta', { ascending: false }),
      supabase.from('detalle_venta').select('*'),
      supabase.from('insumo').select('*').order('nombre_insumo'),
      supabase.from('lote_insumo').select('*')
    ]);

    if (ventasResult.error) {
      throw new Error(`Error obteniendo ventas: ${ventasResult.error.message}`);
    }

    if (detallesResult.error) {
      throw new Error(`Error obteniendo detalles de venta: ${detallesResult.error.message}`);
    }

    if (insumosResult.error) {
      throw new Error(`Error obteniendo insumos: ${insumosResult.error.message}`);
    }

    if (lotesResult.error) {
      throw new Error(`Error obteniendo lotes de insumos: ${lotesResult.error.message}`);
    }

    const ventasData = (ventasResult.data ?? []) as VentaBackupRecord[];
    const detallesData = (detallesResult.data ?? []) as DetalleVentaBackupRecord[];
    const insumosData = (insumosResult.data ?? []) as InsumoBackupRecord[];
    const lotesData = (lotesResult.data ?? []) as LoteBackupRecord[];

    const detallesPorVenta = new Map<number, DetalleVentaBackupRecord[]>();
    detallesData.forEach((detalle) => {
      const existentes = detallesPorVenta.get(detalle.id_venta);
      if (existentes) {
        existentes.push(detalle);
      } else {
        detallesPorVenta.set(detalle.id_venta, [detalle]);
      }
    });

    const ventas = ventasData.map((venta) => ({
      ...venta,
      detalles: detallesPorVenta.get(venta.id_venta) ?? []
    }));

    const lotesPorInsumo = new Map<number, LoteBackupRecord[]>();
    lotesData.forEach((lote) => {
      const existentes = lotesPorInsumo.get(lote.id_insumo);
      if (existentes) {
        existentes.push(lote);
      } else {
        lotesPorInsumo.set(lote.id_insumo, [lote]);
      }
    });

    const insumos = insumosData.map((insumo) => {
      const lotes = lotesPorInsumo.get(insumo.id_insumo) ?? [];
      const stockActual = lotes.reduce(
        (total, lote) => total + (Number(lote.cantidad_actual) || 0),
        0
      );

      return {
        ...insumo,
        stock_actual: stockActual,
        lotes
      };
    });

    const generatedAt = new Date().toISOString();
    const filename = `backup-incremental-${generatedAt.replace(/[:.]/g, '-')}.json`;

    const totalVentas = ventas.reduce((total: number, venta) => total + (Number(venta.total_venta) || 0), 0);

    const totalStock = insumos.reduce(
      (total: number, insumo) => total + (Number(insumo.stock_actual) || 0),
      0
    );

    const payload = {
      success: true,
      message: 'Backup incremental exportado con datos de ventas e insumos.',
      metadata: {
        generatedAt,
        filename,
        ventasCount: ventas.length,
        detallesCount: detallesData.length,
        insumosCount: insumos.length,
        totalVentas,
        totalStock,
        note: 'Incluye ventas con sus detalles e insumos con stock calculado para auditoría incremental.'
      },
      datasets: {
        ventas,
        insumos
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    logger.error('Error procesando solicitud de backup incremental:', error);
    return res.status(500).json({
      success: false,
      error: 'Error procesando backup incremental',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};