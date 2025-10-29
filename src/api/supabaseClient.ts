import { createClient } from '@supabase/supabase-js';

// ================================================================
// 🔧 SUPABASE CLIENT (SOLO PARA STORAGE)
// ================================================================
// Este cliente se usa ÚNICAMENTE para Supabase Storage (imágenes)
// La autenticación ahora se maneja con el backend JWT

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cdrzomyyxyfhazkzuwou.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkcnpvbXl5eHlmaGF6a3p1d291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTY0ODcsImV4cCI6MjA3NTg3MjQ4N30.UxQj1g9uRMi2Z0HRa_u-ksYJUI9o1H2Q-kTEa8RZqfo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});