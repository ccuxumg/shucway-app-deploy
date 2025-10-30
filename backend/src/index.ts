// backend/src/index.ts
import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';

// ─────────────────────────────────────────────────────────────
// Detección de entorno
//   - En local: queremos LEVANTAR el servidor HTTP.
//   - En serverless (Vercel/AWS): NO levantamos servidor; solo exportamos `app`.
//   - Puedes forzar el arranque con FORCE_LOCAL=true
// ─────────────────────────────────────────────────────────────
const isVercel = !!process.env.VERCEL;
const isAwsLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isServerless = isVercel || isAwsLambda || process.env.SERVERLESS === 'true';
const forceLocal = process.env.FORCE_LOCAL === 'true';

// Si no estamos en serverless (o lo forzamos), arrancamos el server.
const shouldStartHttp = forceLocal || !isServerless;

async function startServer() {
  try {
    logger.info('🚀 Iniciando servidor Shucway Backend...');
    logger.info(
      `🧭 Flags → isVercel=${isVercel} isAwsLambda=${isAwsLambda} forceLocal=${forceLocal} shouldStartHttp=${shouldStartHttp}`
    );

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

// Arrancar sólo cuando corresponde (local por defecto)
if (shouldStartHttp) {

  startServer();
} else {
  logger.info('🧪 Entorno serverless detectado → no se levanta HTTP, se exporta app');
}

// Exportar la app para Vercel/serverless/tests
export default app;
