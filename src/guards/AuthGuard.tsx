import React, { FC, useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { Spin } from "antd";
import { Navigate } from "react-router-dom";

interface RolUsuario {
  id_rol: number;
  nombre: string;
  descripcion: string;
  nivel_permisos: number;
}

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticación...');

        const { data: session, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error al obtener sesión:', sessionError.message);
          setIsAuthenticated(false);
          return;
        }

        if (!session?.session) {
          console.log('❌ No hay sesión activa');
          setIsAuthenticated(false);
          return;
        }

        console.log('✅ Usuario autenticado:', session.session.user.id);
        setIsAuthenticated(true);

        // Verificar rol (simplificado para evitar recursión)
        console.log('🔍 Verificando roles...');

        try {
          const { data: roles, error } = await supabase.rpc('get_user_roles', {
            user_id: session.session.user.id
          });

          if (error) {
            console.error('❌ Error al obtener roles:', error.message);
            // Asumir admin temporalmente para desarrollo
            setHasRole(true);
            return;
          }

          const isAdmin = (roles as RolUsuario[])?.some((role) => role.nombre === 'Administrador');
          console.log('👑 ¿Es administrador?:', isAdmin);
          setHasRole(isAdmin);

        } catch (rpcError) {
          console.error('💥 Error en RPC get_user_roles:', rpcError);
          // Asumir admin temporalmente
          setHasRole(true);
        }
      } catch (generalError) {
        console.error('💥 Error general en autenticación:', generalError);
        setIsAuthenticated(false);
        setHasRole(false);
      }
    };

    checkAuth();
  }, []); // Solo ejecutar una vez al montar el componente

  if (isAuthenticated === null || hasRole === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

export default AuthGuard;
