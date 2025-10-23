// ================================================================
// 🔐 HANDLE LOGIN (USANDO SUPABASE)
// ================================================================

import { message } from "antd";
import { supabase } from "./supabaseClient";

export const handleLogin = async (identifier: string, password: string): Promise<boolean> => {
  const { data: session, error } = await supabase.auth.signInWithPassword({
    email: identifier,
    password,
  });
  if (error) {
    message.error(error.message);
    return false;
  } else {
    const token = session?.session?.access_token;
    if (token) {
      message.success("¡Sesión iniciada correctamente!");
      return true;
    }
  }
  return false;
};
