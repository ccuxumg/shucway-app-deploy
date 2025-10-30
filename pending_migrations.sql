-- Migración pendiente: Agregar campo id_presentacion a detalle_orden_compra
-- Este archivo contiene los cambios necesarios para sincronizar la base de datos existente
-- con las modificaciones realizadas en BD-modificado.sql

-- Agregar la columna id_presentacion a la tabla detalle_orden_compra solo si no existe
-- Nota: Asegúrate de que la tabla insumo_presentacion exista antes de ejecutar esto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'detalle_orden_compra' 
        AND column_name = 'id_presentacion'
    ) THEN
        ALTER TABLE detalle_orden_compra 
        ADD COLUMN id_presentacion INTEGER NOT NULL REFERENCES insumo_presentacion(id_presentacion);
        RAISE NOTICE 'Columna id_presentacion agregada exitosamente a detalle_orden_compra';
    ELSE
        RAISE NOTICE 'La columna id_presentacion ya existe en detalle_orden_compra, omitiendo...';
    END IF;
END $$;

-- Si hay datos existentes en detalle_orden_compra con id_presentacion NULL, 
-- necesitarás poblarlos con valores apropiados basados en la lógica de tu aplicación
-- Ejemplo (ajusta según tu lógica de negocio):
-- UPDATE detalle_orden_compra SET id_presentacion = 1 WHERE id_presentacion IS NULL;

-- Verificar que la migración se aplicó correctamente
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'detalle_orden_compra';