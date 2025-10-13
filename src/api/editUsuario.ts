import { supabase } from "./supabaseClient";
import { UsuarioDataType } from "../types";

export const editUsuario = async (updatedata: Partial<UsuarioDataType>) => {
  const { id_perfil, ...body } = updatedata;
  const { data, error } = await supabase
    .from("perfil_usuario")
    .update(body)
    .eq("id_perfil", id_perfil)
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
