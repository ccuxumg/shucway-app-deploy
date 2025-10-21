import { supabase } from './supabaseClient';

export const setUsuarioRol = async (id_perfil: string, id_rol: number | null) => {
  // Si id_rol es null -> no hacer nada o setear a default
  if (!id_rol) {
    // No se puede eliminar el rol ya que es NOT NULL, quizás setear a 'cliente'
    const { data: clienteRol } = await supabase.from('rol_usuario').select('id_rol').eq('nombre_rol', 'cliente').single();
    if (clienteRol) {
      const { data, error } = await supabase
        .from('perfil_usuario')
        .update({ id_rol: clienteRol.id_rol })
        .eq('id_perfil', id_perfil)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return null;
  }

  // Actualizar el rol en perfil_usuario
  const { data, error } = await supabase
    .from('perfil_usuario')
    .update({ id_rol: id_rol })
    .eq('id_perfil', id_perfil)
    .select()
    .single();
  if (error) throw error;
  return data;
};
