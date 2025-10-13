import { supabase } from './supabaseClient';

export const getRoles = async () => {
  const { data, error } = await supabase
    .from('rol_usuario')
    .select('id_rol, nombre')
    .order('nivel_permisos', { ascending: false });

  if (error) throw error;
  return data || [];
};
