-- =============================================================
-- SESIONES DE CAJA
-- Fecha: 2025-11-07
-- Descripción: Crea tabla para llevar control centralizado de la caja
-- =============================================================

CREATE TABLE IF NOT EXISTS public.caja_sesion (
    id_sesion SERIAL PRIMARY KEY,
    id_cajero_apertura INTEGER REFERENCES public.perfil_usuario(id_perfil),
    id_cajero_cierre INTEGER REFERENCES public.perfil_usuario(id_perfil),
    fecha_apertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP NULL,
    monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
    monto_cierre DECIMAL(12,2) NULL,
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada', 'expirada')),
    auto_cierre BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_caja_sesion_estado_fecha
    ON public.caja_sesion (estado, fecha_apertura DESC);

CREATE INDEX IF NOT EXISTS idx_caja_sesion_cajero_apertura
    ON public.caja_sesion (id_cajero_apertura);
