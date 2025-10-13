import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../api/supabaseClient';
import { User } from '@supabase/supabase-js';

// Definimos la estructura de lo que nuestro contexto proveerá
interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creamos el "Proveedor" que envolverá nuestra aplicación
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        if (!mounted) return;
        setUser(currentUser);

        if (currentUser) {
          // Si hay un usuario, buscamos su rol en la base de datos
          const { data: profile, error } = await supabase
            .from('perfil_usuario')
            .select('rol_usuario ( nombre )')
            .eq('id_perfil', currentUser.id)
            .single();

          if (!error && profile && profile.rol_usuario && profile.rol_usuario.length > 0) {
            setRole(profile.rol_usuario[0].nombre);
          }
        } else {
          setRole(null);
        }
      } catch (err) {
        // no detener la app por errores de permisos; dejar role como null
        console.error('Error al cargar perfil en AuthProvider:', err);
        setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Ejecutar una vez al montar
    checkUser();

    // Listener de cambios de auth: actualiza user sin re-ejecutar checkUser innecesariamente
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) setRole(null);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []); // efecto solo se ejecuta una vez en el montaje

  const value = { user, role, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- CÓDIGO CORREGIDO ---
// Hook personalizado para usar nuestro contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};