import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';

const isVercel = !!process.env.VERCEL;

// Iniciar servidor SOLO en local (no en Vercel/serverless)
async function startServer() {
  try {
    console.log('🔄 Iniciando función startServer...');
    logger.info('🚀 Iniciando servidor Shucway Backend...');

    // Verificar conexión a Supabase PostgreSQL (solo si no se salta)
    const skipDbCheck = process.env.SKIP_DB_CHECK === 'true';

    if (!skipDbCheck) {
      if (config.env === 'development') {
        console.log('🔍 Verificando conexión a BD...');
        logger.info('🔍 Verificando conexión a Supabase PostgreSQL...');
        const isConnected = await testDatabaseConnection();

        if (!isConnected) {
          logger.error('❌ No se pudo conectar a la base de datos Supabase');
          logger.error('Verifica las credenciales en el archivo .env');
          // En desarrollo, continuar de todas formas para no bloquear el desarrollo
          logger.warn('⚠️  Continuando sin verificación de BD (modo desarrollo)');
        }
      } else {
        // En producción local, verificar siempre
        logger.info('🔍 Verificando conexión a Supabase PostgreSQL...');
        const isConnected = await testDatabaseConnection();

        if (!isConnected) {
          logger.error('❌ No se pudo conectar a la base de datos Supabase');
          process.exit(1);
        }
      }
    } else {
      logger.info('⚡ Saltando verificación de base de datos (modo rápido)');
    }

    console.log('🔄 Creando servidor HTTP...');
    const server = app.listen(config.port, () => {
      console.log('✅ Servidor HTTP creado exitosamente');
      logger.info('✅ Servidor iniciado exitosamente');
      logger.info(`🌐 Servidor corriendo en http://localhost:${config.port}`);
      logger.info(`🌍 Entorno: ${config.env}`);
      logger.info(`📡 CORS habilitado para: ${config.cors.origin}`);
      logger.info(`🗄️  Base de datos: Supabase PostgreSQL (sin RLS)`);
      logger.info(`📦 Storage: Supabase Storage`);
      logger.info(`🔐 Autenticación: JWT personalizado (sin Supabase Auth)`);
      logger.info('📝 Logs guardados en: ./logs/');
    });

    console.log('🔄 Configurando graceful shutdown...');
    const gracefulShutdown = () => {
      console.log('🔄 Iniciando graceful shutdown...');
      logger.info('⚠️  Iniciando apagado graceful...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    console.log('🔄 Servidor configurado completamente');
    return server;
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados (solo en local)
if (!isVercel) {
  process.on('uncaughtException', (error) => {
    logger.error('❌ Excepción no capturada:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promesa rechazada no manejada:', { reason, promise });
    process.exit(1);
  });
}

// Ejecutar servidor solo si NO estamos en Vercel
if (!isVercel) {
  startServer();
}

// En Vercel, este archivo solo exporta la app; la Function la monta `api/index.ts`
export default app;
