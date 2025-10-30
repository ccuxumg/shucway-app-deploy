-- 1. Eliminar tablas no deseadas (recepcion_mercaderia y detalle_recepcion_mercaderia)
-- Primero eliminar FK si existen (basado en backup, detalle_recepcion tiene FK a recepcion_mercaderia)
ALTER TABLE detalle_recepcion_mercaderia DROP CONSTRAINT IF EXISTS detalle_recepcion_mercaderia_id_recepcion_fkey;
ALTER TABLE recepcion_mercaderia DROP CONSTRAINT IF EXISTS recepcion_mercaderia_id_orden_fkey;
ALTER TABLE recepcion_mercaderia DROP CONSTRAINT IF EXISTS recepcion_mercaderia_id_perfil_fkey;
DROP TABLE IF EXISTS detalle_recepcion_mercaderia CASCADE;
DROP TABLE IF EXISTS recepcion_mercaderia CASCADE;

-- 2. Configurar tabla insumo (ya existe, agregar campos de unidades si faltan)
-- Basado en backup, insumo ya tiene unidad_base, unidad_compra, unidades_por_presentacion, presentacion_detalle
ALTER TABLE insumo 
ADD COLUMN IF NOT EXISTS unidad_base TEXT DEFAULT 'unidad',
ADD COLUMN IF NOT EXISTS unidad_compra TEXT DEFAULT 'unidad',
ADD COLUMN IF NOT EXISTS unidades_por_presentacion NUMERIC DEFAULT 1 CHECK (unidades_por_presentacion > 0),
ADD COLUMN IF NOT EXISTS presentacion_detalle TEXT;

-- 3. Configurar tabla lote_insumo (ya existe, agregar campos relacionados con unidades si necesario)
-- lote_insumo maneja lotes específicos, puede referenciar unidades vía id_insumo
-- No se modifican campos por ahora, pero asegurar FK a insumo
ALTER TABLE lote_insumo 
ADD CONSTRAINT IF NOT EXISTS fk_lote_insumo_id_insumo FOREIGN KEY (id_insumo) REFERENCES insumo(id_insumo) ON DELETE CASCADE;

-- 4. Configurar tabla orden_compra (ya existe, agregar campos si necesario)
-- orden_compra ya tiene campos básicos, agregar total si falta
ALTER TABLE orden_compra 
ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;

-- 5. Configurar tabla detalle_orden_compra (asumiendo existe, agregar campos para unidades)
-- Basado en uso en migración, agregar cantidad_base y FK opcional
ALTER TABLE detalle_orden_compra 
ADD COLUMN IF NOT EXISTS cantidad_base NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS id_presentacion INTEGER REFERENCES insumo_presentacion(id_presentacion);

-- 6. Crear tabla intermedia insumo_presentacion
-- Esta tabla maneja las unidades por presentación para cada insumo
CREATE TABLE insumo_presentacion (
    id_presentacion SERIAL PRIMARY KEY,
    id_insumo INTEGER NOT NULL REFERENCES insumo(id_insumo) ON DELETE CASCADE,
    unidad_base TEXT NOT NULL DEFAULT 'unidad',
    unidad_compra TEXT NOT NULL DEFAULT 'unidad',
    unidades_por_presentacion NUMERIC NOT NULL DEFAULT 1 CHECK (unidades_por_presentacion > 0),
    presentacion_detalle TEXT,
    UNIQUE(id_insumo)  -- Un insumo tiene solo una presentación activa
);

-- 7. Migrar datos existentes de insumo a insumo_presentacion
-- Asumiendo que insumo ya tiene los campos (de conversaciones anteriores)
INSERT INTO insumo_presentacion (id_insumo, unidad_base, unidad_compra, unidades_por_presentacion, presentacion_detalle)
SELECT id_insumo, 
       COALESCE(unidad_base, 'unidad'), 
       COALESCE(unidad_compra, 'unidad'), 
       COALESCE(unidades_por_presentacion, 1), 
       presentacion_detalle
FROM insumo
WHERE activo = true;  -- Solo insumos activos

-- 8. Modificar otras tablas para usar la nueva estructura (opcional, si quieres FK directas)
-- Agregar FK en movimiento_inventario para referencia directa a presentación (opcional)
ALTER TABLE movimiento_inventario 
ADD COLUMN IF NOT EXISTS id_presentacion INTEGER REFERENCES insumo_presentacion(id_presentacion);

-- Actualizar FK existentes en movimiento_inventario (si id_insumo existe)
UPDATE movimiento_inventario 
SET id_presentacion = ip.id_presentacion
FROM insumo_presentacion ip
WHERE movimiento_inventario.id_insumo = ip.id_insumo;

-- Actualizar FK en detalle_orden_compra (ya agregada en sección 5)
UPDATE detalle_orden_compra 
SET id_presentacion = ip.id_presentacion
FROM insumo_presentacion ip
WHERE detalle_orden_compra.id_insumo = ip.id_insumo;

-- 9. Remover campos de unidades de insumo (después de migrar a insumo_presentacion)
ALTER TABLE insumo DROP COLUMN IF EXISTS unidad_base;
ALTER TABLE insumo DROP COLUMN IF EXISTS unidad_compra;
ALTER TABLE insumo DROP COLUMN IF EXISTS unidades_por_presentacion;
ALTER TABLE insumo DROP COLUMN IF EXISTS presentacion_detalle;

-- 10. Crear índices para performance
CREATE INDEX idx_insumo_presentacion_id_insumo ON insumo_presentacion(id_insumo);

-- 11. Verificar migración (queries de prueba)
-- SELECT * FROM insumo_presentacion LIMIT 5;
-- SELECT COUNT(*) FROM movimiento_inventario WHERE id_presentacion IS NOT NULL;
-- SELECT COUNT(*) FROM detalle_orden_compra WHERE id_presentacion IS NOT NULL;