// Estado compartido de autenticación con Supabase y verificación de rol administrativo.
// ARQUITECTURA CRÍTICA:
// 1. onAuthStateChange callback es ESTRICTAMENTE SÍNCRONO para no bloquear el mutex de Supabase.
// 2. Al cambiar user.id se invalida inmediatamente el estado privado y admin.
// 3. El refresh de rol/perfil se posterga fuera del callback mediante setTimeout con epoch para descartar carreras.
// 4. Se ignora recarga ante TOKEN_REFRESHED para el mismo usuario.

import { reactive } from 'vue';
import {
  isSupabaseConfigured,
  signInWithGoogle,
  signOut,
  getCurrentSession,
  onAuthStateChange
} from '../services/supabaseClient.js';
import { checkAdminRole, fetchProfile } from '../services/sharedDataService.js';

export const authState = reactive({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  isConfigured: isSupabaseConfigured,
  loading: isSupabaseConfigured,
  error: null
});

let initialized = false;
let currentAuthEpoch = 0;
let lastKnownUserId = null;
const listeners = [];

export function subscribeAuthChange(cb) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyAuthChange(event, session, user) {
  listeners.forEach((cb) => {
    try {
      cb({ event, session, user, isAdmin: authState.isAdmin });
    } catch (err) {
      console.warn('[FemCine] Error en listener de autenticación:', err);
    }
  });
}

function scheduleRefreshUserRole(user, epoch) {
  setTimeout(async () => {
    // Si la época cambió (usuario deslogueado o cambió de cuenta), descartar este refresh viejo
    if (epoch !== currentAuthEpoch || !authState.user || authState.user.id !== user.id) return;

    if (!user) {
      authState.isAdmin = false;
      authState.profile = null;
      return;
    }

    try {
      const [isAdmin, profile] = await Promise.all([
        checkAdminRole(user.id),
        fetchProfile(user.id)
      ]);

      // Verificar época y usuario nuevamente tras las promesas de red
      if (epoch === currentAuthEpoch && authState.user && authState.user.id === user.id) {
        authState.isAdmin = Boolean(isAdmin);
        authState.profile = profile;
        notifyAuthChange('ROLE_UPDATED', authState.session, user);
      }
    } catch (err) {
      if (epoch === currentAuthEpoch && authState.user && authState.user.id === user.id) {
        authState.isAdmin = false;
        authState.profile = null;
      }
    }
  }, 0);
}

export async function initAuth() {
  if (initialized) return;
  initialized = true;

  if (!isSupabaseConfigured) {
    authState.loading = false;
    return;
  }

  currentAuthEpoch++;
  const epoch = currentAuthEpoch;

  try {
    const session = await getCurrentSession();
    authState.session = session;
    authState.user = session ? session.user : null;
    lastKnownUserId = authState.user ? authState.user.id : null;

    if (authState.user) {
      scheduleRefreshUserRole(authState.user, epoch);
    }
    notifyAuthChange('INITIAL_SESSION', session, authState.user);
  } catch (err) {
    console.warn('[FemCine] Error al inicializar sesión:', err);
    authState.error = 'No se pudo verificar la sesión actual.';
  } finally {
    authState.loading = false;
  }

  // CALLBACK SÍNCRONO: NUNCA async ni await adentro
  onAuthStateChange((event, session) => {
    const newUser = session ? session.user : null;
    const newUserId = newUser ? newUser.id : null;

    // Si es un simple refresh de token del mismo usuario, no invalidar ni recargar
    if (event === 'TOKEN_REFRESHED' && newUserId === lastKnownUserId) {
      authState.session = session;
      return;
    }

    // Al cambiar de cuenta o salir, incrementar epoch e invalidar de inmediato
    currentAuthEpoch++;
    const epoch = currentAuthEpoch;
    lastKnownUserId = newUserId;

    authState.session = session;
    authState.user = newUser;
    // Invalidación inmediata síncrona
    authState.isAdmin = false;
    authState.profile = null;

    // Notificar inmediatamente el cambio de usuario síncronamente
    notifyAuthChange(event, session, newUser);

    // Diferir la consulta de rol y perfil fuera del mutex de Supabase
    if (newUser) {
      scheduleRefreshUserRole(newUser, epoch);
    }
  });
}

export async function login() {
  authState.error = null;
  try {
    await signInWithGoogle();
  } catch (err) {
    authState.error = err.message || 'Error al iniciar sesión con Google.';
    throw err;
  }
}

export async function logout() {
  authState.error = null;
  currentAuthEpoch++; // Invalidar cualquier refresh pendiente inmediatamente
  lastKnownUserId = null;

  try {
    await signOut();
    authState.session = null;
    authState.user = null;
    authState.isAdmin = false;
    authState.profile = null;
    notifyAuthChange('SIGNED_OUT', null, null);
  } catch (err) {
    authState.error = err.message || 'Error al cerrar sesión.';
    throw err;
  }
}

export function dismissAuthError() {
  authState.error = null;
}
