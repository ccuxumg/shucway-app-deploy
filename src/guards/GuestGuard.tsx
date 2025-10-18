import React, { FC } from "react";
import { Spin } from "antd";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface GuestGuardProps {
  children: React.ReactNode;
}

const GuestGuard: FC<GuestGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Mostrar loader mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        gap: '16px'
      }}>
        <Spin size="large" />
        <span style={{ color: '#666' }}>Verificando autenticación...</span>
      </div>
    );
  }

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Usuario no autenticado, mostrar página de login
  return <>{children}</>;
};

export default GuestGuard;
