import { supabase } from './supabaseClient';

export const getUsuarioRoles = async (id_perfil: string) => {
  const { data, error } = await supabase
    .from('perfil_usuario')
    .select('id_rol, rol_usuario!inner(nombre_rol)')
    .eq('id_perfil', id_perfil);

  if (error) throw error;
  return data || [];
};
