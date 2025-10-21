// ================================================================
// 🔐 HANDLE LOGIN (USANDO BACKEND JWT)
// ================================================================
// Este archivo mantiene compatibilidad con el código existente
// pero ahora usa el nuevo servicio de autenticación

import { login } from './authService';

export const handleLogin = async (identifier: string, password: string): Promise<boolean> => {
  return await login({ identifier, password });
};
