// src/api/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Lee SIEMPRE de las env (sin fallbacks hardcodeados)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  db: { schema: 'public' },
  global: { headers: { 'Content-Type': 'application/json' } },
})
