import { supabase } from './config/database.js';

async function runQuery() {
  try {
    // Ver movimientos de entrada relacionados con recepciones
    const { data: entradaMovimientos, error: entError } = await supabase
      .from('movimiento_inventario')
      .select('*')
      .eq('tipo_movimiento', 'entrada')
      .not('id_referencia', 'is', null)
      .order('fecha_movimiento', { ascending: false });

    if (entError) throw entError;
    console.log('Movimientos de entrada por recepción:', entradaMovimientos);

    // Ver detalles de recepción para una orden específica
    const { data: detallesRec, error: detRecError } = await supabase
      .from('detalle_recepcion_mercaderia')
      .select('*')
      .eq('id_recepcion', 6)  // La recepción más reciente
      .limit(10);

    if (detRecError) throw detRecError;
    console.log('Detalles de recepción para id_recepcion=6:', detallesRec);

    // Verificar triggers en orden_compra
    const { data: triggersOC, error: triggersError } = await supabase.rpc('sql', {
      query: "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'orden_compra';"
    });

    if (triggersError) throw triggersError;

    console.log('Triggers en orden_compra:', triggersOC);

    // Verificar stock actual de algunos insumos
    const { data: stock, error: stockError } = await supabase
      .from('lote_insumo')
      .select('id_insumo, cantidad_actual')
      .limit(5);

    if (stockError) throw stockError;
    console.log('Stock en lotes:', stock);

    // Verificar si hay órdenes con detalles
    const { data: detallesOC, error: detOCError } = await supabase
      .from('detalle_orden_compra')
      .select('*')
      .eq('id_orden', 6)
      .limit(10);

    if (detOCError) throw detOCError;
    console.log('Detalles de orden de compra 6:', detallesOC);

  } catch (error) {
    console.error('Error:', error);
  }
}

runQuery();