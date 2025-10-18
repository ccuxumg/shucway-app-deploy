// ================================================================
// 🔐 VALIDATE TOKEN (USANDO BACKEND JWT)
// ================================================================
// Este archivo mantiene compatibilidad con el código existente
// pero ahora usa el nuevo servicio de autenticación

import { validateToken as validateJWT } from './authService';

export const validateToken = async (): Promise<boolean> => {
  const user = await validateJWT();
  return user !== null;
};
