import { supabase } from './supabaseClient';

type DatabaseChangePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
  schema: string;
  table: string;
  commit_timestamp: string;
};

export const subscribeToUsuarios = (callback: (payload: DatabaseChangePayload) => void) => {
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
