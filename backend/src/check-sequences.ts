import { supabase } from './config/database.js';

async function checkSequences() {
  try {
    // Verificar secuencias actuales
    const sequences = [
      'recepcion_mercaderia_id_recepcion_seq',
      'detalle_recepcion_mercaderia_id_detalle_seq',
      'orden_compra_id_orden_seq',
      'detalle_orden_compra_id_detalle_seq',
      'movimiento_inventario_id_movimiento_seq',
      'lote_insumo_id_lote_seq'
    ];

    console.log('=== VERIFICACIÓN DE SECUENCIAS ===\n');

    for (const seq of sequences) {
      try {
        const { data: seqValue } = await supabase.rpc('currval', { sequence_name: seq });
        console.log(`Secuencia ${seq}: ${seqValue || 'NULL (nunca usada)'}`);
      } catch (error) {
        console.log(`Secuencia ${seq}: ERROR - ${(error as Error).message}`);
      }
    }

    console.log('\n=== MÁXIMOS VALORES EN TABLAS ===\n');

    // Verificar máximos en tablas
    const tables = [
      { table: 'recepcion_mercaderia', column: 'id_recepcion' },
      { table: 'detalle_recepcion_mercaderia', column: 'id_detalle' },
      { table: 'orden_compra', column: 'id_orden' },
      { table: 'detalle_orden_compra', column: 'id_detalle' },
      { table: 'movimiento_inventario', column: 'id_movimiento' },
      { table: 'lote_insumo', column: 'id_lote' }
    ];

    for (const { table, column } of tables) {
      const { data: maxData, error: maxError } = await supabase
        .from(table)
        .select(column)
        .order(column, { ascending: false })
        .limit(1);

      if (maxError) {
        console.log(`Tabla ${table}.${column}: ERROR - ${maxError.message}`);
      } else {
        const maxValue = maxData && maxData.length > 0 ? maxData[0][column as keyof typeof maxData[0]] : 0;
        console.log(`Tabla ${table}.${column}: MAX = ${maxValue}`);
      }
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

checkSequences();