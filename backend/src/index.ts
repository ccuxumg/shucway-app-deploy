// backend/src/index.ts
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';

// ─────────────────────────────────────────────────────────────
// Servidor local para desarrollo
// ─────────────────────────────────────────────────────────────

async function startServer() {
  try {
    logger.info('🚀 Iniciando servidor Shucway Backend...');

    // Verificación de BD (saltable con SKIP_DB_CHECK=true)
    const skipDbCheck = process.env.SKIP_DB_CHECK === 'true';
    if (skipDbCheck) {
      logger.warn('⏭️  SKIP_DB_CHECK=true → Saltando verificación de base de datos');
    } else {
      const ok = await testDatabaseConnection();
      if (!ok) {
        logger.error('❌ No se pudo conectar a la base de datos Supabase');
        if (config.env === 'development') {
          logger.warn('⚠️  Continuando sin verificación de BD (modo desarrollo)');
        } else {
          process.exit(1);
        }
      } else {
        logger.info('✅ Conexión a base de datos OK');
      }
    }

    const port = Number(config.port) || Number(process.env.PORT) || 3001;

    const server = app.listen(port, () => {
      logger.info(`✅ Servidor escuchando en http://localhost:${port}`);
      logger.info(`🌍 Entorno: ${config.env}`);
      logger.info(`📡 CORS: ${Array.isArray(config.cors?.origin) ? config.cors.origin.join(',') : config.cors?.origin}`);
      logger.info('🗄️  BD: Supabase PostgreSQL (sin RLS)');
      logger.info('📦 Storage: Supabase Storage');
      logger.info('🔐 Auth: JWT personalizado (sin Supabase Auth)');
      logger.info('📝 Logs en: ./logs/');
    });

    const gracefulShutdown = () => {
      logger.info('⚠️  Apagado graceful…');
      server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('unhandledRejection', (reason) => {
      logger.error('❌ UnhandledRejection:', reason as Error);
    });
    process.on('uncaughtException', (err) => {
      logger.error('❌ UncaughtException:', err);
    });

    return server;
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Arrancar el servidor localmente
startServer();

// Exportar la app para Vercel/serverless/tests
export default app;
