// ============================================================
// OBTENER PERFIL COMPLETO DEL USUARIO AUTENTICADO
// ============================================================
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'No se pudo obtener el perfil');
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
};
// ================================================================
// 🔐 SERVICIO DE AUTENTICACIÓN
// ================================================================
// Maneja login, logout, registro y validación de token

import { message } from 'antd';
import api from './apiClient';

// Interfaces
export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  primer_nombre: string;
  primer_apellido: string;
  segundo_nombre?: string;
  segundo_apellido?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  username?: string;
}

export interface AuthUser {
  id_perfil: number;
  nombre: string;
  email: string;
  username: string;
  role: {
    id_rol: number;
    nombre_rol: string;
    nivel_permiso: number;
  };
  avatar_url?: string | null;
  estado?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    refreshToken: string;
    user: AuthUser;
  };
}

// ============================================================
// LOGIN
// ============================================================
export const login = async (credentials: LoginCredentials): Promise<boolean> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('access_token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      message.success('¡Sesión iniciada correctamente!');
      return true;
    }
    message.error(response.data.message || 'Error al iniciar sesión');
    return false;
  } catch (error: unknown) {
    console.error('Error en login:', error);
    const errorMessage = error instanceof Error && 'response' in error 
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al iniciar sesión'
      : 'Error al iniciar sesión';
    message.error(errorMessage);
    return false;
  }
};

// ============================================================
// LOGOUT
// ============================================================
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    // Limpiar localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    message.success('Sesión cerrada correctamente');
  }
};

// ============================================================
// REGISTRO
// ============================================================
export const register = async (data: RegisterData): Promise<boolean> => {
  try {
    const response = await api.post<LoginResponse>('/auth/register', data);
    
    if (response.data.success) {
      // Guardar token y usuario en localStorage
      localStorage.setItem('access_token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      message.success('¡Registro exitoso!');
      return true;
    }
    
    message.error(response.data.message || 'Error al registrar usuario');
    return false;
  } catch (error: unknown) {
    console.error('Error en registro:', error);
    const errorMessage = error instanceof Error && 'response' in error
      ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Error al registrar usuario'
      : 'Error al registrar usuario';
    message.error(errorMessage);
    return false;
  }
};

// ============================================================
// VALIDAR TOKEN
// ============================================================
export const validateToken = async (): Promise<AuthUser | null> => {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('❌ validateToken - No hay token en localStorage');
      return null;
    }

    console.log('📡 validateToken - Enviando token para validación');
    const response = await api.get<{ success: boolean; data: AuthUser }>('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data.success) {
      // Actualizar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data));
      console.log('✅ validateToken - Token validado correctamente');
      return response.data.data;
    }

    console.log('❌ validateToken - Respuesta no exitosa');
    return null;
  } catch (error) {
    console.error('Error al validar token:', error);
    // Limpiar localStorage si el token es inválido
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    return null;
  }
};

// ============================================================
// OBTENER USUARIO ACTUAL DEL LOCALSTORAGE
// ============================================================
export const getCurrentUser = (): AuthUser | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

// ============================================================
// VERIFICAR SI ESTÁ AUTENTICADO
// ============================================================
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('access_token');
  const user = getCurrentUser();
  return !!(token && user);
};
