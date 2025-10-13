import { supabase } from "./supabaseClient";
import { UsuarioDataType } from "../types";

interface AddUsuarioParams {
  email: string;
  password: string;
  role: "admin" | "user";
  perfil: Omit<UsuarioDataType, "id_perfil" | "fecha_registro" | "auth_id">;
}

export const addUsuario = async ({
  email,
  password,
  role,
  perfil
}: AddUsuarioParams) => {
  // Primero crear el usuario en auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role
      }
    }
  });

  if (authError) throw new Error(authError.message);

  if (!authData.user) throw new Error("No se pudo crear el usuario");

  // Luego crear el perfil
  const { data: profileData, error: profileError } = await supabase
    .from("perfil_usuario")
    .insert([{
      id_perfil: authData.user.id,
      ...perfil,
      estado: 'activo'
    }])
    .select();

  if (profileError) {
    // Nota: No se puede eliminar el usuario con anon key, manejar manualmente
    console.error('Error al crear perfil:', profileError);
    throw new Error(profileError.message);
  }

  // Asignar rol al usuario
  const roleName = role === 'admin' ? 'Administrador' : 'Cajero'; // Ajustar según roles en BD
  const { error: roleError } = await supabase
    .from('usuario_rol')
    .insert([{
      id_perfil: authData.user.id,
      id_rol: (await supabase.from('rol_usuario').select('id_rol').eq('nombre', roleName).single()).data?.id_rol
    }]);

  if (roleError) {
    console.error('Error al asignar rol:', roleError);
    // No throw aquí, ya que el perfil se creó
  }

  return profileData;
};
