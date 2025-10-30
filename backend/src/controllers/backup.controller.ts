import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { Client } from 'pg';

interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

// Función para generar backup SQL usando pg library
async function generateSQLBackup(dbConfig: DatabaseConfig): Promise<string> {
  const client = new Client({
    host: dbConfig.host,
    port: parseInt(dbConfig.port),
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: { rejectUnauthorized: false } // Para Supabase
  });

  await client.connect();

  try {
    let sql = '-- Backup generado automáticamente\n';
    sql += `-- Fecha: ${new Date().toISOString()}\n\n`;

    // Obtener todas las secuencias
    const sequencesResult = await client.query(`
      SELECT sequence_name, start_value, increment, minimum_value, maximum_value, cycle_option
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name
    `);

    for (const seqRow of sequencesResult.rows) {
      sql += `DROP SEQUENCE IF EXISTS "${seqRow.sequence_name}" CASCADE;\n`;
      sql += `CREATE SEQUENCE "${seqRow.sequence_name}"\n`;
      sql += `  START WITH ${seqRow.start_value}\n`;
      sql += `  INCREMENT BY ${seqRow.increment}\n`;
      sql += `  MINVALUE ${seqRow.minimum_value}\n`;
      sql += `  MAXVALUE ${seqRow.maximum_value}\n`;
      if (seqRow.cycle_option === 'YES') sql += `  CYCLE\n`;
      else sql += `  NO CYCLE\n`;
      sql += `;\n\n`;
    }

    // Obtener todas las tablas
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.tablename;

      // Obtener estructura de la tabla
      const schemaResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      // Generar CREATE TABLE
      sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sql += `CREATE TABLE "${tableName}" (\n`;

      const columns = schemaResult.rows.map((col, index) => {
        let colDef = `  "${col.column_name}" ${col.data_type}`;
        if (col.is_nullable === 'NO') colDef += ' NOT NULL';
        if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
        return colDef + (index < schemaResult.rows.length - 1 ? ',' : '');
      });

      sql += columns.join('\n');
      sql += '\n);\n\n';

      // Obtener datos de la tabla
      const dataResult = await client.query(`SELECT * FROM "${tableName}"`);

      if (dataResult.rows.length > 0) {
        sql += `INSERT INTO "${tableName}" VALUES\n`;

        const values = dataResult.rows.map(row => {
          const rowValues = schemaResult.rows.map(col => {
            const value = row[col.column_name];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return value.toString();
          });
          return `(${rowValues.join(', ')})`;
        });

        sql += values.join(',\n');
        sql += ';\n\n';
      }
    }

    return sql;
  } finally {
    await client.end();
  }
}

export const getFullBackup = async (_req: Request, res: Response) => {
  try {
    // Configuración de Supabase
    const dbConfig = {
      host: config.supabase.dbHost || 'localhost',
      port: config.supabase.dbPort || '5432',
      database: config.supabase.dbName || 'postgres',
      user: config.supabase.dbUser || 'postgres',
      password: config.supabase.dbPassword || ''
    };

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-full-${timestamp}.sql`;
    const filepath = path.join(__dirname, '../../temp', filename);

    // Asegurar que el directorio temp existe
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generar backup SQL usando pg library
    const sqlContent = await generateSQLBackup(dbConfig);

    // Escribir el archivo SQL
    fs.writeFileSync(filepath, sqlContent, 'utf8');

    logger.info(`Backup completo generado: ${filename}`);

    // Enviar archivo como descarga
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

    // Limpiar archivo después de enviar
    fileStream.on('end', () => {
      fs.unlink(filepath, (err) => {
        if (err) logger.error('Error eliminando archivo temporal:', err);
      });
    });

  } catch (error) {
    logger.error('Error generando backup completo:', error);
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