-- ===============================================
-- MIGRATION: Modificar tabla gasto_operativo
-- Fecha: 2025-11-04
-- Descripción: Simplificar estructura y cambiar categorías
-- ===============================================

-- PASO 1: CREAR LA NUEVA TABLA categoria_gasto CON LAS NUEVAS OPCIONES
-- Primero, backup de la tabla anterior si existe
DROP TABLE IF EXISTS gasto_operativo_backup CASCADE;
CREATE TABLE gasto_operativo_backup AS SELECT * FROM gasto_operativo;

-- PASO 2: CREAR TABLA categoria_gasto CON LAS NUEVAS OPCIONES
DROP TABLE IF EXISTS categoria_gasto CASCADE;
CREATE TABLE categoria_gasto (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE CHECK (nombre IN (
        'Gastos de Personal',
        'Servicios Fijos (Mensuales)',
        'Insumos Operativos',
        'Gastos de Transporte',
        'Mantenimiento y Reemplazos'
    )),
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- PASO 3: INSERTAR LAS CATEGORÍAS POR DEFECTO
INSERT INTO categoria_gasto (nombre, descripcion, activo) VALUES
('Gastos de Personal', 'Sueldos, salarios, bonificaciones del personal', TRUE),
('Servicios Fijos (Mensuales)', 'Servicios recurrentes como electricidad, agua, internet, renta', TRUE),
('Insumos Operativos', 'Materiales y suministros necesarios para la operación', TRUE),
('Gastos de Transporte', 'Combustible, mantenimiento de vehículos, fletes', TRUE),
('Mantenimiento y Reemplazos', 'Reparaciones y reemplazo de equipos', TRUE);

-- PASO 4: ELIMINAR TRIGGERS Y RESTRICCIONES RELACIONADAS CON GASTOS_OPERATIVOS
DROP TRIGGER IF EXISTS trg_bitacora_gasto_operativo ON gasto_operativo CASCADE;
DROP FUNCTION IF EXISTS fn_bitacora_gasto_operativo() CASCADE;

-- PASO 5: RECREAR LA TABLA gasto_operativo CON LA NUEVA ESTRUCTURA
DROP TABLE IF EXISTS gasto_operativo CASCADE;
CREATE TABLE gasto_operativo (
    id_gasto SERIAL PRIMARY KEY,
    numero_gasto VARCHAR(20) NOT NULL UNIQUE,
    fecha_gasto DATE DEFAULT CURRENT_DATE,
    id_categoria INTEGER NOT NULL REFERENCES categoria_gasto(id_categoria),
    nombre_gasto VARCHAR(150) NOT NULL,
    detalle TEXT NOT NULL,
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    frecuencia VARCHAR(20) DEFAULT 'mensual' CHECK (frecuencia IN ('semanal', 'quincenal', 'mensual')),
    id_perfil INTEGER NOT NULL REFERENCES perfil_usuario(id_perfil),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PASO 6: CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_gasto_fecha ON gasto_operativo(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_gasto_categoria ON gasto_operativo(id_categoria);
CREATE INDEX IF NOT EXISTS idx_gasto_perfil ON gasto_operativo(id_perfil);
CREATE INDEX IF NOT EXISTS idx_gasto_numero ON gasto_operativo(numero_gasto);
CREATE INDEX IF NOT EXISTS idx_gasto_fecha_creacion ON gasto_operativo(fecha_creacion);

-- PASO 7: CREAR FUNCIÓN PARA BITÁCORA DE GASTOS OPERATIVOS
CREATE OR REPLACE FUNCTION fn_bitacora_gasto_operativo()
RETURNS TRIGGER AS $$
DECLARE
    v_accion VARCHAR(50);
    v_descripcion TEXT;
BEGIN
    -- Determinar la acción basada en el tipo de evento
    IF TG_OP = 'INSERT' THEN
        v_accion := 'creacion';
        v_descripcion := 'Nuevo gasto operativo creado: ' || NEW.nombre_gasto || ' - ' || NEW.monto || ' (' || NEW.frecuencia || ')';
    ELSIF TG_OP = 'UPDATE' THEN
        v_accion := 'actualizacion';
        v_descripcion := 'Gasto operativo actualizado: ' || NEW.nombre_gasto || ' - Monto anterior: ' || OLD.monto || ' -> Nuevo: ' || NEW.monto || ' | Frecuencia: ' || OLD.frecuencia || ' -> ' || NEW.frecuencia;
    ELSIF TG_OP = 'DELETE' THEN
        v_accion := 'eliminacion';
        v_descripcion := 'Gasto operativo eliminado: ' || OLD.nombre_gasto || ' - ' || OLD.monto || ' (' || OLD.frecuencia || ')';
    END IF;

    -- Registrar en bitácora
    INSERT INTO bitacora_operativa (
        id_gasto,
        accion,
        descripcion,
        id_perfil,
        fecha_accion,
        datos_anteriores,
        datos_nuevos
    ) VALUES (
        COALESCE(NEW.id_gasto, OLD.id_gasto),
        v_accion,
        v_descripcion,
        COALESCE(NEW.id_perfil, OLD.id_perfil),
        CURRENT_TIMESTAMP,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 8: CREAR TABLA DE BITÁCORA PARA GASTOS OPERATIVOS
DROP TABLE IF EXISTS bitacora_operativa CASCADE;
CREATE TABLE bitacora_operativa (
    id_bitacora SERIAL PRIMARY KEY,
    id_gasto INTEGER REFERENCES gasto_operativo(id_gasto) ON DELETE CASCADE,
    accion VARCHAR(50) CHECK (accion IN ('creacion', 'actualizacion', 'eliminacion')),
    descripcion TEXT,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

-- PASO 9: CREAR ÍNDICES EN BITÁCORA
CREATE INDEX IF NOT EXISTS idx_bitacora_operativa_gasto ON bitacora_operativa(id_gasto);
CREATE INDEX IF NOT EXISTS idx_bitacora_operativa_fecha ON bitacora_operativa(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_bitacora_operativa_perfil ON bitacora_operativa(id_perfil);

-- PASO 10: CREAR TRIGGER PARA BITÁCORA
DROP TRIGGER IF EXISTS trg_bitacora_gasto_operativo ON gasto_operativo;
CREATE TRIGGER trg_bitacora_gasto_operativo
AFTER INSERT OR UPDATE OR DELETE ON gasto_operativo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_gasto_operativo();

-- PASO 11: CREAR FUNCIÓN PARA ACTUALIZAR fecha_actualizacion
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 12: CREAR TRIGGER PARA ACTUALIZAR fecha_actualizacion
DROP TRIGGER IF EXISTS trg_actualizar_fecha_actualizacion ON gasto_operativo;
CREATE TRIGGER trg_actualizar_fecha_actualizacion
BEFORE UPDATE ON gasto_operativo
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_fecha_actualizacion();

-- ===============================================
-- VALIDACIÓN: Mostrar estructura final
-- ===============================================

-- Ver las categorías insertadas
SELECT 
    id_categoria,
    nombre,
    descripcion,
    activo
FROM categoria_gasto
ORDER BY id_categoria;

-- Ver la estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'gasto_operativo'
ORDER BY ordinal_position;

-- Ver triggers activos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'gasto_operativo'
ORDER BY trigger_name;

-- Ver índices creados
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE tablename = 'gasto_operativo'
ORDER BY indexname;

-- ===============================================
-- INFORMACIÓN DE ROLLBACK (si necesitas revertir)
-- ===============================================
-- Para revertir a los datos anteriores, ejecuta:
-- DROP TABLE gasto_operativo CASCADE;
-- ALTER TABLE gasto_operativo_backup RENAME TO gasto_operativo;
-- Nota: Esto solo funcionará si ejecutas esto INMEDIATAMENTE después de la migración
