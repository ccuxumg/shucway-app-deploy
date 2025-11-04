-- ===============================================
-- RESUMEN DE CAMBIOS - Tabla gasto_operativo
-- ===============================================

/*
┌─────────────────────────────────────────────────────────────────┐
│                    CAMBIOS REALIZADOS                            │
└─────────────────────────────────────────────────────────────────┘

CAMPOS ELIMINADOS:
  ❌ id_proveedor INTEGER
  ❌ comprobante_url VARCHAR(255)
  ❌ tipo_movimiento VARCHAR(20) DEFAULT 'compra'

CAMPOS AGREGADOS:
  ✅ nombre_gasto VARCHAR(150) NOT NULL - Nombre/descripción del gasto
  ✅ fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ✅ fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP

CAMPOS MANTENIDOS:
  ✓ id_gasto SERIAL PRIMARY KEY
  ✓ numero_gasto VARCHAR(20) UNIQUE - Número correlativo
  ✓ fecha_gasto DATE DEFAULT CURRENT_DATE
  ✓ detalle TEXT NOT NULL
  ✓ monto DECIMAL(12,2) NOT NULL - Con CHECK (monto > 0)
  ✓ id_perfil INTEGER NOT NULL REFERENCES perfil_usuario
  ✓ id_categoria INTEGER NOT NULL REFERENCES categoria_gasto

CATEGORÍAS DISPONIBLES (en categoria_gasto):
  1. Gastos de Personal
  2. Servicios Fijos (Mensuales)
  3. Insumos Operativos
  4. Gastos de Transporte
  5. Mantenimiento y Reemplazos

┌─────────────────────────────────────────────────────────────────┐
│                   NUEVA ESTRUCTURA                               │
└─────────────────────────────────────────────────────────────────┘

CREATE TABLE gasto_operativo (
    id_gasto SERIAL PRIMARY KEY,
    numero_gasto VARCHAR(20) NOT NULL UNIQUE,          -- Número correlativo
    fecha_gasto DATE DEFAULT CURRENT_DATE,             -- Fecha del gasto
    id_categoria INTEGER NOT NULL REFERENCES categoria_gasto,  -- Categoría del gasto
    nombre_gasto VARCHAR(150) NOT NULL,                -- Nombre/descripción
    detalle TEXT NOT NULL,                             -- Detalle adicional
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),    -- Monto (positivo)
    id_perfil INTEGER NOT NULL REFERENCES perfil_usuario,  -- Usuario que registra
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- Cuándo se creó
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Última actualización
);

┌─────────────────────────────────────────────────────────────────┐
│              EJEMPLO DE INSERCIÓN DE DATOS                       │
└─────────────────────────────────────────────────────────────────┘

-- Gasto de Personal
INSERT INTO gasto_operativo (numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, id_perfil)
VALUES ('GAST-001', '2025-11-04', 1, 'Pago de Nómina', 'Pago de sueldos del mes de noviembre', 5000.00, 1);

-- Servicio Fijo
INSERT INTO gasto_operativo (numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, id_perfil)
VALUES ('GAST-002', '2025-11-04', 2, 'Pago de Renta', 'Renta mensual del local comercial', 1500.00, 1);

-- Insumo Operativo
INSERT INTO gasto_operativo (numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, id_perfil)
VALUES ('GAST-003', '2025-11-04', 3, 'Compra de Papel Térmico', 'Rollo de papel para caja registradora', 50.00, 1);

-- Gasto de Transporte
INSERT INTO gasto_operativo (numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, id_perfil)
VALUES ('GAST-004', '2025-11-04', 4, 'Combustible', 'Gasolina para reparto de pedidos', 200.00, 1);

-- Mantenimiento
INSERT INTO gasto_operativo (numero_gasto, fecha_gasto, id_categoria, nombre_gasto, detalle, monto, id_perfil)
VALUES ('GAST-005', '2025-11-04', 5, 'Reparación de Refrigerador', 'Compresión y revisión general', 300.00, 1);

┌─────────────────────────────────────────────────────────────────┐
│               CONSULTAS ÚTILES                                   │
└─────────────────────────────────────────────────────────────────┘

-- Ver todos los gastos con categoría
SELECT 
    g.numero_gasto,
    g.fecha_gasto,
    cg.nombre AS categoria,
    g.nombre_gasto,
    g.monto,
    p.primer_nombre AS usuario
FROM gasto_operativo g
JOIN categoria_gasto cg ON g.id_categoria = cg.id_categoria
JOIN perfil_usuario p ON g.id_perfil = p.id_perfil
ORDER BY g.fecha_gasto DESC;

-- Gasto total por categoría
SELECT 
    cg.nombre AS categoria,
    COUNT(g.id_gasto) AS cantidad_gastos,
    SUM(g.monto) AS total_gasto,
    AVG(g.monto) AS promedio_gasto
FROM gasto_operativo g
JOIN categoria_gasto cg ON g.id_categoria = cg.id_categoria
GROUP BY cg.nombre
ORDER BY total_gasto DESC;

-- Gastos del mes actual
SELECT 
    g.numero_gasto,
    g.fecha_gasto,
    cg.nombre,
    g.nombre_gasto,
    g.monto
FROM gasto_operativo g
JOIN categoria_gasto cg ON g.id_categoria = cg.id_categoria
WHERE EXTRACT(MONTH FROM g.fecha_gasto) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(YEAR FROM g.fecha_gasto) = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY g.fecha_gasto DESC;

-- Gastos por usuario
SELECT 
    p.primer_nombre,
    p.primer_apellido,
    COUNT(g.id_gasto) AS total_registros,
    SUM(g.monto) AS monto_total
FROM gasto_operativo g
JOIN perfil_usuario p ON g.id_perfil = p.id_perfil
GROUP BY p.id_perfil, p.primer_nombre, p.primer_apellido
ORDER BY monto_total DESC;

┌─────────────────────────────────────────────────────────────────┐
│              CAMBIOS DE BACKEND (Node.js)                        │
└─────────────────────────────────────────────────────────────────┘

El controlador gastosOperativosService.ts debe ser actualizado:

CAMBIOS NECESARIOS EN FRONTEND:
  ❌ Remover campo: proveedor
  ❌ Remover campo: comprobante (upload)
  ❌ Remover campo: tipo_movimiento (radio buttons)
  ✅ Agregar campo: nombre_gasto (text input)
  ✓ Mantener: numero_gasto, fecha_gasto, id_categoria, detalle, monto, id_perfil

INTERFACES TYPESCRIPT A ACTUALIZAR:
  - CreateGastoDTO
  - GastoOperativo
  - ResumenGastos

*/

-- Para ejecutar este script:
-- 1. Abre tu herramienta de BD (pgAdmin, DBeaver, etc.)
-- 2. Copia el contenido del archivo migration_gasto_operativo.sql
-- 3. Ejecuta todos los comandos en orden
-- 4. Valida los resultados al final
