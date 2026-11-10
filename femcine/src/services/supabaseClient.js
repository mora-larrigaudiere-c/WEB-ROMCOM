// Cliente de Supabase para autenticación con Google y persistencia en la nube.
// Si faltan las variables de entorno VUE_APP_SUPABASE_URL o VUE_APP_SUPABASE_ANON_KEY,
// la aplicación permanece de forma transparente en modo local (LocalStorage).
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('TU_SUPABASE')
);

let client = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  } catch (err) {
    console.warn('[FemCine] Error al inicializar cliente Supabase:', err);
    client = null;
  }
}

export function getSupabase() {
  return client;
}

export async function signInWithGoogle() {
  if (!client) {
    throw new Error('Supabase no está configurado. Configurá VUE_APP_SUPABASE_URL y VUE_APP_SUPABASE_ANON_KEY.');
  }

  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo
    }
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.warn('[FemCine] Error al obtener sesión:', error);
    return null;
  }
  return data.session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session ? session.user : null;
}

export function onAuthStateChange(callback) {
  if (!client) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
