import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';

// Iniciar servidor
async function startServer() {
  try {
    logger.info('🚀 Iniciando servidor Shucway Backend...');
    
    // Verificar conexión a Supabase PostgreSQL
    logger.info('🔍 Verificando conexión a Supabase PostgreSQL...');
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      logger.error('❌ No se pudo conectar a la base de datos Supabase');
      logger.error('Verifica las credenciales en el archivo .env');
      process.exit(1);
    }

    // Iniciar servidor HTTP
    app.listen(config.port, () => {
      logger.info('✅ Servidor iniciado exitosamente');
      logger.info(`🌐 Servidor corriendo en http://localhost:${config.port}`);
      logger.info(`🌍 Entorno: ${config.env}`);
      logger.info(`📡 CORS habilitado para: ${config.cors.origin}`);
      logger.info(`🗄️  Base de datos: Supabase PostgreSQL (sin RLS)`);
      logger.info(`📦 Storage: Supabase Storage`);
      logger.info(`🔐 Autenticación: JWT personalizado (sin Supabase Auth)`);
      logger.info('📝 Logs guardados en: ./logs/');
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('⚠️  SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('⚠️  SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Promesa rechazada no manejada:', { reason, promise });
  process.exit(1);
});

// Iniciar servidor
startServer();
