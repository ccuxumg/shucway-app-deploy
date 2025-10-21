import { supabase } from '../config/database';
import { logger } from '../utils/logger';

async function migrateRolesConstraint() {
  try {
    logger.info('🚀 Iniciando migración de roles personalizados...');

    // Verificar conexión
    const { error: testError } = await supabase
      .from('rol_usuario')
      .select('id_rol')
      .limit(1);

    if (testError) {
      throw new Error(`Error de conexión a la base de datos: ${testError.message}`);
    }

    logger.info('✅ Conexión a base de datos exitosa');

    // Como no podemos ejecutar DDL directamente desde el cliente,
    // vamos a mostrar las instrucciones para ejecutar manualmente
    logger.info('📋 INSTRUCCIONES PARA EJECUTAR LA MIGRACIÓN:');
    logger.info('');
    logger.info('1. Ve al SQL Editor de Supabase');
    logger.info('2. Ejecuta estas consultas en orden:');
    logger.info('');
    logger.info('--- QUERY 1: Eliminar restricción existente ---');
    logger.info(`ALTER TABLE rol_usuario DROP CONSTRAINT IF EXISTS rol_usuario_nombre_rol_check;`);
    logger.info('');
    logger.info('--- QUERY 2: Agregar nueva restricción ---');
    logger.info(`ALTER TABLE rol_usuario ADD CONSTRAINT rol_usuario_nombre_rol_check`);
    logger.info(`CHECK (`);
    logger.info(`    nombre_rol IS NOT NULL`);
    logger.info(`    AND LENGTH(TRIM(nombre_rol)) > 0`);
    logger.info(`    AND LENGTH(nombre_rol) <= 50`);
    logger.info(`    AND nombre_rol ~ '^[a-zA-Z0-9 _]+$'`);
    logger.info(`);`);
    logger.info('');
    logger.info('--- QUERY 3: Insertar roles predefinidos ---');
    logger.info(`INSERT INTO rol_usuario (nombre_rol, descripcion, nivel_permisos, permisos, activo) VALUES`);
    logger.info(`('cliente', 'Usuario cliente con permisos básicos', 10, '{"read": true, "write": false, "delete": false}'::jsonb, true),`);
    logger.info(`('cajero', 'Usuario cajero para ventas', 40, '{"read": true, "write": true, "delete": false}'::jsonb, true),`);
    logger.info(`('administrador', 'Usuario administrador del sistema', 80, '{"read": true, "write": true, "delete": true}'::jsonb, true),`);
    logger.info(`('propietario', 'Usuario propietario con permisos totales', 100, '{"read": true, "write": true, "delete": true}'::jsonb, true)`);
    logger.info(`ON CONFLICT (nombre_rol) DO NOTHING;`);
    logger.info('');
    logger.info('⚠️  IMPORTANTE: Ejecuta estas consultas en el SQL Editor de Supabase');
    logger.info('🔄 Después de ejecutar, reinicia el servidor backend');

    return true;

  } catch (error) {
    logger.error('❌ Error en la migración:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateRolesConstraint()
    .then(() => {
      logger.info('Instrucciones de migración mostradas');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error:', error);
      process.exit(1);
    });
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateRolesConstraint()
    .then(() => {
      logger.info('Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error en migración:', error);
      process.exit(1);
    });
}

export { migrateRolesConstraint };