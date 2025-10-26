import { createContext, useState, useEffect, ReactNode } from 'react';
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
  const [loading, setLoading] = useState(true); // Iniciar en true para evitar problemas de timing

  const refreshUser = async () => {
    try {
      setLoading(true);
      console.log('🔄 AuthContext - Iniciando refreshUser');
      
      // Verificar si hay token en localStorage
      const token = localStorage.getItem('access_token');
      console.log('🔍 AuthContext - Token en localStorage:', token ? 'Presente' : 'Ausente');
      
      if (!token) {
        // No hay token, usuario no autenticado
        console.log('❌ AuthContext - No hay token, usuario no autenticado');
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      
      // Intentar validar el token con el backend
      console.log('📡 AuthContext - Validando token con backend...');
      const validatedUser = await validateToken();
      console.log('📡 AuthContext - Respuesta de validateToken:', validatedUser ? 'Usuario válido' : 'Usuario inválido');
      
      if (validatedUser) {
        setUser(validatedUser);
        setRole(validatedUser.role.nombre_rol);
        console.log('✅ AuthContext - Usuario validado correctamente');
      } else {
        // Token inválido, limpiar todo
        console.log('❌ AuthContext - Token inválido, limpiando datos');
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
    // Verificar token al montar el componente
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false); // Si no hay token, terminar loading
    }
  }, []); // Solo se ejecuta una vez al montar

  const value = { user, role, loading, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Exportamos el contexto para usos avanzados si es necesario
export { AuthContext };