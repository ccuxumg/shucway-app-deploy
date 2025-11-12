import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { testDatabaseConnection } from './config/database';

const isVercel = !!process.env.VERCEL;

async function startServer() {
  try {
    console.log('Iniciando función startServer...');
    logger.info('Iniciando servidor Shucway Backend...');

    const skipDbCheck = process.env.SKIP_DB_CHECK === 'true';

    if (!skipDbCheck) {
      if (config.env === 'development') {
        console.log('Verificando conexión a BD...');
        logger.info('Verificando conexión a Supabase PostgreSQL...');
        const isConnected = await testDatabaseConnection();

        if (!isConnected) {
          logger.error(' No se pudo conectar a la base de datos Supabase');
          logger.error('Verifica las credenciales en el archivo .env');
          logger.warn(' Continuando sin verificación de BD (modo desarrollo)');
        }
      } else {
        logger.info('Verificando conexión a Supabase PostgreSQL...');
        const isConnected = await testDatabaseConnection();

        if (!isConnected) {
          logger.error('No se pudo conectar a la base de datos Supabase');
          process.exit(1);
        }
      }
    } else {
      logger.info('⚡ Saltando verificación de base de datos (modo rápido)');
    }

    console.log('🔄 Creando servidor HTTP...');
    const server = app.listen(config.port, () => {
      console.log('Servidor HTTP creado exitosamente');
      logger.info('Servidor iniciado exitosamente');
      logger.info(`Servidor corriendo en http://localhost:${config.port}`);
      logger.info(`Entorno: ${config.env}`);
      logger.info(`CORS habilitado para: ${config.cors.origin}`);
      logger.info(`Base de datos: Supabase PostgreSQL (sin RLS)`);
      logger.info(`Storage: Supabase Storage`);
      logger.info(`Autenticación: JWT personalizado (sin Supabase Auth)`);
      logger.info('Logs guardados en: ./logs/');
    });

    console.log('Configurando graceful shutdown...');
    const bootstrapSignalGracePeriodMs = 3000;
    let signalsEnabled = false;
    const enableSignalsTimer = setTimeout(() => {
      signalsEnabled = true;
      logger.info('Señales de apagado graceful habilitadas tras la ventana de arranque.');
    }, bootstrapSignalGracePeriodMs);

    const gracefulShutdown = (signal: NodeJS.Signals | 'MANUAL') => {
      if (!signalsEnabled && signal && signal !== 'MANUAL') {
        logger.warn(`Señal ${signal} recibida durante los primeros ${bootstrapSignalGracePeriodMs}ms; ignorando para evitar cierre temprano.`);
        return;
      }
      console.log('Iniciando graceful shutdown...', signal ? `signal=${signal}` : '');
      logger.info(`Iniciando apagado graceful${signal ? ` por señal ${signal}` : ''}...`);
      server.close(() => {
        console.log('Servidor cerrado correctamente');
        logger.info('Servidor cerrado correctamente');
        clearTimeout(enableSignalsTimer);
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));

    console.log('Servidor configurado completamente');
    return server;
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}
if (!isVercel) {
  process.on('uncaughtException', (error) => {
    logger.error('Excepción no capturada:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada:', { reason, promise });
    process.exit(1);
  });

  process.on('exit', (code) => {
    logger.info(`Proceso finalizado con código ${code}`);
  });
}

if (!isVercel) {
  startServer();
}

export default app;
