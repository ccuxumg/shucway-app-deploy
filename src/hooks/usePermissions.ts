// ================================================================
// 🔐 HOOK DE PERMISOS
// ================================================================
// Hook personalizado para verificar permisos del usuario actual

import { useAuth } from '../hooks/useAuth';
import { hasPermission, getRoleLevel } from '../constants/permissions';

export const usePermissions = () => {
  const { user, role, loading } = useAuth();

  /**
   * Verifica si el usuario tiene el nivel de permiso requerido
   * @param requiredLevel - Nivel mínimo de permiso requerido
   * @returns true si el usuario tiene permiso, false en caso contrario
   */
  const checkPermission = (requiredLevel: number): boolean => {
    if (!user || !role) return false;
    return hasPermission(role, requiredLevel);
  };

  /**
   * Obtiene el nivel de permiso del usuario actual
   * @returns Nivel de permiso del usuario (0 si no autenticado)
   */
  const getUserLevel = (): number => {
    return getRoleLevel(role);
  };

  /**
   * Verifica si el usuario es propietario
   */
  const isPropietario = (): boolean => {
    return role?.toLowerCase() === 'propietario';
  };

  /**
   * Verifica si el usuario es administrador o superior
   */
  const isAdministrador = (): boolean => {
    const level = getUserLevel();
    return level >= 80;
  }

  /**
   * Verifica si el usuario es cajero o superior
   */
  const isCajero = (): boolean => {
    const level = getUserLevel();
    return level >= 30; // Cajero nivel 30 en la BD
  }

  return {
    // Estado
    user,
    role,
    loading,
    
    // Funciones de verificación
    checkPermission,
    getUserLevel,
    
    // Helpers de roles específicos
    isPropietario,
    isAdministrador,
    isCajero,
  };
};
