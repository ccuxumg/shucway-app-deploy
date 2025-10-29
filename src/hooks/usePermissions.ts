// ================================================================
// 🔐 HOOK DE PERMISOS
// ================================================================
// Hook personalizado para verificar permisos del usuario actual

import { useAuth } from './useAuth';

// Niveles de permiso para módulos específicos
// Números más altos = más permisos
export const MODULE_PERMISSIONS = {
  DASHBOARD: 0,        // Todos pueden ver (nivel mínimo)
  REPORTES: 30,        // Cajeros y superiores
  INVENTARIO: 30,      // Cajeros y superiores
  VENTAS: 50,          // Vendedores y superiores
  PRODUCTOS: 60,       // Gerentes y superiores
  USUARIOS: 80,        // Solo administradores y superiores
  CONFIGURACION: 90,   // Solo administradores
} as const;

export const usePermissions = () => {
  const authContext = useAuth();

  // Verificar que el contexto tenga las propiedades necesarias
  const hasPermission = authContext?.hasPermission || (() => false);
  const roleLevel = authContext?.roleLevel || null;
  const role = authContext?.role || null;

  // Función para verificar si el usuario puede acceder a un módulo
  const canAccessModule = (moduleName: keyof typeof MODULE_PERMISSIONS): boolean => {
    const requiredLevel = MODULE_PERMISSIONS[moduleName];
    return hasPermission(requiredLevel);
  };

  // Función específica para roles con nivel <= 30 (como cajero)
  const isLimitedUser = (): boolean => {
    return roleLevel !== null && roleLevel <= 30;
  };

  // Módulos permitidos para usuarios limitados
  const getAllowedModulesForLimitedUser = () => {
    if (!isLimitedUser()) return Object.keys(MODULE_PERMISSIONS);

    return ['VENTAS', 'REPORTES'];
  };

  // Verificar si un módulo está permitido para el usuario actual
  const isModuleAllowed = (moduleName: string): boolean => {
    if (!isLimitedUser()) return true;

    const allowedModules = getAllowedModulesForLimitedUser();
    return allowedModules.includes(moduleName);
  };

  // Funciones de compatibilidad con el sistema anterior
  const checkPermission = (requiredLevel: number): boolean => {
    return hasPermission(requiredLevel);
  };

  const getUserLevel = (): number => {
    return roleLevel || 0;
  };

  const isPropietario = (): boolean => {
    return role?.toLowerCase() === 'propietario';
  };

  const isAdministrador = (): boolean => {
    const level = getUserLevel();
    return level >= 80;
  };

  const isCajero = (): boolean => {
    const level = getUserLevel();
    return level >= 30;
  };

  return {
    canAccessModule,
    isLimitedUser,
    getAllowedModulesForLimitedUser,
    isModuleAllowed,
    checkPermission,
    getUserLevel,
    isPropietario,
    isAdministrador,
    isCajero,
    roleLevel,
    role,
  };
};
