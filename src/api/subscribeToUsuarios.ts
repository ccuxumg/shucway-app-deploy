import { supabase } from './supabaseClient';

export const subscribeToUsuarios = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel('perfil_usuario_changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Escucha todos los eventos (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'perfil_usuario',
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
