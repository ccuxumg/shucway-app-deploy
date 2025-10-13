import { supabase } from "./supabaseClient";

export const deleteUsuario = async (usuarioId: string) => {
  const { data, error } = await supabase
    .from("perfil_usuario")
    .delete()
    .eq("id_perfil", usuarioId);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
