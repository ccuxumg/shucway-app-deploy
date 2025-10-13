import { supabase } from './supabaseClient';

export const getUsuarioRoles = async (id_perfil: string) => {
  const { data, error } = await supabase
    .from('usuario_rol')
    .select('id_rol, rol_usuario!left(nombre)')
    .eq('id_perfil', id_perfil);

  if (error) throw error;
  return data || [];
};
