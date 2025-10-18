import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Hook personalizado para usar nuestro contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
