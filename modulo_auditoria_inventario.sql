-- ===========================amiwis

CREATE TABLE auditoria_inventario (
    id_auditoria SERIAL PRIMARY KEY,
    nombre_auditor VARCHAR(100) NOT NULL,
    fecha_inicio_periodo DATE NOT NULL,  
    fecha_fin_periodo DATE NOT NULL,     
    fecha_inicio_auditoria DATE NOT NULL, 
    fecha_fin_auditoria DATE,             
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso', 'completada', 'cancelada')),
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    notas_generales TEXT,
    total_items_contados INTEGER DEFAULT 0,
    total_discrepancias INTEGER DEFAULT 0
);

CREATE TABLE auditoria_detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_auditoria INTEGER REFERENCES auditoria_inventario(id_auditoria) ON DELETE CASCADE,
    id_insumo INTEGER REFERENCES insumo(id_insumo),
    tipo_categoria VARCHAR(20) DEFAULT 'operativo' CHECK (tipo_categoria IN ('perpetuo', 'operativo')),
    stock_esperado DECIMAL(10,2) NOT NULL,
    conteo_fisico DECIMAL(10,2),
    diferencia DECIMAL(10,2) GENERATED ALWAYS AS (conteo_fisico - stock_esperado) STORED,
    causa_ajuste VARCHAR(100),
    notas TEXT,
    fecha_conteo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ubicacion_conteo VARCHAR(100)  
);

CREATE TABLE bitacora_auditoria (
    id_bitacora SERIAL PRIMARY KEY,
    id_auditoria INTEGER REFERENCES auditoria_inventario(id_auditoria) ON DELETE CASCADE,
    accion VARCHAR(50) CHECK (accion IN (
        'creacion', 'conteo_actualizado', 'completada', 'cancelada',
        'ajuste_aplicado', 'reporte_generado', 'modificacion_manual'
    )),
    id_perfil INTEGER REFERENCES perfil_usuario(id_perfil),
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    datos_anteriores JSONB,
    datos_nuevos JSONB
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_inicio ON auditoria_inventario(fecha_inicio_periodo);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_fin ON auditoria_inventario(fecha_fin_periodo);
CREATE INDEX IF NOT EXISTS idx_auditoria_estado ON auditoria_inventario(estado);
CREATE INDEX IF NOT EXISTS idx_auditoria_perfil ON auditoria_inventario(id_perfil);
CREATE INDEX IF NOT EXISTS idx_auditoria_detalle_auditoria ON auditoria_detalle(id_auditoria);
CREATE INDEX IF NOT EXISTS idx_auditoria_detalle_insumo ON auditoria_detalle(id_insumo);
CREATE INDEX IF NOT EXISTS idx_auditoria_detalle_tipo ON auditoria_detalle(tipo_categoria);
CREATE INDEX IF NOT EXISTS idx_bitacora_auditoria_auditoria ON bitacora_auditoria(id_auditoria);
CREATE INDEX IF NOT EXISTS idx_bitacora_auditoria_fecha ON bitacora_auditoria(fecha_accion);


-- FUNCIÓN PARA INICIAR AUDITORÍA
CREATE OR REPLACE FUNCTION fn_iniciar_auditoria(
    p_nombre_auditor VARCHAR(100),
    p_fecha_inicio_periodo DATE,
    p_fecha_fin_periodo DATE,
    p_id_perfil INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_id_auditoria INTEGER;
BEGIN
    IF p_fecha_inicio_periodo > p_fecha_fin_periodo THEN
        RAISE EXCEPTION 'La fecha de inicio del período no puede ser posterior a la fecha fin';
    END IF;

    INSERT INTO auditoria_inventario (
        nombre_auditor,
        fecha_inicio_periodo,
        fecha_fin_periodo,
        fecha_inicio_auditoria,
        id_perfil
    ) VALUES (
        p_nombre_auditor,
        p_fecha_inicio_periodo,
        p_fecha_fin_periodo,
        CURRENT_DATE,
        p_id_perfil
    ) RETURNING id_auditoria INTO v_id_auditoria;

    INSERT INTO auditoria_detalle (
        id_auditoria,
        id_insumo,
        tipo_categoria,
        stock_esperado
    )
    SELECT
        v_id_auditoria,
        i.id_insumo,
        ci.tipo_categoria,
        fn_obtener_stock_actual(i.id_insumo)
    FROM insumo i
    JOIN categoria_insumo ci ON i.id_categoria = ci.id_categoria
    WHERE i.activo = TRUE
    ORDER BY ci.tipo_categoria, i.nombre_insumo;

    INSERT INTO bitacora_auditoria (
        id_auditoria, accion, id_perfil, descripcion
    ) VALUES (
        v_id_auditoria, 'creacion', p_id_perfil,
        'Auditoría iniciada por ' || p_nombre_auditor ||
        ' - Período: ' || p_fecha_inicio_periodo || ' a ' || p_fecha_fin_periodo
    );

    RETURN v_id_auditoria;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- FUNCIÓN PARA ACTUALIZAR CONTEO FÍSICO
CREATE OR REPLACE FUNCTION fn_actualizar_conteo_auditoria(
    p_id_auditoria INTEGER,
    p_id_insumo INTEGER,
    p_conteo_fisico DECIMAL(10,2),
    p_causa_ajuste VARCHAR(100) DEFAULT NULL,
    p_notas TEXT DEFAULT NULL,
    p_ubicacion VARCHAR(100) DEFAULT NULL,
    p_id_perfil INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_datos_anteriores JSONB;
    v_datos_nuevos JSONB;
BEGIN
    SELECT row_to_json(ad) INTO v_datos_anteriores
    FROM auditoria_detalle ad
    WHERE ad.id_auditoria = p_id_auditoria AND ad.id_insumo = p_id_insumo;

    UPDATE auditoria_detalle
    SET
        conteo_fisico = p_conteo_fisico,
        causa_ajuste = p_causa_ajuste,
        notas = p_notas,
        ubicacion_conteo = p_ubicacion,
        fecha_conteo = CURRENT_TIMESTAMP
    WHERE id_auditoria = p_id_auditoria AND id_insumo = p_id_insumo;

    SELECT row_to_json(ad) INTO v_datos_nuevos
    FROM auditoria_detalle ad
    WHERE ad.id_auditoria = p_id_auditoria AND ad.id_insumo = p_id_insumo;

    INSERT INTO bitacora_auditoria (
        id_auditoria, accion, id_perfil, descripcion,
        datos_anteriores, datos_nuevos
    ) VALUES (
        p_id_auditoria, 'conteo_actualizado', p_id_perfil,
        'Conteo actualizado para insumo ' || p_id_insumo ||
        ' - Cantidad: ' || p_conteo_fisico,
        v_datos_anteriores, v_datos_nuevos
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA COMPLETAR AUDITORÍA
CREATE OR REPLACE FUNCTION fn_completar_auditoria(
    p_id_auditoria INTEGER,
    p_id_perfil INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_total_items INTEGER;
    v_total_discrepancias INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(CASE WHEN diferencia != 0 THEN 1 END)
    INTO v_total_items, v_total_discrepancias
    FROM auditoria_detalle
    WHERE id_auditoria = p_id_auditoria AND conteo_fisico IS NOT NULL;

    UPDATE auditoria_inventario
    SET
        estado = 'completada',
        fecha_fin_auditoria = CURRENT_DATE,
        total_items_contados = v_total_items,
        total_discrepancias = v_total_discrepancias
    WHERE id_auditoria = p_id_auditoria;

    INSERT INTO bitacora_auditoria (
        id_auditoria, accion, id_perfil, descripcion
    ) VALUES (
        p_id_auditoria, 'completada', p_id_perfil,
        'Auditoría completada - Items contados: ' || v_total_items ||
        ', Discrepancias: ' || v_total_discrepancias
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER REPORTE DE AUDITORÍA
CREATE OR REPLACE FUNCTION fn_reporte_auditoria(p_id_auditoria INTEGER)
RETURNS TABLE(
    tipo_categoria VARCHAR(20),
    insumo VARCHAR(100),
    unidad_base VARCHAR(20),
    stock_esperado DECIMAL(10,2),
    conteo_fisico DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    causa_ajuste VARCHAR(100),
    notas TEXT,
    ubicacion_conteo VARCHAR(100),
    estado_conteo VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ad.tipo_categoria,
        i.nombre_insumo,
        i.unidad_base,
        ad.stock_esperado,
        ad.conteo_fisico,
        ad.diferencia,
        ad.causa_ajuste,
        ad.notas,
        ad.ubicacion_conteo,
        CASE
            WHEN ad.conteo_fisico IS NULL THEN 'Pendiente'
            WHEN ad.diferencia = 0 THEN 'Correcto'
            WHEN ad.diferencia > 0 THEN 'Sobrante'
            WHEN ad.diferencia < 0 THEN 'Faltante'
        END as estado_conteo
    FROM auditoria_detalle ad
    JOIN insumo i ON ad.id_insumo = i.id_insumo
    WHERE ad.id_auditoria = p_id_auditoria
    ORDER BY ad.tipo_categoria, i.nombre_insumo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCIÓN PARA OBTENER ESTADÍSTICAS DE AUDITORÍA
CREATE OR REPLACE FUNCTION fn_estadisticas_auditoria(p_id_auditoria INTEGER)
RETURNS TABLE(
    total_insumos INTEGER,
    insumos_contados INTEGER,
    insumos_pendientes INTEGER,
    total_discrepancias INTEGER,
    porcentaje_completado DECIMAL(5,2),
    insumos_correctos INTEGER,
    insumos_sobrantes INTEGER,
    insumos_faltantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_insumos,
        COUNT(CASE WHEN conteo_fisico IS NOT NULL THEN 1 END)::INTEGER as insumos_contados,
        COUNT(CASE WHEN conteo_fisico IS NULL THEN 1 END)::INTEGER as insumos_pendientes,
        COUNT(CASE WHEN diferencia != 0 AND conteo_fisico IS NOT NULL THEN 1 END)::INTEGER as total_discrepancias,
        ROUND(
            (COUNT(CASE WHEN conteo_fisico IS NOT NULL THEN 1 END)::DECIMAL /
             NULLIF(COUNT(*), 0)) * 100, 2
        ) as porcentaje_completado,
        COUNT(CASE WHEN diferencia = 0 AND conteo_fisico IS NOT NULL THEN 1 END)::INTEGER as insumos_correctos,
        COUNT(CASE WHEN diferencia > 0 THEN 1 END)::INTEGER as insumos_sobrantes,
        COUNT(CASE WHEN diferencia < 0 THEN 1 END)::INTEGER as insumos_faltantes
    FROM auditoria_detalle
    WHERE id_auditoria = p_id_auditoria;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- TRIGGER PARA ACTUALIZAR ESTADO DE AUDITORÍA AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION fn_actualizar_estado_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conteo_fisico IS NOT NULL AND OLD.conteo_fisico IS NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM auditoria_detalle
            WHERE id_auditoria = NEW.id_auditoria
            AND conteo_fisico IS NULL
        ) THEN
            UPDATE auditoria_inventario
            SET
                estado = 'completada',
                fecha_fin_auditoria = CURRENT_DATE
            WHERE id_auditoria = NEW.id_auditoria;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_actualizar_estado_auditoria
AFTER UPDATE ON auditoria_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_estado_auditoria();

-- TRIGGER PARA BITÁCORA DE CAMBIOS EN AUDITORÍA
CREATE OR REPLACE FUNCTION fn_bitacora_auditoria_cambios()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO bitacora_auditoria (
        id_auditoria, accion, id_perfil, descripcion,
        datos_anteriores, datos_nuevos
    ) VALUES (
        COALESCE(NEW.id_auditoria, OLD.id_auditoria),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'creacion'
            WHEN TG_OP = 'UPDATE' THEN
                CASE
                    WHEN OLD.conteo_fisico IS NULL AND NEW.conteo_fisico IS NOT NULL THEN 'conteo_actualizado'
                    WHEN OLD.estado != NEW.estado THEN NEW.estado
                    ELSE 'modificacion_manual'
                END
            WHEN TG_OP = 'DELETE' THEN 'eliminacion'
        END,
        NEW.id_perfil, -- Asumiendo que tienes este campo
        CASE
            WHEN TG_OP = 'INSERT' THEN 'Nuevo registro de auditoría creado'
            WHEN TG_OP = 'UPDATE' THEN 'Registro de auditoría actualizado'
            WHEN TG_OP = 'DELETE' THEN 'Registro de auditoría eliminado'
        END,
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_bitacora_auditoria_inventario
AFTER INSERT OR UPDATE OR DELETE ON auditoria_inventario
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_auditoria_cambios();

CREATE TRIGGER trg_bitacora_auditoria_detalle
AFTER UPDATE ON auditoria_detalle
FOR EACH ROW
EXECUTE FUNCTION fn_bitacora_auditoria_cambios();

-- ===============================================
-- VISTAS ÚTILES PARA AUDITORÍA
-- ===============================================

-- VISTA PARA AUDITORÍAS ACTIVAS
CREATE OR REPLACE VIEW vista_auditorias_activas AS
SELECT
    ai.*,
    p.primer_nombre || ' ' || p.primer_apellido as nombre_perfil,
    fn_estadisticas_auditoria(ai.id_auditoria).*
FROM auditoria_inventario ai
LEFT JOIN perfil_usuario p ON ai.id_perfil = p.id_perfil
WHERE ai.estado = 'en_progreso'
ORDER BY ai.fecha_creacion DESC;

-- VISTA PARA HISTORIAL DE AUDITORÍAS
CREATE OR REPLACE VIEW vista_historial_auditorias AS
SELECT
    ai.*,
    p.primer_nombre || ' ' || p.primer_apellido as nombre_perfil,
    fn_estadisticas_auditoria(ai.id_auditoria).*
FROM auditoria_inventario ai
LEFT JOIN perfil_usuario p ON ai.id_perfil = p.id_perfil
WHERE ai.estado IN ('completada', 'cancelada')
ORDER BY ai.fecha_fin_auditoria DESC;
