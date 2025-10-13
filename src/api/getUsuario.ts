import { supabase } from './supabaseClient';

export const getUsuario = async (id_perfil: string) => {
  try {
    // Intentar desde la vista completa (si existe)
    const { data, error } = await supabase
      .from('vw_usuarios_completo')
      .select('*')
      .eq('id_perfil', id_perfil)
      .single();

    if (!error) return data || null;

    // Si hay un error por permisos, hacer fallback a tabla perfil_usuario
    const errMsg = (error as { message?: string })?.message || '';
    if (String(errMsg).toLowerCase().includes('permission denied')) {
      console.log('🔁 Fallback: consultando desde tabla base (perfil_usuario)');

      const { data: perfil, error: perfilError } = await supabase
        .from('perfil_usuario')
        .select('*')
        .eq('id_perfil', id_perfil)
        .single();

      if (perfilError) throw perfilError;
      return perfil || null;
    }

    throw error;
  } catch (err) {
    console.error('Error en getUsuario:', err);
    throw err;
  }
};
