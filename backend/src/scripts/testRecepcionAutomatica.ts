import { supabase } from '../config/database';
import { createOrdenCompra, createDetalleOrdenCompra, getOrdenCompraById } from '../services/orden_compra.service';
import { inventarioService } from '../services/inventario.service';

function fmt(amount: number | null | undefined): string {
  if (!amount) return '0.00';
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);
}

async function ensurePerfil() {
  const { data, error } = await supabase
    .from('perfil_usuario')
    .select('id_perfil, primer_nombre, primer_apellido')
    .eq('estado', 'activo')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener un perfil activo: ${error.message}`);
  }
  if (!data) {
    throw new Error('No existen perfiles activos en la base de datos. Crea al menos uno antes de ejecutar esta prueba.');
  }
  return data;
}

async function ensureProveedor() {
  const { data, error } = await supabase
    .from('proveedor')
    .select('id_proveedor, nombre_empresa, nombre')
    .eq('activo', true)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener un proveedor activo: ${error.message}`);
  }
  if (!data) {
    throw new Error('No existen proveedores activos. Registra al menos uno para ejecutar la prueba.');
  }
  return {
    id_proveedor: data.id_proveedor,
    nombre: data.nombre_empresa ?? data.nombre ?? `Proveedor #${data.id_proveedor}`,
  };
}

async function ensurePresentacion() {
  const { data, error } = await supabase
    .from('insumo_presentacion')
    .select(
      `id_presentacion,
       id_insumo,
       descripcion_presentacion,
       unidades_por_presentacion,
       costo_compra_unitario,
       insumo:insumo(
         id_insumo,
         nombre_insumo,
         unidad_base,
         costo_promedio
       )`
    )
    .eq('activo', true)
    .order('es_principal', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener una presentación activa: ${error.message}`);
  }
  if (!data || !data.insumo) {
    throw new Error('No se encontró ninguna presentación activa asociada a un insumo. Crea insumos y presentaciones antes de ejecutar la prueba.');
  }

  const insumoRelacion = Array.isArray(data.insumo) ? data.insumo[0] : data.insumo;

  if (!insumoRelacion) {
    throw new Error('La presentación recuperada no tiene información de insumo asociada.');
  }

  return {
    id_presentacion: data.id_presentacion,
    id_insumo: data.id_insumo,
    descripcion: data.descripcion_presentacion,
    unidades: data.unidades_por_presentacion ?? 1,
    costoCompra: data.costo_compra_unitario ?? insumoRelacion.costo_promedio ?? 10,
    insumoNombre: insumoRelacion.nombre_insumo,
  };
}

async function main() {
  try {
    console.log('=== Prueba automática de recepción de mercadería ===');

    const [perfil, proveedor, presentacion] = await Promise.all([
      ensurePerfil(),
      ensureProveedor(),
      ensurePresentacion(),
    ]);

    console.log('Perfil usado:', perfil);
    console.log('Proveedor usado:', proveedor);
    console.log('Presentación seleccionada:', presentacion);

    const cantidadSolicitada = 3;
    const precioUnitario = presentacion.costoCompra;
    const fechaOrden = new Date();
    const fechaEntrega = new Date(fechaOrden.getTime() + 3 * 24 * 60 * 60 * 1000);

    const orden = await createOrdenCompra({
      fecha_orden: fechaOrden.toISOString(),
      fecha_entrega_estimada: fechaEntrega.toISOString().slice(0, 10),
      id_proveedor: proveedor.id_proveedor,
      estado: 'pendiente',
      tipo_orden: 'manual',
      motivo_generacion: `Prueba automática ${fechaOrden.toISOString()}`,
      total: cantidadSolicitada * precioUnitario,
      creado_por: perfil.id_perfil,
    });

    if (!orden?.id_orden) {
      throw new Error('No se pudo crear la orden de compra de prueba.');
    }

    console.log(`Orden creada (#${orden.id_orden}) en estado ${orden.estado}.`);

    await createDetalleOrdenCompra({
      id_orden: orden.id_orden,
      id_insumo: presentacion.id_insumo,
      cantidad: cantidadSolicitada,
      precio_unitario: precioUnitario,
      id_presentacion: presentacion.id_presentacion,
    });

    console.log('Detalle de orden insertado/actualizado.');

    await new Promise((resolve) => setTimeout(resolve, 800));

    const recepcion = await inventarioService.createRecepcionMercaderia({
      id_orden: orden.id_orden,
      fecha_recepcion: new Date().toISOString().slice(0, 10),
      id_perfil: perfil.id_perfil,
    });

    console.log('Recepción generada:', recepcion);

    const ordenActualizada = await getOrdenCompraById(orden.id_orden);
    console.log(`Estado final de OC #${orden.id_orden}:`, ordenActualizada?.estado);

    const { data: detallesRecepcion, error: detallesError } = await supabase
      .from('detalle_recepcion_mercaderia')
      .select(`
        id_detalle,
        cantidad_recibida,
        cantidad_aceptada,
        id_lote,
        id_presentacion,
        insumo_presentacion:insumo_presentacion(descripcion_presentacion, unidades_por_presentacion),
        lote_insumo:lote_insumo(cantidad_actual, costo_unitario)
      `)
      .eq('id_recepcion', recepcion.id_recepcion);

    if (detallesError) {
      throw new Error(`No se pudieron obtener los detalles de la recepción: ${detallesError.message}`);
    }

    console.log('Detalles de recepción vinculados:', detallesRecepcion);

    const { data: movimientos, error: movimientosError } = await supabase
      .from('movimiento_inventario')
      .select('id_movimiento, id_insumo, cantidad, tipo_movimiento, descripcion, fecha_movimiento, costo_unitario_momento')
      .eq('id_referencia', recepcion.id_recepcion)
      .order('fecha_movimiento', { ascending: false });

    if (movimientosError) {
      throw new Error(`No se pudieron obtener los movimientos generados: ${movimientosError.message}`);
    }

    console.log('Movimientos de inventario generados:', movimientos);

    const { data: lotes, error: lotesError } = await supabase
      .from('lote_insumo')
      .select('id_lote, id_insumo, cantidad_actual, costo_unitario, fecha_vencimiento')
      .eq('id_insumo', presentacion.id_insumo)
      .order('fecha_vencimiento', { ascending: true });

    if (lotesError) {
      throw new Error(`No se pudo consultar el stock por lote: ${lotesError.message}`);
    }

    console.log('Stock por lote para el insumo utilizado:', lotes);

    console.log('=== Resumen de prueba ===');
    console.log(`OC #${orden.id_orden} → estado final: ${ordenActualizada?.estado || 'desconocido'}`);
    console.log(`Recepción #${recepcion.id_recepcion} → detalles insertados: ${recepcion.detalles_creados}`);
    console.log(`Movimientos aplicados: ${recepcion.sincronizacion?.movimientos.movimientosAplicados ? 'Sí' : 'No'}`);
    console.log(`Unidades base totales: ${recepcion.sincronizacion?.movimientos.cantidadBaseTotal ?? 0}`);
    console.log(`Resumen recibido:`, recepcion.sincronizacion);
    console.log(`Total OC reportado: ${fmt(ordenActualizada?.total)}`);
  } catch (error) {
    console.error('❌ La prueba automática falló:', error);
    process.exitCode = 1;
  } finally {
    await supabase.removeAllChannels();
  }
}

main();
