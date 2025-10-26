// ================================================================
// 🔐 HANDLE LOGIN (USANDO BACKEND JWT)
// ================================================================

import { message } from "antd";
import api from "./apiClient";

export const handleLogin = async (identifier: string, password: string): Promise<boolean> => {
  try {
    const response = await api.post('/auth/login', {
      identifier,
      password,
    });

    if (response.data.success) {
      // Guardar el token JWT en localStorage
      const { token, refreshToken, user } = response.data.data;
      console.log('💾 Guardando token en localStorage:', token ? 'Token presente' : 'Token ausente');
      localStorage.setItem('access_token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Token guardado correctamente en localStorage');

      message.success("¡Sesión iniciada correctamente!");
      return true;
    } else {
      message.error(response.data.error || "Error al iniciar sesión");
      return false;
    }
  } catch (error: unknown) {
    console.error('Error en login:', error);

    // Manejar diferentes tipos de errores
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
      if (axiosError.response?.status === 400) {
        message.error("Credenciales incorrectas. Verifica tu usuario y contraseña.");
      } else if (axiosError.response?.status === 401) {
        message.error("Usuario no autorizado.");
      } else if (axiosError.response?.status === 429) {
        message.error("Demasiados intentos. Intenta más tarde.");
      } else {
        message.error(axiosError.response?.data?.error || "Error al conectar con el servidor");
      }
    } else {
      message.error("Error al conectar con el servidor");
    }

    return false;
  }
};
