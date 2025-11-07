# 📋 PLAN DE IMPLEMENTACIÓN - MEJORAS AL MÓDULO DE VENTAS

## 🎯 Objetivos

1. ✅ Verificar y corregir el flujo de descuento de inventario
2. ✅ Implementar modal de visualización y edición de receta
3. ✅ Agregar soporte para variantes de productos
4. ✅ Implementar campo de notas en el carrito
5. ✅ Mejorar el formulario de edición de productos en el carrito

---

## 📊 ANÁLISIS DEL FLUJO ACTUAL

### Flujo en Base de Datos

**Tabla: `venta`**
- ✅ Tiene trigger que ejecuta `fn_descontar_inventario_venta`
- ⚠️ **PROBLEMA**: No considera variantes de productos
- ⚠️ **PROBLEMA**: Campo `notas` no existe en la tabla

**Función: `fn_descontar_inventario_venta`**
```sql
-- ESTADO ACTUAL: Solo descuenta insumos de receta_detalle
-- NECESITA: Incluir insumos de producto_variante
```

**Tabla: `producto_variante`**
- ✅ Existe y tiene relación con `insumo`
- ✅ Campo `id_insumo` puede asociar un insumo a cada variante
- ⚠️ No se está usando en el descuento de inventario

---

## 🔧 CAMBIOS EN BASE DE DATOS

### 1. Agregar campo de notas a la tabla venta

```sql
ALTER TABLE venta ADD COLUMN IF NOT EXISTS notas TEXT;
COMMENT ON COLUMN venta.notas IS 'Notas adicionales o personalizaciones de la venta';
```

### 2. Actualizar función de descuento de inventario

**Archivo**: `database/2025-11-06_ventas_mejoras_flujo.sql`

Cambios principales:
- ✅ Descontar insumos de `receta_detalle` (receta base)
- ✅ Descontar insumos de `producto_variante` (variantes seleccionadas)
- ✅ Mejorar mensajes de descripción en movimientos
- ✅ Solo insumos con `tipo_categoria = 'perpetuo'`

### 3. Crear función auxiliar para obtener variantes

```sql
CREATE OR REPLACE FUNCTION fn_obtener_variantes_producto(p_id_producto INTEGER)
RETURNS TABLE (
    id_variante INTEGER,
    nombre_variante VARCHAR,
    precio_variante DECIMAL,
    id_insumo INTEGER,
    nombre_insumo VARCHAR
)
```

---

## 🎨 CAMBIOS EN FRONTEND

### 1. Actualizar tipo `CartItem`

```typescript
export type CartItem = {
  producto: Producto;
  qty: number;
  mods?: string;
  id_variante?: number;
  notas?: string; // NUEVO
  receta_personalizada?: RecetaDetalle[]; // NUEVO - temporal para esta venta
};
```

### 2. Nuevo estado en componente Ventas

```typescript
// Estados para modal de receta editable
const [openRecetaEdit, setOpenRecetaEdit] = useState(false);
const [recetaEditProducto, setRecetaEditProducto] = useState<ProductoConReceta | null>(null);
const [recetaEditTemporal, setRecetaEditTemporal] = useState<RecetaDetalle[]>([]);

// Estados para variantes
const [variantesDisponibles, setVariantesDisponibles] = useState<ProductoVariante[]>([]);
const [customVariante, setCustomVariante] = useState<number | undefined>(undefined);

// Estados para notas
const [customNotas, setCustomNotas] = useState<string>('');
```

### 3. Nuevo Modal: Ver/Editar Receta

**Funcionalidad**:
- 📖 Ver receta actual del producto
- ✏️ Modificar cantidades temporalmente (solo para esta venta)
- 💾 Los cambios NO afectan la receta global
- ✅ Al agregar al carrito, se guarda la receta personalizada

**Implementación**:

```tsx
const handleOpenRecetaEditable = async (id_producto: number) => {
  try {
    const prod = await productosService.getProductoConReceta(id_producto);
    setRecetaEditProducto(prod);
    setRecetaEditTemporal([...prod.receta]); // Copia para editar
    setOpenRecetaEdit(true);
  } catch (error) {
    addNotification({
      type: 'error',
      message: 'Error al cargar la receta'
    });
  }
};

const handleActualizarCantidadReceta = (id_insumo: number, nuevaCantidad: number) => {
  setRecetaEditTemporal(prev =>
    prev.map(item =>
      item.id_insumo === id_insumo
        ? { ...item, cantidad_requerida: nuevaCantidad }
        : item
    )
  );
};

const handleAgregarConRecetaPersonalizada = () => {
  if (!recetaEditProducto) return;
  
  addToCart(
    recetaEditProducto,
    undefined, // mods
    1, // qty
    undefined, // id_variante
    recetaEditTemporal // receta personalizada
  );
  
  setOpenRecetaEdit(false);
};
```

### 4. Componente Modal de Receta Editable

```tsx
<DrawerRight
  open={openRecetaEdit}
  onClose={() => setOpenRecetaEdit(false)}
  title="Personalizar Receta"
  widthClass="w-full sm:w-[500px]"
>
  <div className="p-6 space-y-4">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <p className="text-sm text-yellow-800">
        ⚠️ Los cambios son solo para esta venta y no afectan la receta original.
      </p>
    </div>

    <div className="space-y-3">
      {recetaEditTemporal.map((item) => {
        const insumo = insumos.find(i => i.id_insumo === item.id_insumo);
        return (
          <div key={item.id_insumo} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-gray-800">
                {insumo?.nombre_insumo || `Insumo #${item.id_insumo}`}
              </div>
              <div className="text-sm text-gray-500">{item.unidad_base}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleActualizarCantidadReceta(
                  item.id_insumo,
                  Math.max(0, item.cantidad_requerida - 0.5)
                )}
                className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={item.cantidad_requerida}
                onChange={(e) => handleActualizarCantidadReceta(
                  item.id_insumo,
                  Number(e.target.value)
                )}
                className="w-20 text-center border border-gray-300 rounded-lg py-1"
                step="0.5"
                min="0"
              />
              <button
                onClick={() => handleActualizarCantidadReceta(
                  item.id_insumo,
                  item.cantidad_requerida + 0.5
                )}
                className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>

    <div className="flex gap-3 pt-4">
      <button
        onClick={() => setOpenRecetaEdit(false)}
        className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        Cancelar
      </button>
      <button
        onClick={handleAgregarConRecetaPersonalizada}
        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        Agregar al Carrito
      </button>
    </div>
  </div>
</DrawerRight>
```

### 5. Sección de Variantes en Drawer de Personalización

```tsx
{/* Sección de Variantes */}
{customProd && customProd.variantes && customProd.variantes.length > 0 && (
  <div className="border-t pt-6">
    <h3 className="font-bold text-lg mb-3">Variantes Disponibles</h3>
    <div className="space-y-2">
      <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
        <input
          type="radio"
          name="variante"
          checked={customVariante === undefined}
          onChange={() => setCustomVariante(undefined)}
          className="w-5 h-5"
        />
        <span className="flex-1">Sin variante (precio base)</span>
        <span className="font-semibold">Q{customProd.precio_venta.toFixed(2)}</span>
      </label>
      
      {customProd.variantes.map((variante) => (
        <label
          key={variante.id_variante}
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <input
            type="radio"
            name="variante"
            checked={customVariante === variante.id_variante}
            onChange={() => setCustomVariante(variante.id_variante)}
            className="w-5 h-5"
          />
          <span className="flex-1">{variante.nombre_variante}</span>
          <span className="font-semibold">
            +Q{variante.precio_variante.toFixed(2)}
          </span>
        </label>
      ))}
    </div>
  </div>
)}
```

### 6. Campo de Notas en Drawer de Personalización

```tsx
{/* Campo de Notas */}
<div className="border-t pt-6">
  <h3 className="font-bold text-lg mb-3">Notas Adicionales</h3>
  <textarea
    value={customNotas}
    onChange={(e) => setCustomNotas(e.target.value)}
    placeholder="Ej: Sin cebolla, extra salsa, etc..."
    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    rows={3}
  />
  <p className="text-sm text-gray-500 mt-2">
    Las notas se incluirán en el ticket de venta
  </p>
</div>
```

### 7. Actualizar función addToCart

```typescript
const addToCart = (
  prod: Producto,
  mods?: string,
  qty: number = 1,
  idVariante?: number,
  recetaPersonalizada?: RecetaDetalle[],
  notas?: string
) => {
  setCarrito((prev) => {
    const existe = prev.find(
      (c) =>
        c.producto.id_producto === prod.id_producto &&
        (c.mods || '') === (mods || '') &&
        c.id_variante === idVariante &&
        !recetaPersonalizada // Si tiene receta personalizada, siempre es nueva línea
    );

    if (existe && !recetaPersonalizada) {
      return prev.map((c) =>
        c.producto.id_producto === prod.id_producto &&
        (c.mods || '') === (mods || '') &&
        c.id_variante === idVariante
          ? { ...c, qty: c.qty + qty }
          : c
      );
    } else {
      return [
        ...prev,
        {
          producto: prod,
          qty,
          mods,
          id_variante: idVariante,
          receta_personalizada: recetaPersonalizada,
          notas
        }
      ];
    }
  });
};
```

### 8. Botón en tarjeta de producto para abrir receta editable

```tsx
<div className="absolute top-2 right-2 flex gap-2">
  {/* Botón Ver/Editar Receta */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleOpenRecetaEditable(prod.id_producto);
    }}
    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-white transition-colors"
    title="Ver/Editar Receta"
  >
    <Edit3 className="w-5 h-5 text-emerald-600" />
  </button>
</div>
```

---

## 📝 RESUMEN DE ARCHIVOS MODIFICADOS

### Base de Datos
1. ✅ `database/2025-11-06_ventas_mejoras_flujo.sql` - Script completo de mejoras

### Frontend
1. ⏳ `frontend/src/features/Dashboard/Ventas/Ventas/Ventas.tsx` - Componente principal
2. ⏳ `frontend/src/api/productosService.ts` - Agregar método para variantes

---

## 🧪 CASOS DE PRUEBA

### Test 1: Venta con Receta Base
1. Agregar producto al carrito
2. Confirmar venta
3. Verificar en `movimiento_inventario` que se descontaron los insumos de `receta_detalle`

### Test 2: Venta con Variante
1. Agregar producto con variante al carrito
2. Confirmar venta
3. Verificar descuento de:
   - Insumos de receta base
   - Insumo de la variante seleccionada

### Test 3: Venta con Receta Personalizada
1. Abrir editor de receta
2. Modificar cantidades
3. Agregar al carrito
4. Verificar que muestra "Receta personalizada" en el carrito

### Test 4: Notas en Venta
1. Agregar notas en el customizer
2. Agregar al carrito
3. Confirmar venta
4. Verificar que las notas se guardaron en la tabla `venta`

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Ejecutar script SQL en base de datos
2. ⏳ Implementar estados y funciones en componente Ventas
3. ⏳ Crear componente DrawerRecetaEditable
4. ⏳ Agregar sección de variantes en customizer
5. ⏳ Agregar campo de notas en customizer
6. ⏳ Actualizar función de confirmación de pago para incluir notas
7. ⏳ Probar flujo completo de venta
8. ⏳ Validar descuentos de inventario en BD

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Receta Personalizada es Temporal**: Los cambios en la receta solo aplican para esa venta específica, NO modifican la receta global del producto.

2. **Variantes y Descuento**: Cuando se selecciona una variante, se descuenta:
   - Los insumos de la receta base (siempre)
   - El insumo asociado a la variante (si existe `id_insumo` en `producto_variante`)

3. **Notas**: Se guardan a nivel de `venta`, no por cada producto. Si necesitas notas por producto, considera agregar campo en `detalle_venta`.

4. **Inventario Operativo**: Los insumos con `tipo_categoria = 'operativo'` NO se descuentan automáticamente.

---

## 📞 SOPORTE

Si tienes dudas sobre la implementación:
- Revisar los comentarios en el código
- Consultar `database_complete_new.sql` para estructura de BD
- Verificar logs en `movimiento_inventario` para debugging
