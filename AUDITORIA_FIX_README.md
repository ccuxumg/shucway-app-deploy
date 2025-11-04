# Correcciones al Módulo de Auditoría

## Problemas Identificados y Solucionados

### 1. ❌ Error 400 en `fn_iniciar_auditoria`
**Problema:** La función de base de datos no se ejecutaba correctamente.

**Solución:**
- ✅ Agregada validación de campos en el frontend antes de llamar a la función
- ✅ Mejorado manejo de errores con mensajes específicos
- ✅ Eliminado fallback a "modo demo" que ocultaba los errores reales

### 2. ❌ Error 400 en carga de `auditoria_detalle`
**Problema:** La tabla no tenía todas las columnas necesarias.

**Solución:**
- ✅ Agregada columna `ubicacion_conteo` a la tabla `auditoria_detalle`
- ✅ Actualizado `database_complete_new.sql` con la nueva estructura

### 3. ❌ Datos "quemados" (SEED_ROWS)
**Problema:** El componente usaba datos de prueba hardcodeados que causaban confusión.

**Solución:**
- ✅ Eliminado completamente el array `SEED_ROWS`
- ✅ Todas las referencias ahora usan arrays vacíos o datos reales de la BD
- ✅ El componente ahora depende 100% de la base de datos

### 4. ❌ Error 404 en `movimiento_encabezado`
**Problema:** El componente intentaba acceder a una tabla inexistente.

**Solución:**
- ✅ Esta tabla no es necesaria para el módulo de auditoría
- ✅ Verificar que no haya código que la referencie incorrectamente

## Archivos Modificados

### Frontend
- **`frontend/src/features/Dashboard/Inventario/Auditoria/index.tsx`**
  - Eliminado `SEED_ROWS` y todas sus referencias
  - Mejorada función `startAudit()` con validaciones
  - Mejorado manejo de errores en `loadRows()`
  - Limpieza de estado al finalizar auditoría

### Base de Datos
- **`database_complete_new.sql`**
  - Agregada columna `ubicacion_conteo VARCHAR(100)` a `auditoria_detalle`

- **`fix_auditoria.sql`** (NUEVO)
  - Script para aplicar el fix en bases de datos existentes
  - Verifica existencia de tablas y funciones
  - Agrega columna faltante

## Cómo Aplicar las Correcciones

### Opción 1: Base de Datos Nueva
Si está creando la BD desde cero:
```bash
# Ejecutar el script completo actualizado
psql -U usuario -d shucway < database_complete_new.sql
```

### Opción 2: Base de Datos Existente
Si ya tiene datos en la BD:
```bash
# Ejecutar solo el script de fix
psql -U usuario -d shucway < fix_auditoria.sql
```

### Opción 3: Supabase Dashboard
1. Ir a SQL Editor en Supabase
2. Copiar contenido de `fix_auditoria.sql`
3. Ejecutar el script
4. Verificar mensajes de éxito

## Estructura de Datos Actualizada

### Tabla: `auditoria_detalle`
```sql
CREATE TABLE auditoria_detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_auditoria INTEGER REFERENCES auditoria_inventario(id_auditoria) ON DELETE CASCADE,
    id_insumo INTEGER REFERENCES insumo(id_insumo),
    tipo_categoria VARCHAR(20) DEFAULT 'operativo',
    stock_esperado DECIMAL(10,2) NOT NULL,
    conteo_fisico DECIMAL(10,2),
    diferencia DECIMAL(10,2) GENERATED ALWAYS AS (conteo_fisico - stock_esperado) STORED,
    causa_ajuste VARCHAR(100),
    notas TEXT,
    ubicacion_conteo VARCHAR(100)  -- ⭐ NUEVA COLUMNA
);
```

## Flujo de Auditoría Corregido

### 1. Iniciar Auditoría
```typescript
// Frontend valida datos
if (!nombreAuditoria || !fechaInicioPeriodo || !fechaFinPeriodo) {
  return error;
}

// Llama a función de BD
const { data, error } = await supabase.rpc("fn_iniciar_auditoria", {
  p_nombre_auditoria: nombreAuditoria.trim(),
  p_fecha_inicio_periodo: fechaInicioPeriodo,
  p_fecha_fin_periodo: fechaFinPeriodo,
  p_id_perfil: userId,
});

// BD crea registro en auditoria_inventario
// BD crea registros en auditoria_detalle para todos los insumos activos
// BD retorna id_auditoria
```

### 2. Cargar Datos
```typescript
// Frontend obtiene detalles de auditoría
const { data } = await supabase
  .from("auditoria_detalle")
  .select(`
    id_detalle,
    id_insumo,
    tipo_categoria,
    stock_esperado,
    conteo_fisico,
    diferencia,
    causa_ajuste,
    notas,
    ubicacion_conteo,  -- ⭐ NUEVO CAMPO
    insumo (
      nombre_insumo,
      unidad_base,
      categoria_insumo (nombre)
    )
  `)
  .eq("id_auditoria", sessionId);
```

### 3. Actualizar Conteo
```typescript
// Frontend guarda conteo físico
await supabase.rpc("fn_actualizar_conteo_auditoria", {
  p_id_auditoria: sessionId,
  p_id_insumo: id_insumo,
  p_conteo_fisico: cantidad,
  p_causa_ajuste: causa,
  p_notas: observaciones,
  p_id_perfil: userId,
});

// BD actualiza auditoria_detalle
// BD registra en bitacora_auditoria
```

## Verificación Post-Aplicación

### 1. Verificar Columna
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'auditoria_detalle';
```

Debe mostrar `ubicacion_conteo` con tipo `character varying`.

### 2. Probar Función
```sql
SELECT fn_iniciar_auditoria(
  'Auditoría de Prueba',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE,
  1  -- ID de perfil válido
);
```

Debe retornar un número (id_auditoria).

### 3. Verificar Frontend
1. Abrir el módulo de Auditoría
2. Click en "Iniciar Nueva Auditoría"
3. Llenar formulario con datos válidos
4. Debe crear auditoría sin errores 400
5. Debe cargar lista de insumos para contar

## Errores Comunes y Soluciones

### Error: "La tabla auditoria_inventario no existe"
**Solución:** Ejecutar `database_complete_new.sql` completo primero.

### Error: "La función fn_iniciar_auditoria no existe"
**Solución:** Verificar que se hayan creado todas las funciones del script.

### Error: "Usuario no identificado"
**Solución:** Asegurarse de que el usuario esté autenticado correctamente.

### Error: "Las fechas de período son requeridas"
**Solución:** Verificar que el formulario tenga valores en ambos campos de fecha.

## Próximos Pasos

- [ ] Probar creación de auditoría con datos reales
- [ ] Verificar que se carguen todos los insumos activos
- [ ] Probar actualización de conteos físicos
- [ ] Verificar cálculo automático de diferencias
- [ ] Probar finalización de auditoría
- [ ] Verificar bitácora de cambios

## Soporte

Si encuentra algún problema después de aplicar estas correcciones:

1. Verificar logs del navegador (F12 → Console)
2. Verificar logs de Supabase (SQL Editor → History)
3. Revisar que todas las funciones existan en la BD
4. Confirmar que el usuario tenga permisos necesarios
