import { supabase } from './supabaseClient';

export const setUsuarioRol = async (id_perfil: string, id_rol: number | null) => {
  // Si id_rol es null -> eliminar asignaciones
  if (!id_rol) {
    const { error } = await supabase.from('usuario_rol').delete().eq('id_perfil', id_perfil);
    if (error) throw error;
    return null;
  }

  // Intentar insertar, y si ya existe no duplicar
  const { data: existing } = await supabase.from('usuario_rol').select('*').eq('id_perfil', id_perfil).eq('id_rol', id_rol).single();
  if (existing) return existing;

  const { data, error } = await supabase.from('usuario_rol').insert([{ id_perfil, id_rol }]).select().single();
  if (error) throw error;
  return data;
};
