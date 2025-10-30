-- ===============================================
-- 🐱 SCRIPT COMPLETO Y CORREGIDO V5 PARA SHUCWAY - SUPABASE 
-- ===============================================

-- ===============================================
-- 1. TABLAS DE AUTENTICACIÓN Y USUARIOS
-- ===============================================

-- TABLA DE ROLES
CREATE TABLE IF NOT EXISTS rol_usuario (
    id_rol SERIAL PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE CHECK (nombre_rol IN ('cliente', 'cajero', 'administrador', 'propietario')),
    descripcion TEXT,
    nivel_permisos INTEGER DEFAULT 0 CHECK (nivel_permisos >= 0 AND nivel_permisos <= 100),
    permisos JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS perfil_usuario (
    id_perfil SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50),
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50),
    telefono VARCHAR(15),
    direccion TEXT,
    fecha_nacimiento DATE,
    username VARCHAR(50) UNIQUE,
    avatar_url VARCHAR(255),
    
    id_rol INTEGER NOT NULL REFERENCES rol_usuario(id_rol) ON DELETE RESTRICT,
    
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido', 'eliminado')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bitacora_seguridad (
    id_bitacora_seguridad SERIAL PRIMARY KEY,
    id_perfil INTEGER NOT NULL REFERENCES perfil_usuario(id_perfil) ON DELETE CASCADE,
    
    intentos_fallidos INTEGER DEFAULT 0,
    ultimo_intento_fallido TIMESTAMP,
    bloqueado_hasta TIMESTAMP,
    
    token_recuperacion VARCHAR(255),
    token_expiracion TIMESTAMP,
    
    tipo_evento VARCHAR(50) CHECK (tipo_evento IN (
        'login_exitoso', 'login_fallido', 'logout', 
        'cambio_password', 'recuperacion_password', 
        'bloqueo_cuenta', 'desbloqueo_cuenta',
        'actualizacion_perfil'
    )),
    ip_address VARCHAR(45),
    user_agent TEXT,
    descripcion TEXT,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- ELIMINAR LA CONSTRAINT PROBLEMÁTICA
ALTER TABLE bitacora_seguridad DROP CONSTRAINT IF EXISTS unique_active_token;

-- Crear un índice único solo para tokens de recuperación (cuando no son null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_token_recuperacion
ON bitacora_seguridad (id_perfil, token_recuperacion)
WHERE token_recuperacion IS NOT NULL;
);

-- ===============================================
-- MÓDULO: Inventario (Modelo Híbrido Perpetuo + Operativo)
-- ===============================================

CREATE TABLE categoria_insumo (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo_categoria VARCHAR(20) DEFAULT 'operativo' CHECK (tipo_categoria IN ('perpetuo', 'operativo'))
);

CREATE TABLE proveedor (
    id_proveedor SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(100) NOT NULL,
    nombre_contacto VARCHAR(100),
    telefono VARCHAR(20),
    correo VARCHAR(100),
    direccion TEXT,
    estado BOOLEAN DEFAULT TRUE,
    metodo_entrega VARCHAR(50) CHECK (metodo_entrega IN ('Recepcion', 'Recoger en tienda')),
    es_preferido BOOLEAN DEFAULT FALSE
);

-- Agregar campo es_preferido si no existe (para migraciones)
ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS es_preferido BOOLEAN DEFAULT FALSE;

-- Insertar datos de proveedores de ejemplo
INSERT INTO proveedor (nombre_empresa, nombre_contacto, telefono, correo, direccion, estado, metodo_entrega, es_preferido) VALUES
('Distribuidora de Alimentos La Central', 'Juan Pérez', '555-1234', 'ventas@lacentral.com', 'Av. Principal #123, Zona Industrial', true, 'Recepcion', false),
('Carnes Premium S.A.', 'María González', '555-5678', 'pedidos@carnespremium.com', 'Calle 10 #45, Sector Norte', true, 'Recepcion', false),
('Verduras Frescas del Campo', 'Pedro Martínez', '555-9012', 'info@verdurasdelcampo.com', 'Km 5 Carretera Sur', true, 'Recepcion', false),
('Lácteos y Derivados El Rancho', 'Ana López', '555-3456', 'contacto@lacteosrancho.com', 'Zona Franca, Bodega 7', true, 'Recoger en tienda', false),
('Distribuidora de Bebidas RefrescoMax', 'Carlos Rodríguez', '555-7890', 'ventas@refrescomax.com', 'Av. Industrial #890', true, 'Recepcion', false),
('Productos de Limpieza HigieneTotal', 'Laura Sánchez', '555-2345', 'pedidos@higienetotal.com', 'Calle Comercio #234', true, 'Recoger en tienda', false)
ON CONFLICT DO NOTHING;

CREATE TABLE insumo (
    id_insumo SERIAL PRIMARY KEY,
    nombre_insumo VARCHAR(100) NOT NULL,
    id_categoria INTEGER NOT NULL REFERENCES categoria_insumo(id_categoria),
    unidad_base VARCHAR(20) NOT NULL,
    id_proveedor_principal INTEGER REFERENCES proveedor(id_proveedor),
    stock_minimo DECIMAL(10,2) DEFAULT 0.00,
    stock_maximo DECIMAL(10,2) DEFAULT 0.00,
    costo_promedio DECIMAL(10,2) DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE lote_insumo (
    id_lote SERIAL PRIMARY KEY,
    id_insumo INTEGER REFERENCES insumo(id_insumo),
    fecha_vencimiento DATE,
    cantidad_inicial DECIMAL(10,2) NOT NULL,
    cantidad_actual DECIMAL(10,2) NOT NULL CHECK (cantidad_actual >= 0),
    costo_unitario DECIMAL(10,2),
    ubicacion VARCHAR(100)
);

CREATE TABLE movimiento_inventario (
    id_movimiento SERIAL PRIMARY KEY,
    id_insumo INTEGER REFERENCES insumo(id_insumo),
    id_lote INTEGER REFERENCES lote_insumo(id_lote),
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN (
        'entrada_compra', 'salida_venta', 'entrada_ajuste', 'salida_ajuste', 'perdida', 'devolucion'
    )),
    cantidad DECIMAL(10,2) NOT NULL,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    id_referencia INTEGER,
    descripcion TEXT,
    costo_unitario_momento DECIMAL(10,2) DEFAULT 0,
    costo_total DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * costo_unitario_momento) STORED
);

-- ===============================================================
-- MÓDULO: Compras y Proveedores 
-- ===============================================================

CREATE TABLE orden_compra (
    id_orden SERIAL PRIMARY KEY,
    fecha_orden TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_proveedor INTEGER REFERENCES proveedor(id_proveedor),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'recibida', 'cancelada', 'parcial')),
    tipo_orden VARCHAR(20) DEFAULT 'manual' CHECK (tipo_orden IN ('manual', 'automatica')),
    motivo_generacion TEXT,
    fecha_aprobacion TIMESTAMP,
    subtotal DECIMAL(12,2) DEFAULT 0,
    iva DECIMAL(12,2) DEFAULT 0,
    tipo_pago VARCHAR(20) DEFAULT 'credito' CHECK (tipo_pago IN ('efectivo', 'transferencias', 'tarjeta', 'credito')),
    fecha_entrega_estimada DATE,
    creado_por INTEGER REFERENCES perfil_usuario(id_perfil),
    aprobado_por INTEGER REFERENCES perfil_usuario(id_perfil)
);

CREATE TABLE detalle_orden_compra (
    id_detalle SERIAL PRIMARY KEY,
    id_orden INTEGER REFERENCES orden_compra(id_orden) ON DELETE CASCADE,
    id_insumo INTEGER REFERENCES insumo(id_insumo),
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    iva DECIMAL(12,2) DEFAULT 0,
    cantidad_recibida DECIMAL(10,2) DEFAULT 0,
    id_presentacion INTEGER NOT NULL REFERENCES insumo_presentacion(id_presentacion)
);

CREATE TABLE recepcion_mercaderia (
    id_recepcion SERIAL PRIMARY KEY,
    id_orden INTEGER REFERENCES orden_compra(id_orden),
    fecha_recepcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    numero_factura VARCHAR(50),
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('parcial', 'completada', 'rechazada'))
);

CREATE TABLE detalle_recepcion_mercaderia (
    id_detalle SERIAL PRIMARY KEY,
    id_recepcion INTEGER REFERENCES recepcion_mercaderia(id_recepcion),
    id_detalle_orden INTEGER REFERENCES detalle_orden_compra(id_detalle),
    cantidad_recibida DECIMAL(10,2) NOT NULL,
    cantidad_aceptada DECIMAL(10,2) NOT NULL,
    cantidad_rechazada DECIMAL(10,2) DEFAULT 0,
    motivo_rechazo TEXT,
    id_lote INTEGER REFERENCES lote_insumo(id_lote)
);

-- ===============================================================
-- MÓDULO: Productos y Ventas 
-- ===============================================================

CREATE TABLE categoria_producto (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'desactivado'))
);

CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(10,2) NOT NULL,
    costo_producto DECIMAL(10,2) DEFAULT 0, 
    id_categoria INTEGER REFERENCES categoria_producto(id_categoria),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'desactivado')),
    imagen_url VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE producto_variante (
    id_variante SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
    nombre_variante VARCHAR(100) NOT NULL,
    costo_variante DECIMAL(10,2) DEFAULT 0, 
    precio_variante DECIMAL(10,2) DEFAULT 0, 
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'desactivado')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_producto, nombre_variante)
);

CREATE TABLE receta_detalle (
    id_receta SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id_producto) ON DELETE CASCADE,
    id_insumo INTEGER NOT NULL REFERENCES insumo(id_insumo) ON DELETE RESTRICT,
    cantidad_requerida DECIMAL(10,3) NOT NULL,
    unidad_base VARCHAR(20) NOT NULL,
    es_obligatorio BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_producto, id_insumo)
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(15),
    direccion VARCHAR(50), -- Para NIT o CF
    puntos_acumulados INTEGER DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_compra TIMESTAMP
);

CREATE TABLE venta (
    id_venta SERIAL PRIMARY KEY, 
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_cliente INTEGER REFERENCES cliente(id_cliente),
    estado VARCHAR(20) DEFAULT 'confirmada' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
    tipo_pago VARCHAR(20) DEFAULT 'Cash' CHECK (tipo_pago IN ('Cash', 'Paggo', 'Tarjeta', 'Transferencia')),
    total_venta DECIMAL(12,2) DEFAULT 0,
    total_costo DECIMAL(12,2) DEFAULT 0,
    ganancia DECIMAL(12,2) GENERATED ALWAYS AS (total_venta - total_costo) STORED,
    id_cajero INTEGER REFERENCES perfil_usuario(id_perfil), 
    notas TEXT
);

CREATE TABLE detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INTEGER REFERENCES venta(id_venta) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES producto(id_producto),
    id_variante INTEGER REFERENCES producto_variante(id_variante), -- Sub-artículo (opcional)
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    costo_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    costo_total DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
    ganancia DECIMAL(12,2) GENERATED ALWAYS AS ((precio_unitario - costo_unitario) * cantidad) STORED,
    descuento DECIMAL(10,2) DEFAULT 0,
    es_canje_puntos BOOLEAN DEFAULT FALSE, -- TRUE si es producto gratis por canje de 10 puntos
    puntos_canjeados INTEGER DEFAULT 0 
);

-- ===============================================================
-- MÓDULO: Gastos Operativos y Movimientos
-- ===============================================================
CREATE TABLE categoria_gasto (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo_gasto VARCHAR(20) DEFAULT 'operativo' CHECK (tipo_gasto IN ('operativo', 'inversion')),
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE gasto_operativo (
    id_gasto SERIAL PRIMARY KEY,
    numero_gasto VARCHAR(20) UNIQUE,
    fecha_gasto DATE DEFAULT CURRENT_DATE,
    id_categoria INTEGER REFERENCES categoria_gasto(id_categoria),
    detalle TEXT NOT NULL, 
    monto DECIMAL(12,2) NOT NULL,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    id_proveedor INTEGER REFERENCES proveedor(id_proveedor),
    comprobante_url VARCHAR(255),
    tipo_movimiento VARCHAR(20) DEFAULT 'compra' CHECK (tipo_movimiento IN ('compra', 'gasto', 'inversion'))
);

CREATE TABLE deposito_banco (
    id_deposito SERIAL PRIMARY KEY,
    fecha_deposito TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT NOT NULL,
    tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('Paggo', 'Cash', 'Tarjeta', 'Transferencia')),
    monto DECIMAL(12,2) NOT NULL,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    comprobante_url VARCHAR(255),
    notas TEXT
);

-- TABLA DE ARQUEO DE CAJA
CREATE TABLE arqueo_caja (
    id_arqueo SERIAL PRIMARY KEY,
    fecha_arqueo DATE DEFAULT CURRENT_DATE,
    id_cajero INTEGER REFERENCES perfil_usuario(id_perfil),
    billetes_100 INTEGER DEFAULT 0,
    billetes_50 INTEGER DEFAULT 0,
    billetes_20 INTEGER DEFAULT 0,
    billetes_10 INTEGER DEFAULT 0,
    billetes_5 INTEGER DEFAULT 0,
    monedas_1 INTEGER DEFAULT 0,
    monedas_050 INTEGER DEFAULT 0,
    monedas_025 INTEGER DEFAULT 0,
    total_billetes_100 DECIMAL(10,2) GENERATED ALWAYS AS (billetes_100 * 100) STORED,
    total_billetes_50 DECIMAL(10,2) GENERATED ALWAYS AS (billetes_50 * 50) STORED,
    total_billetes_20 DECIMAL(10,2) GENERATED ALWAYS AS (billetes_20 * 20) STORED,
    total_billetes_10 DECIMAL(10,2) GENERATED ALWAYS AS (billetes_10 * 10) STORED,
    total_billetes_5 DECIMAL(10,2) GENERATED ALWAYS AS (billetes_5 * 5) STORED,
    total_monedas_1 DECIMAL(10,2) GENERATED ALWAYS AS (monedas_1 * 1) STORED,
    total_monedas_050 DECIMAL(10,2) GENERATED ALWAYS AS (monedas_050 * 0.50) STORED,
    total_monedas_025 DECIMAL(10,2) GENERATED ALWAYS AS (monedas_025 * 0.25) STORED,
    total_contado DECIMAL(12,2) GENERATED ALWAYS AS (
        billetes_100 * 100 + billetes_50 * 50 + billetes_20 * 20 + 
        billetes_10 * 10 + billetes_5 * 5 + monedas_1 * 1 + 
        monedas_050 * 0.50 + monedas_025 * 0.25
    ) STORED,
    -- Comparación con sistema
    total_sistema DECIMAL(12,2) NOT NULL, -- Total esperado según ventas
    diferencia DECIMAL(12,2) GENERATED ALWAYS AS (
        (billetes_100 * 100 + billetes_50 * 50 + billetes_20 * 20 + 
         billetes_10 * 10 + billetes_5 * 5 + monedas_1 * 1 + 
         monedas_050 * 0.50 + monedas_025 * 0.25) - total_sistema
    ) STORED,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado', 'revisado'))
);

-- ===============================================================
-- MÓDULO: Sistema de Puntos de Lealtad
-- ===============================================================

-- TABLA DE HISTORIAL DE PUNTOS
CREATE TABLE historial_puntos (
    id_historial SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES cliente(id_cliente) ON DELETE CASCADE,
    id_venta INTEGER REFERENCES venta(id_venta),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('acumulacion', 'canje', 'ajuste', 'expiracion')),
    puntos_anterior INTEGER NOT NULL,
    puntos_movimiento INTEGER NOT NULL,
    puntos_nuevo INTEGER NOT NULL,
    descripcion TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_cajero INTEGER REFERENCES perfil_usuario(id_perfil)
);

-- ===============================================================
-- MÓDULO: Bitácoras de Auditoría
-- ===============================================================

-- BITÁCORA DE CAMBIOS EN INVENTARIO
CREATE TABLE bitacora_inventario (
    id_bitacora_inventario SERIAL PRIMARY KEY,
    id_insumo INTEGER REFERENCES insumo(id_insumo),
    accion VARCHAR(50) CHECK (accion IN (
        'creacion', 'actualizacion', 'eliminacion',
        'cambio_precio', 'cambio_proveedor', 'cambio_stock_limites',
        'ajuste_manual'
    )),
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    descripcion TEXT
);

CREATE TABLE bitacora_ventas (
    id_bitacora_venta SERIAL PRIMARY KEY,
    id_venta INTEGER REFERENCES venta(id_venta) ON DELETE CASCADE,
    accion VARCHAR(50) CHECK (accion IN (
        'creacion', 'modificacion', 'cancelacion',
        'cambio_estado', 'descuento_aplicado'
    )),
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    descripcion TEXT,
    datos_adicionales JSONB
);

CREATE TABLE bitacora_ordenes_compra (
    id_bitacora_orden SERIAL PRIMARY KEY,
    id_orden INTEGER REFERENCES orden_compra(id_orden) ON DELETE CASCADE,
    accion VARCHAR(50) CHECK (accion IN (
        'creacion_manual', 'creacion_automatica', 
        'aprobacion', 'rechazo', 'cancelacion',
        'recepcion_parcial', 'recepcion_completa'
    )),
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20),
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    descripcion TEXT,
    datos_adicionales JSONB
);

CREATE TABLE bitacora_productos (
    id_bitacora_producto SERIAL PRIMARY KEY,
    id_producto INTEGER REFERENCES producto(id_producto) ON DELETE CASCADE,
    accion VARCHAR(50) CHECK (accion IN (
        'creacion', 'actualizacion', 'eliminacion',
        'cambio_precio', 'cambio_receta', 'cambio_estado'
    )),
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT
);

-- ===============================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ===============================================================
CREATE INDEX IF NOT EXISTS idx_perfil_email ON perfil_usuario(email);
CREATE INDEX IF NOT EXISTS idx_perfil_username ON perfil_usuario(username);
CREATE INDEX IF NOT EXISTS idx_perfil_rol ON perfil_usuario(id_rol);
CREATE INDEX IF NOT EXISTS idx_perfil_estado ON perfil_usuario(estado);
CREATE INDEX IF NOT EXISTS idx_bitacora_perfil ON bitacora_seguridad(id_perfil);
CREATE INDEX IF NOT EXISTS idx_bitacora_tipo_evento ON bitacora_seguridad(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_seguridad(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_bitacora_token ON bitacora_seguridad(token_recuperacion) WHERE token_recuperacion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_insumo_categoria ON insumo(id_categoria);
CREATE INDEX IF NOT EXISTS idx_insumo_nombre ON insumo(nombre_insumo); -- Para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_lote_vencimiento ON lote_insumo(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_lote_insumo ON lote_insumo(id_insumo);
CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON movimiento_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimiento_insumo ON movimiento_inventario(id_insumo);
CREATE INDEX IF NOT EXISTS idx_orden_compra_estado ON orden_compra(estado);
CREATE INDEX IF NOT EXISTS idx_orden_compra_tipo ON orden_compra(tipo_orden);
CREATE INDEX IF NOT EXISTS idx_orden_compra_fecha ON orden_compra(fecha_orden);
CREATE INDEX IF NOT EXISTS idx_bitacora_inventario_insumo ON bitacora_inventario(id_insumo);
CREATE INDEX IF NOT EXISTS idx_bitacora_inventario_fecha ON bitacora_inventario(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_bitacora_ventas_venta ON bitacora_ventas(id_venta);
CREATE INDEX IF NOT EXISTS idx_bitacora_ventas_fecha ON bitacora_ventas(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_bitacora_ordenes_orden ON bitacora_ordenes_compra(id_orden);
CREATE INDEX IF NOT EXISTS idx_bitacora_ordenes_fecha ON bitacora_ordenes_compra(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_bitacora_productos_producto ON bitacora_productos(id_producto);
CREATE INDEX IF NOT EXISTS idx_bitacora_productos_fecha ON bitacora_productos(fecha_accion);
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_venta_estado ON venta(estado);
CREATE INDEX IF NOT EXISTS idx_venta_tipo_pago ON venta(tipo_pago);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_producto ON detalle_venta(id_producto);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_variante ON detalle_venta(id_variante);
CREATE INDEX IF NOT EXISTS idx_receta_detalle_insumo ON receta_detalle(id_insumo);
CREATE INDEX IF NOT EXISTS idx_gasto_fecha ON gasto_operativo(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_deposito_fecha ON deposito_banco(fecha_deposito);
CREATE INDEX IF NOT EXISTS idx_historial_puntos_cliente ON historial_puntos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_historial_puntos_venta ON historial_puntos(id_venta);
CREATE INDEX IF NOT EXISTS idx_historial_puntos_fecha ON historial_puntos(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_cliente_puntos ON cliente(puntos_acumulados);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_canje ON detalle_venta(es_canje_puntos);
CREATE INDEX IF NOT EXISTS idx_arqueo_fecha ON arqueo_caja(fecha_arqueo);

-- ===============================================================
-- FUNCIONES CRÍTICAS DEL SISTEMA
-- ===============================================================

-- FUNCIÓN PARA OBTENER EL STOCK REAL DE UN INSUMO
CREATE OR REPLACE FUNCTION fn_obtener_stock_actual(p_id_insumo INTEGER)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    v_stock_actual DECIMAL(10, 2);
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN tipo_movimiento IN ('entrada_compra', 'entrada_ajuste', 'devolucion') THEN cantidad
            WHEN tipo_movimiento IN ('salida_venta', 'salida_ajuste', 'perdida') THEN -cantidad
            ELSE 0 
        END
    ), 0) INTO v_stock_actual
    FROM movimiento_inventario
    WHERE id_insumo = p_id_insumo;
    RETURN v_stock_actual;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_descontar_inventario_venta(p_id_venta INTEGER, p_id_perfil INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_detalle RECORD;
    v_cantidad_a_descontar DECIMAL(10,3);
    v_costo_actual DECIMAL(10,2);
BEGIN
    FOR v_detalle IN
        SELECT 
            dv.cantidad AS cantidad_vendida,
            rd.id_insumo, 
            rd.cantidad_requerida AS cantidad_receta,
            ci.tipo_categoria,
            i.costo_promedio,
            i.nombre_insumo
        FROM detalle_venta dv
        JOIN receta_detalle rd ON dv.id_producto = rd.id_producto
        JOIN insumo i ON rd.id_insumo = i.id_insumo
        JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
        WHERE dv.id_venta = p_id_venta
    LOOP
        IF v_detalle.tipo_categoria = 'operativo' THEN
            v_cantidad_a_descontar := v_detalle.cantidad_vendida * v_detalle.cantidad_receta;
            v_costo_actual := v_detalle.costo_promedio;
            
            INSERT INTO movimiento_inventario (id_insumo, tipo_movimiento, cantidad, id_perfil, id_referencia, descripcion, costo_unitario_momento)
            VALUES (
                v_detalle.id_insumo, 'salida_venta', v_cantidad_a_descontar, p_id_perfil, p_id_venta, 
                'Descuento automático por venta #' || p_id_venta || ' - ' || v_detalle.nombre_insumo, 
                v_costo_actual
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA CALCULAR PRECIO Y COSTO EN DETALLE DE VENTA
CREATE OR REPLACE FUNCTION fn_calcular_precio_costo_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_precio_base DECIMAL(10, 2);
    v_costo_base DECIMAL(10, 2);
    v_precio_variante DECIMAL(10, 2) := 0;
    v_costo_variante DECIMAL(10, 2) := 0;
BEGIN
    -- Obtener precio y costo base del producto
    SELECT precio_venta, costo_producto 
    INTO v_precio_base, v_costo_base
    FROM producto 
    WHERE id_producto = NEW.id_producto;
    
    IF NEW.id_variante IS NOT NULL THEN
        SELECT precio_variante, costo_variante
        INTO v_precio_variante, v_costo_variante
        FROM producto_variante
        WHERE id_variante = NEW.id_variante;
    END IF;

    NEW.precio_unitario := v_precio_base + COALESCE(v_precio_variante, 0);
    NEW.costo_unitario := v_costo_base + COALESCE(v_costo_variante, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_actualizar_totales_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_total_venta DECIMAL(12, 2);
    v_total_costo DECIMAL(12, 2);
BEGIN
    SELECT 
        COALESCE(SUM(subtotal - descuento), 0),
        COALESCE(SUM(costo_total), 0)
    INTO v_total_venta, v_total_costo
    FROM detalle_venta
    WHERE id_venta = COALESCE(NEW.id_venta, OLD.id_venta);

    UPDATE venta
    SET 
        total_venta = v_total_venta,
        total_costo = v_total_costo
    WHERE id_venta = COALESCE(NEW.id_venta, OLD.id_venta);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- FUNCIONES PARA SISTEMA DE PUNTOS DE LEALTAD
-- ===============================================================

-- FUNCIÓN PARA ACUMULAR PUNTOS AUTOMÁTICAMENTE AL CONFIRMAR VENTA
CREATE OR REPLACE FUNCTION fn_acumular_puntos_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_puntos_actuales INTEGER;
    v_puntos_agregar INTEGER;
BEGIN
    -- Solo acumular puntos si la venta está confirmada y tiene cliente
    IF NEW.estado = 'confirmada' AND NEW.id_cliente IS NOT NULL THEN
        
        -- Obtener puntos actuales del cliente
        SELECT puntos_acumulados INTO v_puntos_actuales
        FROM cliente
        WHERE id_cliente = NEW.id_cliente;
        
        -- Calcular puntos a agregar (1 punto por cada producto NO canjeado)
        SELECT COALESCE(SUM(cantidad), 0)::INTEGER
        INTO v_puntos_agregar
        FROM detalle_venta
        WHERE id_venta = NEW.id_venta
        AND es_canje_puntos = FALSE;
        
        -- Actualizar puntos del cliente
        UPDATE cliente
        SET 
            puntos_acumulados = puntos_acumulados + v_puntos_agregar,
            ultima_compra = NEW.fecha_venta
        WHERE id_cliente = NEW.id_cliente;
        
        -- Registrar en historial de puntos
        INSERT INTO historial_puntos (
            id_cliente, 
            id_venta, 
            tipo_movimiento, 
            puntos_anterior, 
            puntos_movimiento, 
            puntos_nuevo,
            descripcion
        ) VALUES (
            NEW.id_cliente,
            NEW.id_venta,
            'acumulacion',
            v_puntos_actuales,
            v_puntos_agregar,
            v_puntos_actuales + v_puntos_agregar,
            'Compra ticket #' || NEW.id_venta || ' - ' || v_puntos_agregar || ' productos'
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA CANJEAR PUNTOS (10 puntos = 1 producto gratis)
CREATE OR REPLACE FUNCTION fn_canjear_puntos(
    p_id_cliente INTEGER,
    p_id_venta INTEGER,
    p_id_cajero INTEGER
)
RETURNS TABLE(
    exito BOOLEAN,
    mensaje TEXT,
    puntos_restantes INTEGER
) AS $$
DECLARE
    v_puntos_actuales INTEGER;
    v_puntos_necesarios INTEGER := 10;
BEGIN
    -- Verificar puntos del cliente
    SELECT puntos_acumulados INTO v_puntos_actuales
    FROM cliente
    WHERE id_cliente = p_id_cliente;
    
    -- Validar que tiene suficientes puntos
    IF v_puntos_actuales < v_puntos_necesarios THEN
        RETURN QUERY SELECT 
            FALSE,
            'Puntos insuficientes. Tiene ' || v_puntos_actuales || ' puntos, necesita ' || v_puntos_necesarios,
            v_puntos_actuales;
        RETURN;
    END IF;
    
    -- Descontar puntos
    UPDATE cliente
    SET puntos_acumulados = puntos_acumulados - v_puntos_necesarios
    WHERE id_cliente = p_id_cliente;
    
    -- Registrar canje en historial
    INSERT INTO historial_puntos (
        id_cliente,
        id_venta,
        tipo_movimiento,
        puntos_anterior,
        puntos_movimiento,
        puntos_nuevo,
        descripcion,
        id_cajero
    ) VALUES (
        p_id_cliente,
        p_id_venta,
        'canje',
        v_puntos_actuales,
        -v_puntos_necesarios,
        v_puntos_actuales - v_puntos_necesarios,
        'Canje de 10 puntos por producto gratis - Ticket #' || p_id_venta,
        p_id_cajero
    );
    
    RETURN QUERY SELECT 
        TRUE,
        'Canje exitoso. Producto gratis agregado.',
        v_puntos_actuales - v_puntos_necesarios;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA CONSULTAR PUNTOS DE UN CLIENTE
CREATE OR REPLACE FUNCTION fn_consultar_puntos(p_id_cliente INTEGER)
RETURNS TABLE(
    nombre_cliente VARCHAR(100),
    puntos_actuales INTEGER,
    productos_gratis_disponibles INTEGER,
    puntos_para_siguiente INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.nombre,
        c.puntos_acumulados,
        (c.puntos_acumulados / 10)::INTEGER,
        (10 - (c.puntos_acumulados % 10))::INTEGER
    FROM cliente c
    WHERE c.id_cliente = p_id_cliente;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA ACTUALIZAR EL COSTO PROMEDIO PONDERADO
CREATE OR REPLACE FUNCTION fn_actualizar_costo_promedio()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_anterior DECIMAL(12, 2);
    v_valor_inventario_anterior DECIMAL(14, 4);
    v_costo_promedio_anterior DECIMAL(12, 2);
    v_insumo_id INTEGER;
    v_precio_compra DECIMAL(10,2);
BEGIN
    SELECT id_insumo, precio_unitario INTO v_insumo_id, v_precio_compra
    FROM detalle_orden_compra 
    WHERE id_detalle = NEW.id_detalle_orden;

    SELECT COALESCE(fn_obtener_stock_actual(v_insumo_id), 0), COALESCE(costo_promedio, 0)
    INTO v_stock_anterior, v_costo_promedio_anterior
    FROM insumo WHERE id_insumo = v_insumo_id;
    
    v_valor_inventario_anterior := v_stock_anterior * v_costo_promedio_anterior;

    IF (v_stock_anterior + NEW.cantidad_aceptada) > 0 THEN
        UPDATE insumo
        SET costo_promedio = (v_valor_inventario_anterior + (NEW.cantidad_aceptada * v_precio_compra)) 
                           / (v_stock_anterior + NEW.cantidad_aceptada)
        WHERE id_insumo = v_insumo_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA REGISTRAR LA ENTRADA DE MERCADERÍA EN INVENTARIO
-- Esta función registra el movimiento de entrada cuando se recibe mercadería
-- El registro aparecerá en el Kardex y actualizará el stock
CREATE OR REPLACE FUNCTION fn_registrar_entrada_por_compra()
RETURNS TRIGGER AS $$
DECLARE
    v_recepcion RECORD;
    v_costo_compra DECIMAL(10,2);
    v_insumo_id INTEGER;
    v_nombre_insumo VARCHAR(100);
BEGIN
    -- Obtener datos de la recepción
    SELECT id_perfil, id_orden, numero_factura 
    INTO v_recepcion 
    FROM recepcion_mercaderia 
    WHERE id_recepcion = NEW.id_recepcion;
    
    -- Obtener datos de la orden de compra
    SELECT doc.precio_unitario, doc.id_insumo, i.nombre_insumo
    INTO v_costo_compra, v_insumo_id, v_nombre_insumo
    FROM detalle_orden_compra doc
    JOIN insumo i ON doc.id_insumo = i.id_insumo
    WHERE doc.id_detalle = NEW.id_detalle_orden;
    
    -- Registrar entrada en movimiento_inventario (aparece en Kardex)
    INSERT INTO movimiento_inventario (
        id_insumo, 
        id_lote, 
        tipo_movimiento, 
        cantidad, 
        id_perfil, 
        id_referencia, 
        descripcion, 
        costo_unitario_momento
    )
    VALUES (
        v_insumo_id,
        NEW.id_lote,
        'entrada_compra',
        NEW.cantidad_aceptada,
        v_recepcion.id_perfil,
        v_recepcion.id_orden,
        'Recepción orden #' || v_recepcion.id_orden || 
        ' - Factura: ' || COALESCE(v_recepcion.numero_factura, 'N/A') || 
        ' - ' || v_nombre_insumo,
        v_costo_compra
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA MANEJAR LA CONFIRMACIÓN DE UNA VENTA (MODIFICADA)
-- Nota: Esta función ya no puede usar auth.uid() - deberás pasar el id_perfil desde tu backend
CREATE OR REPLACE FUNCTION fn_manejar_confirmacion_venta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado IN ('confirmada', 'completada') AND OLD.estado NOT IN ('confirmada', 'completada') THEN
        -- IMPORTANTE: El id_perfil debe ser pasado desde el backend al actualizar la venta
        -- Por ahora, se pasa NULL. Modifica tu lógica de backend para incluir este dato.
        PERFORM fn_descontar_inventario_venta(NEW.id_venta, NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA VERIFICAR STOCK ANTES DE CONFIRMAR LA VENTA
-- Solo valida stock de insumos operativos (los que se descuentan automáticamente)
CREATE OR REPLACE FUNCTION fn_verificar_stock_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_item_venta RECORD;
    v_insumo_receta RECORD;
    v_cantidad_necesaria DECIMAL(10,3);
    v_stock_disponible DECIMAL(10,2);
BEGIN
    -- Solo verifica stock de insumos operativos
    FOR v_item_venta IN
        SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = NEW.id_venta
    LOOP
        FOR v_insumo_receta IN
            SELECT rd.id_insumo, rd.cantidad_requerida, i.nombre_insumo
            FROM receta_detalle rd
            JOIN insumo i ON rd.id_insumo = i.id_insumo
            JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
            WHERE rd.id_producto = v_item_venta.id_producto 
            AND ci.tipo_categoria = 'operativo'  -- Solo operativos
        LOOP
            v_cantidad_necesaria := v_item_venta.cantidad * v_insumo_receta.cantidad;
            v_stock_disponible := fn_obtener_stock_actual(v_insumo_receta.id_insumo);

            IF v_stock_disponible < v_cantidad_necesaria THEN
                RAISE EXCEPTION 'Stock insuficiente para "%" (operativo). Disponible: %, Necesario: %.', 
                    v_insumo_receta.nombre_insumo, v_stock_disponible, v_cantidad_necesaria;
            END IF;
        END LOOP;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- FUNCIONES PARA BITÁCORA DE SEGURIDAD
-- ===============================================================

-- PRIMERO ELIMINAR EL TRIGGER PROBLEMÁTICO
DROP TRIGGER IF EXISTS trg_registrar_actualizacion_perfil ON perfil_usuario;

-- RECREAR EL TRIGGER CON LÓGICA MEJORADA
CREATE TRIGGER trg_registrar_actualizacion_perfil
AFTER UPDATE ON perfil_usuario
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_actualizacion_perfil();

-- FUNCIÓN MEJORADA PARA EVITAR DUPLICADOS
CREATE OR REPLACE FUNCTION fn_registrar_actualizacion_perfil()
RETURNS TRIGGER AS $$
DECLARE
    v_existe_registro BOOLEAN := FALSE;
BEGIN
    -- Solo registrar si hay cambios significativos
    IF (OLD.email != NEW.email OR
        OLD.primer_nombre != NEW.primer_nombre OR
        OLD.primer_apellido != NEW.primer_apellido OR
        OLD.telefono IS DISTINCT FROM NEW.telefono OR
        OLD.id_rol != NEW.id_rol OR
        OLD.estado != NEW.estado) THEN

        -- Verificar si ya existe UN registro de actualización para este usuario hoy
        SELECT EXISTS(
            SELECT 1 FROM bitacora_seguridad
            WHERE id_perfil = NEW.id_perfil
            AND tipo_evento = 'actualizacion_perfil'
            AND DATE(fecha_evento) = CURRENT_DATE
        ) INTO v_existe_registro;

        -- Solo insertar si no existe registro para hoy
        IF NOT v_existe_registro THEN
            INSERT INTO bitacora_seguridad (id_perfil, tipo_evento, descripcion)
            VALUES (
                NEW.id_perfil,
                'actualizacion_perfil',
                'Usuario actualizado. Cambios realizados en perfil.'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;-- FUNCIÓN PARA VALIDAR CAMBIO DE CONTRASEÑA (SOLO ADMIN/PROPIETARIO)
CREATE OR REPLACE FUNCTION fn_validar_cambio_password()
RETURNS TRIGGER AS $$
DECLARE
    v_rol_usuario VARCHAR(50);
    v_puede_cambiar BOOLEAN := FALSE;
BEGIN
    IF OLD.password_hash = NEW.password_hash THEN
        RETURN NEW;
    END IF;
    SELECT r.nombre_rol INTO v_rol_usuario
    FROM perfil_usuario p
    JOIN rol_usuario r ON p.id_rol = r.id_rol
    WHERE p.id_perfil = NEW.id_perfil;
    
    IF v_rol_usuario IN ('administrador', 'propietario') THEN
        v_puede_cambiar := TRUE;
    END IF;
    
    IF NOT v_puede_cambiar THEN
        RAISE EXCEPTION 'Permiso denegado: Solo usuarios con rol "administrador" o "propietario" pueden modificar contraseñas. Tu rol actual: %', v_rol_usuario;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_registrar_cambio_password()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password_hash != NEW.password_hash THEN
        INSERT INTO bitacora_seguridad (id_perfil, tipo_evento, descripcion)
        VALUES (
            NEW.id_perfil, 
            'cambio_password', 
            'Contraseña modificada exitosamente.'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_limpiar_tokens_expirados()
RETURNS TRIGGER AS $$
BEGIN

    UPDATE bitacora_seguridad 
    SET token_recuperacion = NULL, token_expiracion = NULL
    WHERE id_perfil = NEW.id_perfil 
    AND token_expiracion < NOW()
    AND id_bitacora_seguridad != NEW.id_bitacora_seguridad;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER ESTADO DE BLOQUEO DE USUARIO
CREATE OR REPLACE FUNCTION fn_usuario_bloqueado(p_id_perfil INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_bloqueado BOOLEAN;
BEGIN
    SELECT COALESCE(bloqueado_hasta > NOW(), FALSE) INTO v_bloqueado
    FROM bitacora_seguridad 
    WHERE id_perfil = p_id_perfil 
    ORDER BY id_bitacora_seguridad DESC 
    LIMIT 1;
    
    RETURN COALESCE(v_bloqueado, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER INTENTOS FALLIDOS RECIENTES
CREATE OR REPLACE FUNCTION fn_obtener_intentos_fallidos(p_id_perfil INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_intentos INTEGER;
BEGIN
    SELECT COALESCE(intentos_fallidos, 0) INTO v_intentos
    FROM bitacora_seguridad 
    WHERE id_perfil = p_id_perfil 
    AND tipo_evento IN ('login_fallido', 'bloqueo_cuenta')
    ORDER BY id_bitacora_seguridad DESC 
    LIMIT 1;
    
    RETURN COALESCE(v_intentos, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- FUNCIONES PARA REPOSICIÓN AUTOMÁTICA DE INVENTARIO
-- ===============================================================

-- FUNCIÓN PARA DETECTAR INSUMOS CON STOCK BAJO
CREATE OR REPLACE FUNCTION fn_detectar_stock_bajo()
RETURNS TABLE(
    id_insumo INTEGER,
    nombre_insumo VARCHAR(100),
    stock_actual DECIMAL(10,2),
    stock_minimo DECIMAL(10,2),
    stock_maximo DECIMAL(10,2),
    cantidad_a_pedir DECIMAL(10,2),
    id_proveedor INTEGER,
    nombre_proveedor VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id_insumo,
        i.nombre_insumo,
        fn_obtener_stock_actual(i.id_insumo) as stock_actual,
        i.stock_minimo,
        i.stock_maximo,
        -- Calcular cantidad óptima a pedir (hasta stock máximo)
        (i.stock_maximo - fn_obtener_stock_actual(i.id_insumo)) as cantidad_a_pedir,
        i.id_proveedor_principal,
        p.nombre_empresa
    FROM insumo i
    LEFT JOIN proveedor p ON i.id_proveedor_principal = p.id_proveedor
    WHERE i.activo = TRUE
    AND fn_obtener_stock_actual(i.id_insumo) <= i.stock_minimo
    AND i.id_proveedor_principal IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA GENERAR ORDEN DE COMPRA AUTOMÁTICA
CREATE OR REPLACE FUNCTION fn_generar_orden_automatica(
    p_id_insumo INTEGER,
    p_cantidad DECIMAL(10,2)
)
RETURNS INTEGER AS $$
DECLARE
    v_id_proveedor INTEGER;
    v_id_orden INTEGER;
    v_precio_estimado DECIMAL(10,2);
    v_nombre_insumo VARCHAR(100);
BEGIN
    -- Obtener información del insumo
    SELECT id_proveedor_principal, costo_promedio, nombre_insumo
    INTO v_id_proveedor, v_precio_estimado, v_nombre_insumo
    FROM insumo
    WHERE id_insumo = p_id_insumo;
    
    -- Validar que tenga proveedor
    IF v_id_proveedor IS NULL THEN
        RAISE EXCEPTION 'El insumo "%" no tiene proveedor principal asignado', v_nombre_insumo;
    END IF;
    
    -- Crear la orden de compra automática
    INSERT INTO orden_compra (
        id_proveedor, 
        tipo_orden, 
        motivo_generacion, 
        estado,
        fecha_entrega_estimada
    )
    VALUES (
        v_id_proveedor,
        'automatica',
        'Stock bajo detectado automáticamente para: ' || v_nombre_insumo,
        'pendiente',
        CURRENT_DATE + INTERVAL '3 days' -- 3 días de entrega por defecto
    )
    RETURNING id_orden INTO v_id_orden;
    
    -- Agregar el detalle de la orden
    INSERT INTO detalle_orden_compra (
        id_orden,
        id_insumo,
        cantidad,
        precio_unitario
    )
    VALUES (
        v_id_orden,
        p_id_insumo,
        p_cantidad,
        v_precio_estimado
    );
    
    RETURN v_id_orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN TRIGGER PARA VERIFICAR STOCK BAJO DESPUÉS DE MOVIMIENTO
CREATE OR REPLACE FUNCTION fn_verificar_stock_bajo_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual DECIMAL(10,2);
    v_stock_minimo DECIMAL(10,2);
    v_stock_maximo DECIMAL(10,2);
    v_id_proveedor INTEGER;
    v_cantidad_a_pedir DECIMAL(10,2);
    v_existe_orden BOOLEAN;
    v_nombre_insumo VARCHAR(100);
BEGIN
    -- Solo verificar en salidas de inventario
    IF NEW.tipo_movimiento IN ('salida_venta', 'salida_ajuste', 'perdida') THEN
        
        -- Obtener stock actual y límites
        SELECT 
            fn_obtener_stock_actual(NEW.id_insumo),
            i.stock_minimo,
            i.stock_maximo,
            i.id_proveedor_principal,
            i.nombre_insumo
        INTO 
            v_stock_actual,
            v_stock_minimo,
            v_stock_maximo,
            v_id_proveedor,
            v_nombre_insumo
        FROM insumo i
        WHERE i.id_insumo = NEW.id_insumo;
        
        -- Si el stock llegó al mínimo o menos
        IF v_stock_actual <= v_stock_minimo AND v_id_proveedor IS NOT NULL THEN
            
            -- Verificar si ya existe una orden pendiente para este insumo
            SELECT EXISTS (
                SELECT 1 
                FROM orden_compra oc
                JOIN detalle_orden_compra doc ON oc.id_orden = doc.id_orden
                WHERE doc.id_insumo = NEW.id_insumo
                AND oc.estado IN ('pendiente', 'aprobada')
                AND oc.fecha_orden > CURRENT_TIMESTAMP - INTERVAL '7 days'
            ) INTO v_existe_orden;
            
            -- Si no hay orden pendiente, crear una nueva
            IF NOT v_existe_orden THEN
                v_cantidad_a_pedir := v_stock_maximo - v_stock_actual;
                
                -- Generar orden automática
                PERFORM fn_generar_orden_automatica(NEW.id_insumo, v_cantidad_a_pedir);
                
                -- Log del evento (opcional)
                RAISE NOTICE 'Orden automática generada para: % (Stock actual: %, Mínimo: %)', 
                    v_nombre_insumo, v_stock_actual, v_stock_minimo;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- FUNCIONES PARA ACTUALIZAR ÚLTIMA COMPRA DEL CLIENTE
-- ===============================================================

-- FUNCIÓN PARA ACTUALIZAR ÚLTIMA COMPRA AL CONFIRMAR VENTA
CREATE OR REPLACE FUNCTION fn_actualizar_ultima_compra_cliente()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar cuando la venta se confirma o completa
    IF NEW.estado IN ('confirmada', 'completada') AND 
       OLD.estado NOT IN ('confirmada', 'completada') AND 
       NEW.id_cliente IS NOT NULL THEN
        
        UPDATE cliente 
        SET ultima_compra = NEW.fecha_venta
        WHERE id_cliente = NEW.id_cliente;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- FUNCIONES DE REPORTES DEL NEGOCIO
-- ===============================================================

-- FUNCIÓN PARA OBTENER RESUMEN DIARIO (Ventas vs Compras)
CREATE OR REPLACE FUNCTION fn_resumen_diario(
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE(
    fecha DATE,
    dia_semana VARCHAR(20),
    total_ventas DECIMAL(12,2),
    total_compras DECIMAL(12,2),
    diferencia DECIMAL(12,2),
    cantidad_ventas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH ventas_diarias AS (
        SELECT 
            DATE(v.fecha_venta) as fecha,
            SUM(v.total_venta) as ventas,
            COUNT(v.id_venta) as cant_ventas
        FROM venta v
        WHERE v.estado IN ('confirmada', 'completada')
        AND DATE(v.fecha_venta) BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY DATE(v.fecha_venta)
    ),
    compras_diarias AS (
        SELECT 
            g.fecha_gasto as fecha,
            SUM(g.monto) as compras
        FROM gasto_operativo g
        WHERE g.fecha_gasto BETWEEN p_fecha_desde AND p_fecha_hasta
        GROUP BY g.fecha_gasto
    ),
    fechas_rango AS (
        SELECT generate_series(p_fecha_desde, p_fecha_hasta, '1 day'::interval)::DATE as fecha
    )
    SELECT 
        f.fecha,
        TO_CHAR(f.fecha, 'Day') as dia_semana,
        COALESCE(vd.ventas, 0) as total_ventas,
        COALESCE(cd.compras, 0) as total_compras,
        COALESCE(vd.ventas, 0) - COALESCE(cd.compras, 0) as diferencia,
        COALESCE(vd.cant_ventas, 0)::INTEGER as cantidad_ventas
    FROM fechas_rango f
    LEFT JOIN ventas_diarias vd ON f.fecha = vd.fecha
    LEFT JOIN compras_diarias cd ON f.fecha = cd.fecha
    ORDER BY f.fecha;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER VENTAS DETALLADAS POR FECHA
CREATE OR REPLACE FUNCTION fn_reporte_ventas(
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE(
    fecha TIMESTAMP,
    ticket INTEGER,
    cantidad DECIMAL(10,2),
    articulo VARCHAR(100),
    sub_articulo VARCHAR(100),
    costo DECIMAL(10,2),
    precio DECIMAL(10,2),
    total DECIMAL(12,2),
    ganancia DECIMAL(12,2),
    tipo_pago VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.fecha_venta,
        v.id_venta as ticket,
        dv.cantidad,
        p.nombre_producto,
        COALESCE(pv.nombre_variante, '') as sub_articulo,
        dv.costo_unitario,
        dv.precio_unitario,
        dv.subtotal,
        dv.ganancia,
        v.tipo_pago
    FROM venta v
    JOIN detalle_venta dv ON v.id_venta = dv.id_venta
    JOIN producto p ON dv.id_producto = p.id_producto
    LEFT JOIN producto_variante pv ON dv.id_variante = pv.id_variante
    WHERE v.estado IN ('confirmada', 'completada')
    AND DATE(v.fecha_venta) BETWEEN p_fecha_desde AND p_fecha_hasta
    ORDER BY v.fecha_venta, v.id_venta;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER DEPÓSITOS BANCARIOS POR PERÍODO
CREATE OR REPLACE FUNCTION fn_reporte_depositos(
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE(
    fecha TIMESTAMP,
    descripcion TEXT,
    tipo_pago VARCHAR(20),
    monto DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        db.fecha_deposito,
        db.descripcion,
        db.tipo_pago,
        db.monto
    FROM deposito_banco db
    WHERE DATE(db.fecha_deposito) BETWEEN p_fecha_desde AND p_fecha_hasta
    ORDER BY db.fecha_deposito;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER MOVIMIENTOS/GASTOS POR PERÍODO
CREATE OR REPLACE FUNCTION fn_reporte_movimientos(
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE(
    fecha DATE,
    detalle TEXT,
    categoria VARCHAR(50),
    monto DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.fecha_gasto,
        g.detalle,
        COALESCE(cg.nombre, 'Sin categoría'),
        g.monto
    FROM gasto_operativo g
    LEFT JOIN categoria_gasto cg ON g.id_categoria = cg.id_categoria
    WHERE g.fecha_gasto BETWEEN p_fecha_desde AND p_fecha_hasta
    ORDER BY g.fecha_gasto;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- FUNCIÓN KARDEX (Reporte de Movimientos de Inventario)
-- ===============================================================

CREATE OR REPLACE FUNCTION fn_kardex_insumo(
    p_id_insumo INTEGER,
    p_fecha_desde DATE DEFAULT NULL,
    p_fecha_hasta DATE DEFAULT NULL
)
RETURNS TABLE(
    fecha TIMESTAMP,
    tipo_movimiento VARCHAR(20),
    referencia VARCHAR(100),
    entrada DECIMAL(10,2),
    salida DECIMAL(10,2),
    saldo DECIMAL(10,2),
    costo_unitario DECIMAL(10,2),
    valor_total DECIMAL(12,2),
    usuario VARCHAR(100),
    descripcion TEXT
) AS $$
DECLARE
    v_saldo_actual DECIMAL(10,2) := 0;
    v_fecha_desde DATE;
    v_fecha_hasta DATE;
BEGIN
    -- Establecer fechas por defecto si no se proporcionan
    v_fecha_desde := COALESCE(p_fecha_desde, CURRENT_DATE - INTERVAL '30 days');
    v_fecha_hasta := COALESCE(p_fecha_hasta, CURRENT_DATE);
    
    RETURN QUERY
    WITH movimientos_ordenados AS (
        SELECT 
            mi.fecha_movimiento,
            mi.tipo_movimiento,
            CASE 
                WHEN mi.tipo_movimiento IN ('entrada_compra', 'salida_venta') THEN 
                    CAST('Ref: #' || COALESCE(mi.id_referencia::TEXT, 'N/A') AS VARCHAR(100))
                ELSE 
                    CAST('Ajuste manual' AS VARCHAR(100))
            END as referencia,
            CASE 
                WHEN mi.tipo_movimiento IN ('entrada_compra', 'entrada_ajuste', 'devolucion') THEN mi.cantidad
                ELSE 0
            END as entrada,
            CASE 
                WHEN mi.tipo_movimiento IN ('salida_venta', 'salida_ajuste', 'perdida') THEN mi.cantidad
                ELSE 0
            END as salida,
            mi.costo_unitario_momento,
            CAST(CONCAT(pu.primer_nombre, ' ', pu.primer_apellido) AS VARCHAR(100) ) as usuario_nombre,
            mi.descripcion
        FROM movimiento_inventario mi
        LEFT JOIN perfil_usuario pu ON mi.id_perfil = pu.id_perfil
        WHERE mi.id_insumo = p_id_insumo
        AND DATE(mi.fecha_movimiento) BETWEEN v_fecha_desde AND v_fecha_hasta
        ORDER BY mi.fecha_movimiento ASC, mi.id_movimiento ASC
    )
    SELECT 
        mo.fecha_movimiento,
        mo.tipo_movimiento,
        mo.referencia,
        mo.entrada,
        mo.salida,
        -- Calcular saldo acumulado
        SUM(mo.entrada - mo.salida) OVER (ORDER BY mo.fecha_movimiento, mo.referencia ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as saldo,
        mo.costo_unitario_momento,
        (mo.entrada + mo.salida) * mo.costo_unitario_momento as valor_total,
        mo.usuario_nombre,
        mo.descripcion
    FROM movimientos_ordenados mo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================================
-- VISTA: vw_kardex
-- ===============================================================
CREATE OR REPLACE VIEW vw_kardex AS
SELECT 
    mi.id_movimiento,
    mi.fecha_movimiento,
    mi.tipo_movimiento,
    mi.id_lote,
    mi.cantidad,
    mi.costo_unitario_momento AS costo_unitario_real,
    (mi.cantidad * mi.costo_unitario_momento) AS costo_total,
    l.ubicacion,
    i.nombre_insumo,
    i.unidad_base
FROM movimiento_inventario mi
LEFT JOIN lote_insumo l ON mi.id_lote = l.id_lote
LEFT JOIN insumo i ON mi.id_insumo = i.id_insumo;

-- ===============================================================
-- TRIGGERS CRÍTICOS
-- ===============================================================

-- TRIGGER PARA RECALCULAR EL COSTO PROMEDIO ANTES de registrar la entrada de inventario
CREATE TRIGGER trg_recalcular_costo_antes_de_recepcion
BEFORE INSERT ON detalle_recepcion_mercaderia
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_costo_promedio();

-- ===============================================================
-- MÓDULO: Stored Procedures (SP) - Transacciones Complejas
-- ===============================================================

-- SP PARA PROCESAR VENTA COMPLETA (con manejo de transacciones)
CREATE OR REPLACE FUNCTION sp_procesar_venta(
    p_id_cliente INTEGER,
    p_tipo_pago VARCHAR(20),
    p_id_cajero INTEGER,
    p_productos JSONB, -- Array: [{"id_producto": 1, "id_variante": 2, "cantidad": 3}]
    p_canjear_puntos BOOLEAN DEFAULT FALSE,
    p_id_producto_gratis INTEGER DEFAULT NULL
)
RETURNS TABLE(
    exito BOOLEAN,
    id_venta INTEGER,
    total_venta DECIMAL(12,2),
    total_costo DECIMAL(12,2),
    ganancia DECIMAL(12,2),
    puntos_ganados INTEGER,
    puntos_canjeados INTEGER,
    puntos_restantes INTEGER,
    mensaje TEXT
) AS $$
DECLARE
    v_id_venta INTEGER;
    v_total DECIMAL(12,2);
    v_costo DECIMAL(12,2);
    v_ganancia DECIMAL(12,2);
    v_puntos_antes INTEGER;
    v_puntos_despues INTEGER;
    v_producto JSONB;
    v_canje_result RECORD;
BEGIN
    -- Obtener puntos actuales del cliente
    SELECT COALESCE(puntos_acumulados, 0) INTO v_puntos_antes
    FROM cliente WHERE id_cliente = p_id_cliente;
    
    -- 1. Crear venta
    INSERT INTO venta (id_cliente, tipo_pago, estado, id_cajero)
    VALUES (p_id_cliente, p_tipo_pago, 'pendiente', p_id_cajero)
    RETURNING venta.id_venta INTO v_id_venta;
    
    -- 2. Canjear puntos si se solicitó
    IF p_canjear_puntos AND p_id_producto_gratis IS NOT NULL THEN
        -- Validar y canjear puntos
        SELECT * INTO v_canje_result FROM fn_canjear_puntos(p_id_cliente, v_id_venta, p_id_cajero);
        
        IF NOT v_canje_result.exito THEN
            -- Si falla el canje, abortar transacción
            RETURN QUERY SELECT 
                FALSE,
                NULL::INTEGER,
                0::DECIMAL(12,2),
                0::DECIMAL(12,2),
                0::DECIMAL(12,2),
                0, 0,
                v_puntos_antes,
                'Error al canjear puntos: ' || v_canje_result.mensaje;
            RETURN;
        END IF;
        
        -- Agregar producto gratis
        INSERT INTO detalle_venta (
            id_venta, 
            id_producto, 
            cantidad, 
            precio_unitario,
            costo_unitario,
            es_canje_puntos,
            puntos_canjeados
        ) SELECT 
            v_id_venta,
            p_id_producto_gratis,
            1,
            0.00,
            p.costo_producto,
            TRUE,
            10
        FROM producto p WHERE p.id_producto = p_id_producto_gratis;
    END IF;
    
    -- 3. Agregar productos normales
    FOR v_producto IN SELECT * FROM jsonb_array_elements(p_productos)
    LOOP
        INSERT INTO detalle_venta (
            id_venta, 
            id_producto, 
            id_variante,
            cantidad
        ) VALUES (
            v_id_venta,
            (v_producto->>'id_producto')::INTEGER,
            CASE 
                WHEN v_producto->>'id_variante' IS NOT NULL 
                THEN (v_producto->>'id_variante')::INTEGER 
                ELSE NULL 
            END,
            (v_producto->>'cantidad')::DECIMAL(10,2)
        );
    END LOOP;
    
    -- 4. Confirmar venta (esto dispara todos los triggers automáticos)
    UPDATE venta SET estado = 'confirmada' WHERE venta.id_venta = v_id_venta;
    
    -- 5. Obtener totales finales
    SELECT venta.total_venta, venta.total_costo, venta.ganancia 
    INTO v_total, v_costo, v_ganancia
    FROM venta WHERE venta.id_venta = v_id_venta;
    
    -- 6. Obtener puntos finales
    SELECT COALESCE(puntos_acumulados, 0) INTO v_puntos_despues
    FROM cliente WHERE id_cliente = p_id_cliente;
    
    -- Retornar resultado exitoso
    RETURN QUERY SELECT 
        TRUE,
        v_id_venta,
        v_total,
        v_costo,
        v_ganancia,
        (v_puntos_despues - v_puntos_antes + CASE WHEN p_canjear_puntos THEN 10 ELSE 0 END)::INTEGER,
        CASE WHEN p_canjear_puntos THEN 10 ELSE 0 END,
        v_puntos_despues,
        'Venta procesada exitosamente. Ticket #' || v_id_venta::TEXT;
        
EXCEPTION WHEN OTHERS THEN
    -- Si ocurre cualquier error, PostgreSQL hace rollback automático
    RETURN QUERY SELECT 
        FALSE,
        NULL::INTEGER,
        0::DECIMAL(12,2),
        0::DECIMAL(12,2),
        0::DECIMAL(12,2),
        0, 0,
        v_puntos_antes,
        'Error al procesar venta: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- SP PARA RECEPCIONAR MERCADERÍA (con actualización automática de inventario)
-- ✅ VERSIÓN CORREGIDA - Usa id_detalle_orden en lugar de id_insumo
CREATE OR REPLACE FUNCTION sp_recepcionar_mercaderia(
    p_id_orden INTEGER,
    p_id_perfil INTEGER,
    p_detalles JSONB -- Array: [{"id_detalle_orden": 1, "cantidad_recibida": 10, "cantidad_aceptada": 9, "cantidad_rechazada": 1, "motivo_rechazo": "Dañados", "fecha_vencimiento": "2025-12-31"}]
)
RETURNS TABLE(
    exito BOOLEAN,
    id_recepcion INTEGER,
    insumos_procesados INTEGER,
    mensaje TEXT
) AS $$
DECLARE
    v_id_recepcion INTEGER;
    v_contador INTEGER := 0;
    v_detalle JSONB;
    v_orden_estado VARCHAR(20);
    v_id_lote INTEGER;
    v_insumo_id INTEGER;
    v_precio_compra DECIMAL(10,2);
BEGIN
    -- Validar que la orden exista y esté en estado correcto
    SELECT estado INTO v_orden_estado
    FROM orden_compra WHERE id_orden = p_id_orden;
    
    IF v_orden_estado IS NULL THEN
        RETURN QUERY SELECT 
            FALSE,
            NULL::INTEGER,
            0,
            'Error: Orden de compra no encontrada';
        RETURN;
    END IF;
    
    IF v_orden_estado NOT IN ('pendiente', 'aprobada') THEN
        RETURN QUERY SELECT 
            FALSE,
            NULL::INTEGER,
            0,
            'Error: La orden ya fue recibida o está cancelada';
        RETURN;
    END IF;
    
    -- 1. Crear registro de recepción
    INSERT INTO recepcion_mercaderia (id_orden, id_perfil)
    VALUES (p_id_orden, p_id_perfil)
    RETURNING recepcion_mercaderia.id_recepcion INTO v_id_recepcion;
    
    -- 2. Procesar cada detalle de orden
    FOR v_detalle IN SELECT * FROM jsonb_array_elements(p_detalles)
    LOOP
        -- Obtener datos del detalle de orden
        SELECT doc.id_insumo, doc.precio_unitario
        INTO v_insumo_id, v_precio_compra
        FROM detalle_orden_compra doc
        WHERE doc.id_detalle = (v_detalle->>'id_detalle_orden')::INTEGER;
        
        -- Crear lote si hay fecha de vencimiento
        IF v_detalle->>'fecha_vencimiento' IS NOT NULL THEN
            INSERT INTO lote_insumo (
                id_insumo, 
                fecha_vencimiento,
                cantidad_inicial,
                cantidad_actual,
                costo_unitario
            ) VALUES (
                v_insumo_id,
                (v_detalle->>'fecha_vencimiento')::DATE,
                (v_detalle->>'cantidad_aceptada')::DECIMAL(10,2),
                (v_detalle->>'cantidad_aceptada')::DECIMAL(10,2),
                v_precio_compra
            ) RETURNING id_lote INTO v_id_lote;
        ELSE
            v_id_lote := NULL;
        END IF;
        
        -- Insertar detalle de recepción (los triggers se encargan del resto)
        INSERT INTO detalle_recepcion_mercaderia (
            id_recepcion,
            id_detalle_orden,
            cantidad_recibida,
            cantidad_aceptada,
            cantidad_rechazada,
            motivo_rechazo,
            id_lote
        ) VALUES (
            v_id_recepcion,
            (v_detalle->>'id_detalle_orden')::INTEGER,
            (v_detalle->>'cantidad_recibida')::DECIMAL(10,2),
            (v_detalle->>'cantidad_aceptada')::DECIMAL(10,2),
            COALESCE((v_detalle->>'cantidad_rechazada')::DECIMAL(10,2), 0),
            v_detalle->>'motivo_rechazo',
            v_id_lote
        );
        
        v_contador := v_contador + 1;
    END LOOP;
    
    -- 3. Actualizar estado de orden de compra
    UPDATE orden_compra 
    SET estado = 'recibida',
        fecha_recepcion = CURRENT_TIMESTAMP
    WHERE id_orden = p_id_orden;
    
    RETURN QUERY SELECT 
        TRUE,
        v_id_recepcion,
        v_contador,
        'Recepción #' || v_id_recepcion::TEXT || ' procesada: ' || v_contador::TEXT || ' insumos recibidos';
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 
        FALSE,
        NULL::INTEGER,
        0,
        'Error al recepcionar mercadería: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sp_recepcionar_mercaderia IS 'Stored Procedure CORREGIDO para recepcionar mercadería de una orden de compra. Usa id_detalle_orden en lugar de id_insumo. Procesa múltiples insumos, crea lotes, actualiza costos promedio (PPP), registra entradas en Kardex y actualiza el estado de la orden. Transacción atómica con rollback en caso de error.';

-- SP PARA CIERRE DIARIO (resumen y actualización de estados)
CREATE OR REPLACE FUNCTION sp_cierre_diario(
    p_fecha DATE DEFAULT CURRENT_DATE,
    p_id_cajero INTEGER DEFAULT NULL
)
RETURNS TABLE(
    exito BOOLEAN,
    fecha_cierre DATE,
    total_ventas DECIMAL(12,2),
    total_costos DECIMAL(12,2),
    total_ganancias DECIMAL(12,2),
    total_gastos DECIMAL(12,2),
    utilidad_neta DECIMAL(12,2),
    ventas_count INTEGER,
    clientes_atendidos INTEGER,
    puntos_acumulados_dia INTEGER,
    puntos_canjeados_dia INTEGER,
    productos_vendidos INTEGER,
    mensaje TEXT
) AS $$
DECLARE
    v_ventas DECIMAL(12,2);
    v_costos DECIMAL(12,2);
    v_ganancias DECIMAL(12,2);
    v_gastos DECIMAL(12,2);
    v_count_ventas INTEGER;
    v_count_clientes INTEGER;
    v_pts_acum INTEGER;
    v_pts_canje INTEGER;
    v_productos INTEGER;
BEGIN
    -- Obtener resumen de ventas
    SELECT 
        COALESCE(SUM(total_venta), 0),
        COALESCE(SUM(total_costo), 0),
        COALESCE(SUM(ganancia), 0),
        COUNT(*),
        COUNT(DISTINCT id_cliente)
    INTO v_ventas, v_costos, v_ganancias, v_count_ventas, v_count_clientes
    FROM venta
    WHERE DATE(fecha_venta) = p_fecha
    AND estado IN ('confirmada', 'completada');
    
    -- Obtener total de gastos
    SELECT COALESCE(SUM(monto), 0)
    INTO v_gastos
    FROM gasto_operativo
    WHERE DATE(fecha_gasto) = p_fecha;
    
    -- Obtener movimiento de puntos del día
    SELECT 
        COALESCE(SUM(CASE WHEN puntos_movimiento > 0 THEN puntos_movimiento ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN puntos_movimiento < 0 THEN ABS(puntos_movimiento) ELSE 0 END), 0)
    INTO v_pts_acum, v_pts_canje
    FROM historial_puntos
    WHERE DATE(fecha_movimiento) = p_fecha;
    
    -- Contar productos vendidos
    SELECT COALESCE(SUM(dv.cantidad)::INTEGER, 0)
    INTO v_productos
    FROM detalle_venta dv
    JOIN venta v ON dv.id_venta = v.id_venta
    WHERE DATE(v.fecha_venta) = p_fecha
    AND v.estado IN ('confirmada', 'completada');
    
    -- Marcar todas las ventas del día como completadas
    UPDATE venta
    SET estado = 'completada'
    WHERE DATE(fecha_venta) = p_fecha
    AND estado = 'confirmada';
    
    RETURN QUERY SELECT
        TRUE,
        p_fecha,
        v_ventas,
        v_costos,
        v_ganancias,
        v_gastos,
        v_ganancias - v_gastos,
        v_count_ventas,
        v_count_clientes,
        v_pts_acum,
        v_pts_canje,
        v_productos,
        'Cierre diario completado. Ventas: Q' || v_ventas::TEXT || ', Utilidad neta: Q' || (v_ganancias - v_gastos)::TEXT;
        
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
        FALSE,
        p_fecha,
        0::DECIMAL(12,2),
        0::DECIMAL(12,2),
        0::DECIMAL(12,2),
        0::DECIMAL(12,2),
        0::DECIMAL(12,2),
        0, 0, 0, 0, 0,
        'Error en cierre diario: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 🏆 FUNCIÓN PARA OBTENER PRODUCTOS MÁS POPULARES
-- ================================================================

-- Función que calcula los productos más vendidos en los últimos 30 días
CREATE OR REPLACE FUNCTION get_productos_populares(limit_param INTEGER DEFAULT 5)
RETURNS TABLE (
    id_producto INTEGER,
    nombre_producto VARCHAR(100),
    total_vendido DECIMAL(10,2),
    veces_vendido BIGINT,
    categoria VARCHAR(50),
    imagen_url VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id_producto,
        p.nombre_producto,
        COALESCE(SUM(dv.cantidad), 0)::DECIMAL(10,2) as total_vendido,
        COUNT(DISTINCT v.id_venta)::BIGINT as veces_vendido,
        COALESCE(cp.nombre, 'Producto') as categoria,
        p.imagen_url
    FROM producto p
    LEFT JOIN detalle_venta dv ON p.id_producto = dv.id_producto
    LEFT JOIN venta v ON dv.id_venta = v.id_venta
    LEFT JOIN categoria_producto cp ON p.id_categoria = cp.id_categoria
    WHERE v.estado IN ('confirmada', 'completada')
    AND v.fecha_venta >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY p.id_producto, p.nombre_producto, cp.nombre, p.imagen_url
    HAVING COALESCE(SUM(dv.cantidad), 0) > 0
    ORDER BY total_vendido DESC, veces_vendido DESC
    LIMIT limit_param;
END;
$$;

-- ===============================================================
-- MÓDULO: Triggers (Automatización)
-- ===============================================================

-- TRIGGER PARA REGISTRAR LA ENTRADA DE INVENTARIO DESPUÉS de registrar la recepción
CREATE TRIGGER trg_registrar_entrada_despues_de_recepcion
AFTER INSERT ON detalle_recepcion_mercaderia
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_entrada_por_compra();

-- TRIGGER PARA CALCULAR PRECIO Y COSTO ANTES de insertar detalle de venta
CREATE TRIGGER trg_calcular_precio_costo_venta
BEFORE INSERT OR UPDATE ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION fn_calcular_precio_costo_venta();

-- TRIGGER PARA ACTUALIZAR TOTALES DE VENTA
CREATE TRIGGER trg_actualizar_totales_venta_insert
AFTER INSERT ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_totales_venta();

CREATE TRIGGER trg_actualizar_totales_venta_update
AFTER UPDATE ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_totales_venta();

CREATE TRIGGER trg_actualizar_totales_venta_delete
AFTER DELETE ON detalle_venta
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_totales_venta();

-- TRIGGER PARA ACUMULAR PUNTOS AUTOMÁTICAMENTE AL CONFIRMAR VENTA
CREATE TRIGGER trg_acumular_puntos_venta
AFTER UPDATE ON venta
FOR EACH ROW
WHEN (OLD.estado != 'confirmada' AND NEW.estado = 'confirmada')
EXECUTE FUNCTION fn_acumular_puntos_venta();

-- TRIGGER PARA AUTOMATIZAR LA SALIDA DE INVENTARIO al confirmar una venta
CREATE TRIGGER trg_descontar_inventario_al_confirmar
AFTER UPDATE ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_manejar_confirmacion_venta();

-- TRIGGER PARA VERIFICAR QUE HAYA STOCK DISPONIBLE ANTES de confirmar la venta
CREATE TRIGGER trg_verificar_stock_antes_de_confirmar
BEFORE UPDATE ON venta
FOR EACH ROW
WHEN (NEW.estado IN ('confirmada', 'completada') AND OLD.estado NOT IN ('confirmada', 'completada'))
EXECUTE FUNCTION fn_verificar_stock_venta();

-- ===============================================================
-- TRIGGERS PARA REPOSICIÓN AUTOMÁTICA
-- ===============================================================

-- TRIGGER PARA DETECTAR STOCK BAJO Y GENERAR ORDEN AUTOMÁTICA
CREATE TRIGGER trg_verificar_stock_bajo
AFTER INSERT ON movimiento_inventario
FOR EACH ROW
EXECUTE FUNCTION fn_verificar_stock_bajo_trigger();

-- TRIGGER PARA ACTUALIZAR ÚLTIMA COMPRA DEL CLIENTE
CREATE TRIGGER trg_actualizar_ultima_compra
AFTER UPDATE ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_ultima_compra_cliente();

-- ===============================================================
-- FUNCIONES TRIGGER PARA BITÁCORAS AUTOMÁTICAS
-- ===============================================================

-- TRIGGERS PARA BITÁCORA DE INVENTARIO (INSUMOS)
CREATE TRIGGER trg_bitacora_insumo_insert
AFTER INSERT ON insumo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_insumo();

CREATE TRIGGER trg_bitacora_insumo_update
AFTER UPDATE ON insumo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_insumo();

CREATE TRIGGER trg_bitacora_insumo_delete
AFTER DELETE ON insumo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_insumo();

-- TRIGGER PARA BITÁCORA DE MOVIMIENTOS DE INVENTARIO
CREATE TRIGGER trg_bitacora_movimiento_inventario
AFTER INSERT ON movimiento_inventario
FOR EACH ROW
WHEN (NEW.tipo_movimiento IN ('entrada_ajuste', 'salida_ajuste'))
EXECUTE FUNCTION fn_bitacora_movimiento_inventario();

-- TRIGGERS PARA BITÁCORA DE PRODUCTOS
CREATE TRIGGER trg_bitacora_producto_insert
AFTER INSERT ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_producto();

CREATE TRIGGER trg_bitacora_producto_update
AFTER UPDATE ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_producto();

CREATE TRIGGER trg_bitacora_producto_delete
AFTER DELETE ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_producto();

-- TRIGGERS PARA BITÁCORA DE RECETAS
CREATE TRIGGER trg_bitacora_receta_insert
AFTER INSERT ON receta_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_receta();

CREATE TRIGGER trg_bitacora_receta_update
AFTER UPDATE ON receta_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_receta();

CREATE TRIGGER trg_bitacora_receta_delete
AFTER DELETE ON receta_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_receta();

-- TRIGGERS PARA BITÁCORA DE VENTAS
CREATE TRIGGER trg_bitacora_venta_insert
AFTER INSERT ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_venta();

CREATE TRIGGER trg_bitacora_venta_update
AFTER UPDATE ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_venta();

CREATE TRIGGER trg_bitacora_venta_delete
AFTER DELETE ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_venta();

-- TRIGGERS PARA BITÁCORA DE ÓRDENES DE COMPRA
CREATE TRIGGER trg_bitacora_orden_insert
AFTER INSERT ON orden_compra
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_orden_compra();

CREATE TRIGGER trg_bitacora_orden_update
AFTER UPDATE ON orden_compra
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_orden_compra();

CREATE TRIGGER trg_bitacora_orden_delete
AFTER DELETE ON orden_compra
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_orden_compra();

-- ===============================================================
-- TRIGGERS PARA BITÁCORA DE SEGURIDAD
-- ===============================================================

-- TRIGGER PARA VALIDAR PERMISOS ANTES DE CAMBIAR CONTRASEÑA (SOLO ADMIN/PROPIETARIO)
CREATE TRIGGER trg_validar_cambio_password
BEFORE UPDATE ON perfil_usuario
FOR EACH ROW
WHEN (OLD.password_hash IS DISTINCT FROM NEW.password_hash)
EXECUTE FUNCTION fn_validar_cambio_password();

-- TRIGGER PARA REGISTRAR CAMBIOS DE CONTRASEÑA
CREATE TRIGGER trg_registrar_cambio_password
AFTER UPDATE ON perfil_usuario
FOR EACH ROW
WHEN (OLD.password_hash IS DISTINCT FROM NEW.password_hash)
EXECUTE FUNCTION fn_registrar_cambio_password();

-- TRIGGER PARA REGISTRAR ACTUALIZACIONES DE PERFIL
CREATE TRIGGER trg_registrar_actualizacion_perfil
AFTER UPDATE ON perfil_usuario
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_actualizacion_perfil();

-- TRIGGER PARA LIMPIAR TOKENS EXPIRADOS AL CREAR NUEVO TOKEN
CREATE TRIGGER trg_limpiar_tokens_expirados
AFTER INSERT ON bitacora_seguridad
FOR EACH ROW
WHEN (NEW.token_recuperacion IS NOT NULL)
EXECUTE FUNCTION fn_limpiar_tokens_expirados();

-- ===============================================================
-- TRIGGERS PARA BITÁCORAS AUTOMÁTICAS
-- ===============================================================

-- TRIGGERS PARA BITÁCORA DE INVENTARIO (INSUMOS)
CREATE TRIGGER trg_bitacora_insumo_insert
AFTER INSERT ON insumo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_insumo();

CREATE TRIGGER trg_bitacora_insumo_update
AFTER UPDATE ON insumo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_insumo();

CREATE TRIGGER trg_bitacora_insumo_delete
AFTER DELETE ON insumo
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_insumo();

-- TRIGGER PARA BITÁCORA DE MOVIMIENTOS DE INVENTARIO
CREATE TRIGGER trg_bitacora_movimiento_inventario
AFTER INSERT ON movimiento_inventario
FOR EACH ROW
WHEN (NEW.tipo_movimiento IN ('entrada_ajuste', 'salida_ajuste'))
EXECUTE FUNCTION fn_bitacora_movimiento_inventario();

-- TRIGGERS PARA BITÁCORA DE PRODUCTOS
CREATE TRIGGER trg_bitacora_producto_insert
AFTER INSERT ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_producto();

CREATE TRIGGER trg_bitacora_producto_update
AFTER UPDATE ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_producto();

CREATE TRIGGER trg_bitacora_producto_delete
AFTER DELETE ON producto
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_producto();

-- TRIGGERS PARA BITÁCORA DE RECETAS
CREATE TRIGGER trg_bitacora_receta_insert
AFTER INSERT ON receta_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_receta();

CREATE TRIGGER trg_bitacora_receta_update
AFTER UPDATE ON receta_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_receta();

CREATE TRIGGER trg_bitacora_receta_delete
AFTER DELETE ON receta_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_receta();

-- TRIGGERS PARA BITÁCORA DE VENTAS
CREATE TRIGGER trg_bitacora_venta_insert
AFTER INSERT ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_venta();

CREATE TRIGGER trg_bitacora_venta_update
AFTER UPDATE ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_venta();

CREATE TRIGGER trg_bitacora_venta_delete
AFTER DELETE ON venta
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_venta();

-- TRIGGERS PARA BITÁCORA DE ÓRDENES DE COMPRA
CREATE TRIGGER trg_bitacora_orden_insert
AFTER INSERT ON orden_compra
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_orden_compra();

CREATE TRIGGER trg_bitacora_orden_update
AFTER UPDATE ON orden_compra
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_orden_compra();

CREATE TRIGGER trg_bitacora_orden_delete
AFTER DELETE ON orden_compra
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_orden_compra();

-- ===============================================================
-- DATOS INICIALES - TABLAS DE CATÁLOGO
-- ===============================================================

-- ROLES DE USUARIO
INSERT INTO rol_usuario (nombre_rol, descripcion, nivel_permisos, permisos) VALUES
('propietario', 'Acceso total al sistema - Dueño del negocio', 100, '{"all": true}'::jsonb),
('administrador', 'Gestión completa del negocio - Gerente general', 80, '{"ventas": {"all": true}, "inventario": {"all": true}, "compras": {"all": true}, "reportes": {"all": true}, "usuarios": {"ver": true, "crear": true, "editar": true}}'::jsonb),
('cajero', 'Operación de ventas y atención al cliente', 30, '{"ventas": {"ver": true, "crear": true}, "productos": {"ver": true}, "clientes": {"ver": true, "crear": true}}'::jsonb),
('cliente', 'Cliente del sistema - Acceso limitado', 10, '{"productos": {"ver": true}, "pedidos": {"ver": true, "crear": true}}'::jsonb)
ON CONFLICT (nombre_rol) DO NOTHING;
 
-- CATEGORÍAS DE INSUMOS
INSERT INTO categoria_insumo (nombre, descripcion, tipo_categoria) VALUES
('Carnes y Proteínas', 'Carnes, pollo, pescado y productos proteicos', 'perpetuo'),
('Vegetales y Verduras', 'Verduras frescas, lechugas, tomates, cebollas', 'perpetuo'),
('Lácteos', 'Quesos, leche, crema, mantequilla', 'perpetuo'),
('Panadería', 'Pan, tortillas, bollos y productos de panadería', 'perpetuo'),
('Condimentos y Salsas', 'Salsas, aderezos, especias y condimentos', 'operativo'),
('Bebidas', 'Refrescos, jugos, agua y bebidas alcohólicas', 'operativo'),
('Desechables', 'Vasos, platos, cubiertos, servilletas desechables', 'operativo'),
('Limpieza', 'Productos de limpieza y desinfección', 'operativo'),
('Otros', 'Insumos varios no clasificados', 'operativo')
ON CONFLICT (nombre) DO NOTHING;

-- PROVEEDORES EJEMPLO
INSERT INTO proveedor (nombre_empresa, nombre_contacto, telefono, correo, direccion, metodo_entrega) VALUES
('Distribuidora de Alimentos La Central', 'Juan Pérez', '555-1234', 'ventas@lacentral.com', 'Av. Principal #123, Zona Industrial', 'Recepcion'),
('Carnes Premium S.A.', 'María González', '555-5678', 'pedidos@carnespremium.com', 'Calle 10 #45, Sector Norte', 'Recepcion'),
('Verduras Frescas del Campo', 'Pedro Martínez', '555-9012', 'info@verdurasdelcampo.com', 'Km 5 Carretera Sur', 'Recepcion'),
('Lácteos y Derivados El Rancho', 'Ana López', '555-3456', 'contacto@lacteosrancho.com', 'Zona Franca, Bodega 7', 'Recoger en tienda'),
('Distribuidora de Bebidas RefrescoMax', 'Carlos Rodríguez', '555-7890', 'ventas@refrescomax.com', 'Av. Industrial #890', 'Recepcion'),
('Productos de Limpieza HigieneTotal', 'Laura Sánchez', '555-2345', 'pedidos@higienetotal.com', 'Calle Comercio #234', 'Recoger en tienda')
ON CONFLICT DO NOTHING;

-- CATEGORÍAS DE PRODUCTOS
INSERT INTO categoria_producto (nombre_categoria, descripcion, estado) VALUES
('Hamburguesas', 'Hamburguesas de res, pollo y mixtas', 'activo'),
('Hot Dogs', 'Hot dogs clásicos y especiales', 'activo'),
('Shucos', 'Shucos tradicionales guatemaltecos', 'activo'),
('Acompañamientos', 'Papas fritas, aros de cebolla, ensaladas', 'activo'),
('Bebidas', 'Refrescos, jugos, aguas y bebidas calientes', 'activo'),
('Postres', 'Helados, pasteles y postres variados', 'activo'),
('Combos', 'Combos y paquetes promocionales', 'activo'),
('Categoría Desactivada', 'Esta categoría no debería aparecer', 'desactivado')
ON CONFLICT (nombre_categoria) DO NOTHING;

-- CATEGORÍAS DE GASTOS
INSERT INTO categoria_gasto (nombre, descripcion, tipo_gasto) VALUES
('Materia Prima', 'Compra de insumos y materiales para producción', 'operativo'),
('Embutidos', 'Compra de carnes, salchichas, chorizo, etc.', 'operativo'),
('Panadería', 'Compra de pan, bollos, tortillas', 'operativo'),
('Vegetales', 'Compra de verduras, aguacates, tomates, etc.', 'operativo'),
('Desechables', 'Bolsas, vasos, platos, cubiertos desechables', 'operativo'),
('Condimentos', 'Aceite, sal, salsas, especias', 'operativo'),
('Servicios Públicos', 'Agua, luz, teléfono, internet', 'operativo'),
('Salarios', 'Sueldos y prestaciones del personal', 'operativo'),
('Mantenimiento', 'Reparaciones y mantenimiento de equipos', 'operativo'),
('Alquiler', 'Renta de local comercial', 'operativo'),
('Transporte', 'Gastos de combustible y transporte', 'operativo'),
('Equipo y Mobiliario', 'Compra de equipo de cocina, mesas, sillas', 'inversion'),
('Otros Gastos', 'Gastos operativos varios', 'operativo')
ON CONFLICT (nombre) DO NOTHING;

-- INSUMOS DEL NEGOCIO (basados en los productos)
INSERT INTO insumo (nombre_insumo, id_categoria, unidad_base, stock_minimo, stock_maximo, costo_promedio, activo) VALUES
-- Carnes y Proteínas (cambiado de 1 a 2)
('Carne Asada', 2, 'lb', 10, 50, 35.00, TRUE),
('Chorizo', 2, 'lb', 10, 40, 25.00, TRUE),
('Salami', 2, 'lb', 10, 40, 22.00, TRUE),
('Longaniza', 2, 'lb', 10, 40, 23.00, TRUE),
('Carne Adobada', 2, 'lb', 10, 50, 32.00, TRUE),
('Salchicha', 2, 'lb', 10, 40, 20.00, TRUE),
('Pollo (carne)', 2, 'lb', 15, 60, 18.00, TRUE),
('Tocino/Bacon', 2, 'lb', 5, 30, 45.00, TRUE),
('Carne Molida para Hamburguesa', 2, 'lb', 15, 60, 28.00, TRUE),
('Pollo Frito (piezas)', 2, 'pza', 20, 100, 5.00, TRUE),

-- Vegetales y Verduras (cambiado de 2 a 1)
('Lechuga', 1, 'unidad', 5, 30, 8.00, TRUE),
('Tomate', 1, 'lb', 5, 30, 5.00, TRUE),
('Cebolla', 1, 'lb', 5, 30, 4.00, TRUE),
('Aguacate', 1, 'unidad', 10, 50, 4.00, TRUE),
('Repollo', 1, 'unidad', 3, 20, 6.00, TRUE),

-- Lácteos
('Queso', 3, 'lb', 5, 30, 35.00, TRUE),

-- Panadería
('Pan para Shuco', 4, 'unidad', 30, 150, 1.50, TRUE),
('Pan para Hamburguesa', 4, 'unidad', 30, 150, 2.00, TRUE),

-- Condimentos y Salsas (OPERATIVOS)
('Salsa de Tomate', 5, 'botella', 5, 30, 15.00, TRUE),
('Mayonesa', 5, 'frasco', 5, 30, 25.00, TRUE),
('Mostaza', 5, 'frasco', 5, 30, 18.00, TRUE),
('Salsa Inglesa', 5, 'botella', 3, 20, 20.00, TRUE),
('Aceite', 5, 'litro', 5, 30, 35.00, TRUE),
('Sal', 5, 'lb', 3, 20, 5.00, TRUE),
('Especies y Condimentos', 5, 'paquete', 5, 30, 15.00, TRUE),

-- Bebidas (OPERATIVOS)
('Coca Cola', 6, 'unidad', 20, 100, 4.30, TRUE),
('Pepsi Cola', 6, 'unidad', 20, 100, 3.80, TRUE),

-- Acompañamientos (cambiado de 2 a 1)
('Papa para Freír', 1, 'lb', 20, 100, 8.00, TRUE),

-- Desechables (OPERATIVOS)
('Bolsas Plásticas', 7, 'paquete', 5, 30, 25.00, TRUE),
('Vasos Desechables', 7, 'paquete', 3, 20, 30.00, TRUE),
('Platos Desechables', 7, 'paquete', 3, 20, 35.00, TRUE),
('Servilletas', 7, 'paquete', 5, 30, 15.00, TRUE)
ON CONFLICT DO NOTHING;

-- PRODUCTOS DEL MENÚ
INSERT INTO producto (nombre_producto, costo_producto, precio_venta, id_categoria, estado) VALUES
-- Shucos
('Shuco de Asada', 9.75, 15.00, 3, 'activo'),
('Shuco de Chorizo', 6.08, 12.00, 3, 'activo'),
('Shuco de Salami', 6.08, 12.00, 3, 'activo'),
('Shuco de Longaniza', 6.08, 12.00, 3, 'activo'),
('Shuco de Adobado', 8.75, 15.00, 3, 'activo'),
('Shuco de Salchicha', 8.75, 12.00, 3, 'activo'),
('Shuco Mixto', 10.75, 18.00, 3, 'activo'),

-- Hamburguesas
('McPatatas', 10.00, 15.00, 1, 'activo'),
('Pollo Burguer', 8.00, 15.00, 1, 'activo'),
('Cheesse Burger', 8.00, 15.00, 1, 'activo'),
('Torito', 11.00, 20.00, 1, 'activo'),
('Double Cheesse Burger', 10.50, 20.00, 1, 'activo'),
('Bacon Burger', 13.00, 20.00, 1, 'activo'),
('Torito Bacon Burguer', 15.00, 25.00, 1, 'activo'),

-- Gringas
('Gringa Adobada', 10.00, 20.00, 3, 'activo'),
('Gringa Asada', 10.00, 20.00, 3, 'activo'),
('Gringa Mixta', 15.00, 20.00, 3, 'activo'),

-- Acompañamientos
('Salchipapas', 14.00, 20.00, 4, 'activo'),
('French Fries', 9.00, 15.00, 4, 'activo'),

-- Bebidas
('Coca Cola', 4.30, 6.00, 5, 'activo'),
('Pepsi Cola', 3.80, 5.00, 5, 'activo'),

-- Pollo
('Cuadril de Pollo', 6.66, 10.00, 1, 'activo'),
('Pollo Frito con Papitas', 9.16, 18.00, 1, 'activo'),
('2 Pollo Frito Con Papitas Fritas', 15.00, 27.00, 1, 'activo'),
('Pierna de Pollo', 5.00, 9.00, 1, 'activo')
ON CONFLICT DO NOTHING;

-- VARIANTES DE PRODUCTOS (Sub-artículos)
-- Ejemplo: Shuco de Adobado puede tener variante "Longaniza" o "Salami"
INSERT INTO producto_variante (id_producto, nombre_variante, costo_variante, precio_variante, estado) VALUES
-- Variantes para Shuco de Adobado (id_producto 5)
(5, 'Longaniza', 1.50, 3.00, 'activo'),
(5, 'Salami', 1.50, 3.00, 'activo'),
(5, 'Chorizo', 1.50, 3.00, 'activo'),

-- Variantes para Shuco Mixto (id_producto 7)
(7, 'Asada + Chorizo', 0.00, 0.00, 'activo'),
(7, 'Adobado + Longaniza', 0.00, 0.00, 'activo'),

-- Variantes para hamburguesas (tamaño o adicionales)
(10, 'Extra Queso', 1.50, 2.00, 'activo'),
(11, 'Extra Queso', 1.50, 2.00, 'activo'),
(12, 'Extra Queso', 1.50, 2.00, 'activo')
ON CONFLICT DO NOTHING;

-- ===============================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- ===============================================================
COMMENT ON TABLE perfil_usuario IS 'Tabla principal de usuarios con autenticación independiente. El hash de contraseña debe generarse en el backend.';
COMMENT ON COLUMN perfil_usuario.password_hash IS 'Hash de contraseña generado en el backend usando bcrypt o argon2. NUNCA almacenar contraseñas en texto plano. IMPORTANTE: Solo usuarios con rol "administrador" o "propietario" pueden modificar contraseñas (validado por trigger).';
COMMENT ON COLUMN perfil_usuario.id_rol IS 'Rol único asignado al usuario. Define permisos y nivel de acceso. Valores: cliente, cajero, administrador, propietario.';

COMMENT ON TABLE bitacora_seguridad IS 'Registro de eventos de seguridad, intentos de login, cambios de contraseña y tokens de recuperación.';
COMMENT ON COLUMN bitacora_seguridad.intentos_fallidos IS 'Contador de intentos fallidos de login. Se resetea al login exitoso.';
COMMENT ON COLUMN bitacora_seguridad.bloqueado_hasta IS 'Fecha hasta la cual la cuenta está bloqueada por múltiples intentos fallidos.';
COMMENT ON COLUMN bitacora_seguridad.token_recuperacion IS 'Token único para recuperación de contraseña. Debe ser invalidado después de su uso.';
COMMENT ON COLUMN bitacora_seguridad.tipo_evento IS 'Tipo de evento de seguridad registrado para auditoría.';

COMMENT ON COLUMN rol_usuario.nombre_rol IS 'Nombre del rol. Valores permitidos: cliente, cajero, administrador, propietario.';
COMMENT ON COLUMN rol_usuario.nivel_permisos IS 'Nivel numérico de permisos: 10=cliente, 30=cajero, 80=administrador, 100=propietario.';
COMMENT ON COLUMN rol_usuario.permisos IS 'Permisos granulares en formato JSON. Permite definir accesos específicos por módulo y acción.';

COMMENT ON TABLE orden_compra IS 'Órdenes de compra manuales y automáticas. El sistema genera órdenes automáticamente cuando un insumo llega a su stock mínimo.';
COMMENT ON COLUMN orden_compra.tipo_orden IS 'Tipo de orden: "manual" (creada por usuario) o "automatica" (generada por el sistema al detectar stock bajo).';
COMMENT ON COLUMN orden_compra.motivo_generacion IS 'Razón por la que se generó la orden automática (ej: "Stock bajo detectado para Harina de trigo"). Solo aplica para órdenes automáticas.';
COMMENT ON COLUMN orden_compra.creado_por IS 'Usuario que creó la orden manualmente. NULL para órdenes automáticas (generadas por el sistema).';
COMMENT ON COLUMN orden_compra.aprobado_por IS 'Usuario que aprobó la orden (tanto para manuales como automáticas).';

COMMENT ON TABLE insumo IS 'Catálogo de insumos. El sistema monitorea automáticamente el stock y genera órdenes de compra cuando alcanza el stock_minimo.';
COMMENT ON COLUMN insumo.stock_minimo IS 'Nivel mínimo de stock. Cuando se alcanza, el sistema genera automáticamente una orden de compra.';
COMMENT ON COLUMN insumo.stock_maximo IS 'Nivel máximo de stock. Las órdenes automáticas se calculan para llegar a este nivel.';

COMMENT ON TABLE categoria_insumo IS 'Categorías de insumos con dos tipos: PERPETUO (carnes, vegetales, lácteos, panadería - se descuentan al recibir compra) y OPERATIVO (condimentos, salsas, desechables - se descuentan automáticamente en ventas).';
COMMENT ON COLUMN categoria_insumo.tipo_categoria IS 'PERPETUO: Inventario controlado por compras/recepciones. OPERATIVO: Inventario que se descuenta automáticamente en cada venta.';

COMMENT ON TABLE movimiento_inventario IS 'Registro de todos los movimientos de inventario. Cada entrada/salida genera un registro que aparece en el Kardex.';
COMMENT ON COLUMN movimiento_inventario.tipo_movimiento IS 'Tipo de movimiento: entrada_compra (recepciones), salida_venta (ventas de operativos), entrada_ajuste, salida_ajuste, perdida, devolucion.';
COMMENT ON COLUMN movimiento_inventario.costo_unitario_momento IS 'Costo unitario del insumo al momento del movimiento. Usado para calcular valor de inventario en Kardex.';

COMMENT ON TABLE venta IS 'Registro de ventas del negocio. El id_venta funciona como número de ticket/factura.';
COMMENT ON COLUMN venta.id_venta IS 'ID único de la venta. Este valor se usa como número de ticket/factura en reportes y arqueos de caja.';
COMMENT ON COLUMN venta.tipo_pago IS 'Método de pago utilizado: Cash (efectivo), Paggo (pago digital), Tarjeta (tarjeta de crédito/débito), Transferencia.';
COMMENT ON COLUMN venta.ganancia IS 'Ganancia de la venta (total_venta - total_costo). Calculada automáticamente como GENERATED COLUMN.';

COMMENT ON TABLE historial_puntos IS 'Historial de todos los movimientos de puntos de lealtad: acumulación por compras, canjes por productos gratis, ajustes manuales y expiraciones.';
COMMENT ON COLUMN historial_puntos.tipo_movimiento IS 'Tipo de movimiento: acumulacion (compra de productos), canje (10 puntos = 1 producto gratis), ajuste (corrección manual), expiracion (puntos vencidos).';
COMMENT ON COLUMN historial_puntos.puntos_movimiento IS 'Cantidad de puntos del movimiento. Positivo para acumulación, negativo para canje o expiración.';

COMMENT ON TABLE detalle_venta IS 'Detalle de productos vendidos. Incluye soporte para canjes de puntos (productos gratis).';
COMMENT ON COLUMN detalle_venta.es_canje_puntos IS 'TRUE si el producto es gratis por canje de 10 puntos de lealtad.';
COMMENT ON COLUMN detalle_venta.puntos_canjeados IS 'Cantidad de puntos canjeados para obtener este producto gratis (normalmente 10).';

COMMENT ON TABLE cliente IS 'Clientes del negocio. Incluye sistema de puntos de lealtad: 1 punto por producto comprado, 10 puntos = 1 producto gratis.';
COMMENT ON COLUMN cliente.puntos_acumulados IS 'Puntos de lealtad acumulados. 1 punto = 1 producto comprado. 10 puntos = 1 producto gratis.';

COMMENT ON FUNCTION fn_acumular_puntos_venta IS 'Acumula automáticamente puntos de lealtad al confirmar una venta. 1 punto por cada producto NO canjeado.';
COMMENT ON FUNCTION fn_canjear_puntos IS 'Canjea 10 puntos por 1 producto gratis. Valida que el cliente tenga suficientes puntos y registra el movimiento en historial.';
COMMENT ON FUNCTION fn_consultar_puntos IS 'Consulta los puntos actuales de un cliente, cuántos productos gratis puede obtener y cuántos puntos le faltan para el siguiente.';

COMMENT ON TABLE recepcion_mercaderia IS 'Registro de recepciones de mercadería. Al registrar una recepción, se actualizan automáticamente: 1) Costo promedio del insumo (PPP), 2) Movimiento de inventario (Kardex), 3) Stock actual.';
COMMENT ON TABLE detalle_recepcion_mercaderia IS 'Detalle de cada insumo recibido. Cada registro dispara: actualización de costo promedio → registro de entrada en movimiento_inventario → actualización de stock.';

COMMENT ON FUNCTION fn_kardex_insumo IS 'Genera reporte Kardex con historial completo de movimientos de un insumo: entradas, salidas, saldo acumulado, costos y valores. Incluye todos los movimientos (compras, ventas, ajustes).';
COMMENT ON FUNCTION fn_obtener_stock_actual IS 'Calcula el stock actual real de un insumo sumando todas las entradas y restando todas las salidas registradas en movimiento_inventario.';
COMMENT ON FUNCTION fn_actualizar_costo_promedio IS 'Actualiza el costo promedio ponderado (PPP) del insumo al recibir mercadería. Se ejecuta ANTES de registrar la entrada en inventario.';
COMMENT ON FUNCTION fn_registrar_entrada_por_compra IS 'Registra la entrada de inventario en movimiento_inventario cuando se recibe mercadería. Este registro aparece en el Kardex. Se ejecuta DESPUÉS de actualizar el costo promedio.';

COMMENT ON FUNCTION sp_procesar_venta IS 'Stored Procedure para procesar una venta completa en una sola transacción. Maneja: creación de venta, canje de puntos (opcional), agregado de productos, confirmación y acumulación de puntos. Incluye manejo de errores con rollback automático.';
COMMENT ON FUNCTION sp_recepcionar_mercaderia IS 'Stored Procedure para recepcionar mercadería de una orden de compra. Procesa múltiples insumos, actualiza costos promedio (PPP), registra entradas en Kardex y actualiza el estado de la orden. Transacción atómica con rollback en caso de error.';
COMMENT ON FUNCTION sp_cierre_diario IS 'Stored Procedure para realizar el cierre diario del negocio. Genera resumen de ventas, gastos, ganancias, movimientos de puntos y marca las ventas como completadas. Retorna estadísticas completas del día.';

-- ==========================================================
-- 1.1) Tabla nueva: insumo_presentacion
-- ==========================================================
CREATE TABLE IF NOT EXISTS  insumo_presentacion (
  id_presentacion           SERIAL PRIMARY KEY,
  id_insumo                 INTEGER NOT NULL REFERENCES public.insumo(id_insumo) ON DELETE CASCADE,
  id_proveedor              INTEGER NULL REFERENCES public.proveedor(id_proveedor),
  descripcion_presentacion  VARCHAR(200) NOT NULL,
  unidad_compra             VARCHAR(50)  NOT NULL,
  unidades_por_presentacion NUMERIC(14,6) NOT NULL CHECK (unidades_por_presentacion > 0),
  costo_compra_unitario     NUMERIC(14,6) NOT NULL CHECK (costo_compra_unitario >= 0),
  es_principal              BOOLEAN NOT NULL DEFAULT FALSE,
  activo                    BOOLEAN NOT NULL DEFAULT TRUE
);

-- Índices de apoyo
CREATE INDEX IF NOT EXISTS ix_ip_id_insumo
  ON public.insumo_presentacion(id_insumo);

CREATE INDEX IF NOT EXISTS ix_ip_id_proveedor
  ON public.insumo_presentacion(id_proveedor);

-- una descripción por insumo puede repetirse entre proveedores; si quieres
-- evitar duplicados por insumo + descripción, activa este UNIQUE:
-- CREATE UNIQUE INDEX IF NOT EXISTS ux_ip_insumo_desc ON public.insumo_presentacion(id_insumo, descripcion_presentacion);


-- ==========================================================
-- 1.2) Limpiar columnas que ya NO se usan en insumo
--     (quedamos solo con unidad_base en el catálogo)
-- ==========================================================
ALTER TABLE public.insumo
  DROP COLUMN IF EXISTS id_proveedor_principal,
  DROP COLUMN IF EXISTS unidad_compra,
  DROP COLUMN IF EXISTS unidades_por_presentacion,
  DROP COLUMN IF EXISTS presentacion_detalle;

-- Asegurar unidad_base (por si alguna BD vieja no la tenía)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='insumo' AND column_name='unidad_base'
  ) THEN
    ALTER TABLE public.insumo ADD COLUMN unidad_base TEXT NOT NULL DEFAULT 'unidad';
  END IF;
END$$;


-- ==========================================================
-- 1.3) detalle_recepcion_mercaderia: reemplazar id_insumo → id_presentacion
--      y documentar que 'cantidad_aceptada/recibida' es en PRESENTACIONES
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='detalle_recepcion_mercaderia' AND column_name='id_presentacion'
  ) THEN
    ALTER TABLE public.detalle_recepcion_mercaderia
      ADD COLUMN id_presentacion INTEGER NULL;
    ALTER TABLE public.detalle_recepcion_mercaderia
      ADD CONSTRAINT fk_drm_presentacion
      FOREIGN KEY (id_presentacion) REFERENCES public.insumo_presentacion(id_presentacion);
    CREATE INDEX IF NOT EXISTS ix_drm_id_presentacion
      ON public.detalle_recepcion_mercaderia(id_presentacion);
  END IF;

  -- Si aún existe id_insumo, elimínalo (ya no se usa aquí)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='detalle_recepcion_mercaderia' AND column_name='id_insumo'
  ) THEN
    ALTER TABLE public.detalle_recepcion_mercaderia
      DROP COLUMN id_insumo;
  END IF;
END$$;

-- (Opcional) renombra a 'cantidad_recibida' si te conviene
-- DO $$ BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='detalle_recepcion_mercaderia' AND column_name='cantidad_aceptada'
--   ) AND NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='detalle_recepcion_mercaderia' AND column_name='cantidad_recibida'
--   ) THEN
--     ALTER TABLE public.detalle_recepcion_mercaderia
--       RENAME COLUMN cantidad_aceptada TO cantidad_recibida;
--   END IF;
-- END $$;


-- Calcula costo ponderado usando costo por UNIDAD_BASE
CREATE OR REPLACE FUNCTION public.fn_actualizar_costo_promedio(
  p_id_insumo               INTEGER,
  p_cantidad_base           NUMERIC,
  p_costo_compra_unitario   NUMERIC,       -- costo de LA PRESENTACIÓN
  p_unidades_por_present    NUMERIC        -- factor a unidad_base
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_costo_unit_base  NUMERIC;
  v_stock_actual     NUMERIC;
  v_costo_prom_anterior NUMERIC;
  v_costo_prom_nuevo NUMERIC;
BEGIN
  IF COALESCE(p_unidades_por_present,0) <= 0 THEN
    RAISE EXCEPTION 'unidades_por_presentacion inválido (<= 0) para insumo %', p_id_insumo;
  END IF;

  v_costo_unit_base := p_costo_compra_unitario / p_unidades_por_present;

  -- stock actual en cantidad_base (suma de entradas - salidas)
  SELECT COALESCE(SUM(
           CASE WHEN mi.tipo_movimiento IN ('entrada_compra','entrada_ajuste')
                THEN mi.cantidad_base
                ELSE -mi.cantidad_base
           END
         ),0)
    INTO v_stock_actual
  FROM public.movimiento_inventario mi
  WHERE mi.id_insumo = p_id_insumo;

  SELECT COALESCE(i.costo_promedio,0) INTO v_costo_prom_anterior
  FROM public.insumo i WHERE i.id_insumo = p_id_insumo;

  v_costo_prom_nuevo :=
    CASE
      WHEN COALESCE(v_stock_actual,0) + COALESCE(p_cantidad_base,0) > 0
      THEN (
        (COALESCE(v_stock_actual,0) * COALESCE(v_costo_prom_anterior,0))
        + (COALESCE(p_cantidad_base,0) * COALESCE(v_costo_unit_base,0))
      )
      / (COALESCE(v_stock_actual,0) + COALESCE(p_cantidad_base,0))
      ELSE v_costo_unit_base
    END;

  UPDATE public.insumo
     SET costo_promedio = v_costo_prom_nuevo
   WHERE id_insumo = p_id_insumo;

  RETURN v_costo_prom_nuevo;
END;
$$;

CREATE OR REPLACE FUNCTION public.sp_recepcionar_mercaderia(p_id_recepcion INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  v_cant_base NUMERIC;
  v_costo_prom NUMERIC;
BEGIN
  FOR r IN
    SELECT
      drm.id_detalle,               -- si existe
      drm.id_presentacion,
      COALESCE(drm.cantidad_recibida, drm.cantidad_aceptada, 0) AS cantidad_present,
      ip.id_insumo,
      ip.unidades_por_presentacion,
      ip.costo_compra_unitario,
      ip.unidad_compra,
      i.unidad_base
    FROM public.detalle_recepcion_mercaderia drm
    JOIN public.insumo_presentacion ip ON ip.id_presentacion = drm.id_presentacion
    JOIN public.insumo i               ON i.id_insumo        = ip.id_insumo
    WHERE drm.id_recepcion = p_id_recepcion
  LOOP
    IF r.cantidad_present IS NULL OR r.cantidad_present <= 0 THEN
      CONTINUE;
    END IF;

    v_cant_base := r.cantidad_present * r.unidades_por_presentacion;

    -- Actualizar costo promedio con costo en unidad_base
    v_costo_prom := public.fn_actualizar_costo_promedio(
                      r.id_insumo,
                      v_cant_base,
                      r.costo_compra_unitario,
                      r.unidades_por_presentacion
                    );

    -- Registrar ENTRADA en kárdex (siempre en unidad_base)
    INSERT INTO public.movimiento_inventario (
      id_insumo,
      tipo_movimiento,
      fecha_movimiento,
      cantidad_registrada, unidad_registrada, factor_usado,
      cantidad_base,
      costo_unit_compra,  costo_unit_base,  costo_unitario_momento,
      id_referencia, descripcion
    )
    VALUES (
      r.id_insumo,
      'entrada_compra',
      now(),
      r.cantidad_present, r.unidad_compra, r.unidades_por_presentacion,
      v_cant_base,
      r.costo_compra_unitario, (r.costo_compra_unitario / r.unidades_por_presentacion), v_costo_prom,
      p_id_recepcion,
      'Recepción mercadería (presentación '||r.id_presentacion||')'
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_descontar_inventario_venta()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v RECORD;
BEGIN
  -- Recorre receta del producto vendido (NEW.id_producto, NEW.cantidad)
  FOR v IN
    SELECT
      rd.id_insumo,
      (rd.cantidad_requerida * NEW.cantidad)::numeric AS cantidad_a_descontar, -- en unidad_base
      p.nombre_producto,
      i.tipo_categoria,
      i.unidad_base
    FROM public.receta_detalle rd
    JOIN public.producto p ON p.id_producto = rd.id_producto
    JOIN public.insumo   i ON i.id_insumo   = rd.id_insumo
    WHERE rd.id_producto = NEW.id_producto
  LOOP
    IF lower(v.tipo_categoria) = 'perpetuo'
       AND COALESCE(v.cantidad_a_descontar,0) > 0
    THEN
      INSERT INTO public.movimiento_inventario (
        id_insumo, tipo_movimiento, fecha_movimiento,
        cantidad_registrada, unidad_registrada, factor_usado,
        cantidad_base,
        costo_unitario_momento,
        id_referencia, descripcion
      )
      VALUES (
        v.id_insumo, 'salida_venta', now(),
        v.cantidad_a_descontar, v.unidad_base, 1,
        v.cantidad_a_descontar,
        (SELECT COALESCE(i2.costo_promedio,0) FROM public.insumo i2 WHERE i2.id_insumo = v.id_insumo),
        NEW.id_venta,
        'Descuento por venta: '||COALESCE(v.nombre_producto,'')||' x '||NEW.cantidad
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 3.1) (Re)instalar el trigger de ventas (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class  c ON c.oid = t.tgrelid
    JOIN pg_proc   p ON p.oid = t.tgfoid
    WHERE c.relname = 'detalle_venta' AND t.tgname = 'trg_descontar_inventario_venta'
  ) THEN
    CREATE TRIGGER trg_descontar_inventario_venta
      AFTER INSERT ON public.detalle_venta
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_descontar_inventario_venta();
  END IF;
END$$;


-- 3.2) Helper para obtener la presentación principal de un insumo
CREATE OR REPLACE FUNCTION public.fn_presentacion_principal(p_id_insumo INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE v_id INTEGER;
BEGIN
  SELECT ip.id_presentacion
    INTO v_id
  FROM public.insumo_presentacion ip
  WHERE ip.id_insumo = p_id_insumo
    AND ip.es_principal IS TRUE
    AND ip.activo IS TRUE
  ORDER BY ip.id_presentacion DESC
  LIMIT 1;

  RETURN v_id;
END;
$$;


-- 3.3) Trigger de verificación de stock bajo (opcional)
--     Si tu esquema tiene orden_compra/detalle_orden_compra se intentará crear un pedido
--     usando la presentación principal. Si no existen esas tablas, sólo hace NOTICE.
CREATE OR REPLACE FUNCTION public.fn_verificar_stock_bajo_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_stock NUMERIC;
  v_min   NUMERIC;
  v_pres  INTEGER;
  v_prov  INTEGER;
  v_orden INTEGER;
BEGIN
  -- Stock actual del insumo afectado
  SELECT COALESCE(SUM(
           CASE WHEN tipo_movimiento IN ('entrada_compra','entrada_ajuste')
                THEN cantidad_base ELSE -cantidad_base END
         ),0)
    INTO v_stock
  FROM public.movimiento_inventario
  WHERE id_insumo = NEW.id_insumo;

  SELECT stock_minimo INTO v_min
  FROM public.insumo WHERE id_insumo = NEW.id_insumo;

  IF v_stock <= COALESCE(v_min,0) THEN
    v_pres := public.fn_presentacion_principal(NEW.id_insumo);

    IF v_pres IS NULL THEN
      RAISE NOTICE 'Stock bajo en insumo %, pero no hay presentación principal configurada', NEW.id_insumo;
      RETURN NEW;
    END IF;

    -- Si existen las tablas de compra, generar un pedido simple
    IF to_regclass('public.orden_compra') IS NOT NULL
       AND to_regclass('public.detalle_orden_compra') IS NOT NULL THEN

      SELECT ip.id_proveedor INTO v_prov
      FROM public.insumo_presentacion ip
      WHERE ip.id_presentacion = v_pres;

      INSERT INTO public.orden_compra (fecha_creacion, estado, id_proveedor)
      VALUES (now(), 'pendiente', v_prov)
      RETURNING id_orden_compra INTO v_orden;

      INSERT INTO public.detalle_orden_compra (id_orden_compra, id_presentacion, cantidad)
      VALUES (v_orden, v_pres, 1); -- cantidad por defecto

      RAISE NOTICE 'OC % creada por stock bajo. insumo %, presentacion %', v_orden, NEW.id_insumo, v_pres;
    ELSE
      RAISE NOTICE 'Stock bajo en insumo % (presentación principal %). Integra tu flujo de pedidos.', NEW.id_insumo, v_pres;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Instalar el trigger de stock bajo sobre movimiento_inventario (una vez)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname='movimiento_inventario' AND t.tgname='trg_stock_bajo_reabastecer'
  ) THEN
    CREATE TRIGGER trg_stock_bajo_reabastecer
      AFTER INSERT ON public.movimiento_inventario
      FOR EACH ROW
      EXECUTE FUNCTION public.fn_verificar_stock_bajo_trigger();
  END IF;
END$$;

-- ===============================================================  
-- CAMBIOS REALIZADOS PARA CONSISTENCIA CON TYPESCRIPT
-- ===============================================================  
-- 
-- 1. Tabla insumo:
--    - Cambiado 'unidad_medida' → 'unidad_base' 
--    - Removido 'stock_actual' (se calcula dinámicamente)
--
-- 2. Tabla producto_variante:
--    - Cambiado 'costo_adicional' → 'costo_variante'
--    - Cambiado 'precio_adicional' → 'precio_variante'
--
-- 3. Tabla receta_detalle:
--    - Cambiado 'cantidad' → 'cantidad_requerida'
--    - Agregado 'unidad_base'
--
-- 4. Funciones actualizadas para usar nuevos nombres de campos
-- 5. Datos de ejemplo actualizados
-- 6. Vistas y consultas corregidas
--
-- Estos cambios aseguran consistencia entre el esquema de BD 
-- y los tipos definidos en el backend TypeScript.
-- ===============================================================
