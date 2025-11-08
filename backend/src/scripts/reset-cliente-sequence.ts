import { supabase } from '../config/database';

export async function resetClienteSequence() {
  try {
    console.log('🔄 Reseteando secuencia de tabla cliente...');

    // Obtener el máximo id_cliente actual
    const { data: maxId, error: maxError } = await supabase
      .from('cliente')
      .select('id_cliente')
      .order('id_cliente', { ascending: false })
      .limit(1);

    if (maxError) {
      console.error('❌ Error obteniendo máximo ID:', maxError);
      return false;
    }

    const maxIdValue = maxId && maxId.length > 0 ? maxId[0].id_cliente : 0;
    console.log(`📊 Máximo id_cliente actual: ${maxIdValue}`);

    // Resetear la secuencia
    const { error: resetError } = await supabase.rpc('reset_cliente_sequence', {
      max_id: maxIdValue
    });

    if (resetError) {
      console.error('❌ Error reseteando secuencia:', resetError);
      return false;
    }

    console.log('✅ Secuencia de cliente reseteada exitosamente');
    return true;

  } catch (error) {
    console.error('❌ Error en resetClienteSequence:', error);
    return false;
  }
}

// Función para ejecutar desde línea de comandos
if (require.main === module) {
  resetClienteSequence()
    .then((success) => {
      if (success) {
        console.log('🎉 Proceso completado exitosamente');
        process.exit(0);
      } else {
        console.log('❌ Proceso fallido');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}