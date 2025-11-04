-- ===============================================
-- SOLUCIÓN: Desabilitar RLS en auditoria_detalle
-- ===============================================
-- ERROR: permission denied for table auditoria_detalle (42501)
-- CAUSA: Row Level Security está bloqueando el acceso
-- SOLUCIÓN: Deshabilitar RLS (o crear políticas RLS)

-- Deshabilitar RLS en auditoria_detalle
ALTER TABLE auditoria_detalle DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en auditoria_inventario
ALTER TABLE auditoria_inventario DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en bitacora_auditoria
ALTER TABLE bitacora_auditoria DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS habilitado"
FROM pg_tables
WHERE tablename IN ('auditoria_inventario', 'auditoria_detalle', 'bitacora_auditoria')
ORDER BY tablename;

-- Confirmación
SELECT 'RLS deshabilitado en todas las tablas de auditoría' as resultado;
