import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { validateToken, AuthUser } from '../api/authService';

// Definimos la estructura de lo que nuestro contexto proveerá
interface AuthContextType {
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creamos el "Proveedor" que envolverá nuestra aplicación
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Cambiar a false inicialmente

  const refreshUser = async () => {
    try {
      setLoading(true);
      
      // Verificar si hay token en localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // No hay token, usuario no autenticado
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      
      // Intentar validar el token con el backend
      const validatedUser = await validateToken();
      
      if (validatedUser) {
        setUser(validatedUser);
        setRole(validatedUser.rol);
      } else {
        // Token inválido, limpiar todo
        setUser(null);
        setRole(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.error('Error al validar usuario:', err);
      setUser(null);
      setRole(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Solo verificar si hay token, no llamar a la API inmediatamente
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshUser();
    }
  }, []); // Solo se ejecuta una vez al montar

  const value = { user, role, loading, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar nuestro contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};