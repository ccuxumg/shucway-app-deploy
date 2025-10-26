// ================================================================
// 🔧 CONFIGURACIÓN DEL CLIENTE API
// ================================================================
// Este archivo configura axios para comunicarse con el backend

import axios from 'axios';

// URL del backend
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔍 API Client - Token en localStorage:', token ? 'Presente' : 'Ausente');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ API Client - Authorization header agregado');
    } else {
      console.log('❌ API Client - No hay token para agregar al header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('access_token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
