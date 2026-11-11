// Estado compartido del catálogo de FemCine (Única fuente de verdad reactiva).
// Arquitectura Robusta:
// 1. Catálogo PÚBLICO COMPARTIDO: lectura universal de 'movies'.
// 2. Modificaciones (alta, edición, baja): permitidas solo para administradoras verificadas por RLS.
// 3. Preferencias de usuario: favoritos y calificaciones estrictamente privadas por cuenta.
// 4. Cola serial de operaciones por película con epoch, rollback en caso de error y sin fugas entre cuentas al cerrar sesión.

import { reactive } from 'vue';
import { loadMovies, saveMovies, createId, normalizeMovie } from '../services/movieRepository.js';
import {
  fetchPublicMovies,
  insertAdminMovie,
  updateAdminMovie,
  deleteAdminMovie,
  fetchUserPreferences,
  upsertUserPreference,
  CACHE_KEYS
} from '../services/sharedDataService.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';

export const state = reactive({
  movies: [],
  preferences: {}, // { [movieId]: { isFavorite: bool, userRating: int } }
  ready: false,
  loading: false,
  error: null,
  notice: null,
  isCloud: isSupabaseConfigured,
  userId: null
});

// Epoch para descartar respuestas asíncronas tardías al cambiar o cerrar sesión
let catalogEpoch = 0;
// La consulta pública sigue siendo válida cuando cambia la sesión privada.
let publicCatalogEpoch = 0;

// Cola serial por película para evitar condiciones de carrera en upserts
const preferenceQueues = new Map();
const preferenceRevisions = new Map();
const confirmedPreferences = new Map();

function enqueuePreferenceTask(movieId, task) {
  const current = preferenceQueues.get(movieId) || Promise.resolve();
  const next = current.then(task).catch((err) => {
    console.error(`[FemCine] Error en cola de preferencias (${movieId}):`, err);
  });
  preferenceQueues.set(movieId, next);
  return next;
}

// Aplica las preferencias del usuario actual sobre el catálogo público en memoria
// ¡IMPORTANTE!: Si la película no está en preferences, el valor SIEMPRE es false y 0.
// Nunca se preservan favoritos de cuentas anteriores.
function applyPreferences() {
  state.movies = state.movies.map((m) => {
    const pref = state.preferences[m.id];
    return {
      ...m,
      isFavorite: pref ? Boolean(pref.isFavorite) : false,
      userRating: pref && Number.isInteger(pref.userRating) ? pref.userRating : 0
    };
  });
}

// Lee preferencias anónimas locales (solo cuando no hay usuario logueado)
function loadGuestPreferences() {
  try {
    const raw = localStorage.getItem('femcine:guest:prefs:v2');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveGuestPreferences(prefs) {
  try {
    localStorage.setItem('femcine:guest:prefs:v2', JSON.stringify(prefs));
  } catch (e) {
    throw new Error('No pudimos guardar tus preferencias en este dispositivo.');
  }
}

export async function initCatalog(userId = null) {
  catalogEpoch++;
  const epoch = catalogEpoch;
  const publicEpoch = ++publicCatalogEpoch;
  state.userId = userId;
  state.loading = true;

  // 1. Cargar catálogo público base (desde caché o semillas locales)
  let publicList = null;
  try {
    const cached = localStorage.getItem(CACHE_KEYS.PUBLIC_MOVIES);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        publicList = parsed;
      }
    }
  } catch (e) {
    publicList = null;
  }

  if (publicList === null) {
    const localResult = loadMovies();
    publicList = localResult.movies || [];
  }

  // Base pública limpia (sin preferencias privadas incrustadas)
  state.movies = publicList.map((m) => ({ ...m, isFavorite: false, userRating: 0 }));
  state.ready = true;

  // 2. Si hay backend Supabase, buscar catálogo público actualizado
  if (isSupabaseConfigured) {
    try {
      const remote = await fetchPublicMovies();
      // Restaurar Google o cambiar de cuenta no debe descartar datos públicos.
      if (publicEpoch === publicCatalogEpoch && Array.isArray(remote)) {
        state.movies = remote.map((m) => ({ ...m, isFavorite: false, userRating: 0 }));
        applyPreferences();
        state.isCloud = true;
      }
    } catch (err) {
      if (publicEpoch === publicCatalogEpoch) {
        state.error = 'No se pudo sincronizar el catálogo público desde el servidor. Mostrando versión en caché.';
      }
    }
  }

  // 3. Cargar preferencias del usuario autenticado o de la invitada
  if (epoch === catalogEpoch && state.userId === userId) {
    if (userId) {
      try {
        const userPrefs = await fetchUserPreferences(userId);
        if (epoch === catalogEpoch && state.userId === userId) {
          state.preferences = userPrefs || {};
          applyPreferences();
        }
      } catch (err) {
        if (epoch === catalogEpoch && state.userId === userId) {
          state.error = 'No se pudieron cargar tus favoritas y calificaciones.';
        }
      }
    } else {
      state.preferences = loadGuestPreferences();
      applyPreferences();
    }
  }
  if (publicEpoch === publicCatalogEpoch) state.loading = false;
}

export async function setUserSession(userId) {
  catalogEpoch++;
  preferenceQueues.clear();
  preferenceRevisions.clear();
  confirmedPreferences.clear();
  const epoch = catalogEpoch;
  state.userId = userId;

  // Limpieza inmediata síncrona de preferencias anteriores para evitar fugas visuales
  state.preferences = {};
  applyPreferences();

  if (!userId) {
    // Al salir, cargar solo las preferencias de la invitada local
    state.preferences = loadGuestPreferences();
    applyPreferences();
    return;
  }

  try {
    const userPrefs = await fetchUserPreferences(userId);
    if (epoch === catalogEpoch && state.userId === userId) {
      state.preferences = userPrefs || {};
      applyPreferences();
    }
  } catch (err) {
    if (epoch === catalogEpoch && state.userId === userId) {
      state.error = 'No se pudieron sincronizar las preferencias de tu cuenta.';
    }
  }
}

export function getMovieById(id) {
  return state.movies.find((movie) => movie.id === id) || null;
}

// Acción de catálogo: solo administradoras (o modo demo local si no hay nube)
export async function addMovie(data) {
  const movie = normalizeMovie({
    ...data,
    id: createId(data.title, state.movies.map((m) => m.id))
  });

  if (isSupabaseConfigured) {
    try {
      const saved = await insertAdminMovie(movie);
      state.movies = [{ ...saved, isFavorite: false, userRating: 0 }, ...state.movies];
      return saved;
    } catch (err) {
      state.error = err.message || 'Error al guardar la película en Supabase.';
      throw err;
    }
  } else {
    state.movies = [{ ...movie, isFavorite: false, userRating: 0 }, ...state.movies];
    saveMovies(state.movies);
    return movie;
  }
}

export async function updateMovie(id, data) {
  const existing = getMovieById(id);
  const updated = normalizeMovie({
    ...existing,
    ...data,
    id
  });

  if (isSupabaseConfigured) {
    try {
      const saved = await updateAdminMovie(id, updated);
      state.movies = state.movies.map((m) => (m.id === id ? { ...saved, isFavorite: m.isFavorite, userRating: m.userRating } : m));
      return saved;
    } catch (err) {
      state.error = err.message || 'Error al actualizar la película en Supabase.';
      throw err;
    }
  } else {
    state.movies = state.movies.map((m) => (m.id === id ? { ...updated, isFavorite: m.isFavorite, userRating: m.userRating } : m));
    saveMovies(state.movies);
  }
}

export async function removeMovie(id) {
  if (isSupabaseConfigured) {
    try {
      await deleteAdminMovie(id);
      state.movies = state.movies.filter((m) => m.id !== id);
    } catch (err) {
      state.error = err.message || 'Error al eliminar la película en Supabase.';
      throw err;
    }
  } else {
    state.movies = state.movies.filter((m) => m.id !== id);
    saveMovies(state.movies);
  }
}

// Cada operación conserva la cuenta, generación y valores con los que nació.
// Las operaciones viejas no escriben ni revierten datos de una cuenta nueva.
async function persistPreference(movieId, patch) {
  const target = getMovieById(movieId);
  if (!target) return;
  const userId = state.userId;
  const epoch = catalogEpoch;
  const isCurrent = () => epoch === catalogEpoch && userId === state.userId;
  const before = {
    isFavorite: Boolean(target.isFavorite),
    userRating: Number.isInteger(target.userRating) ? target.userRating : 0
  };
  const saved = confirmedPreferences.get(movieId);
  if (!saved || saved.epoch !== epoch) {
    confirmedPreferences.set(movieId, { epoch, value: before });
  }
  const desired = { ...before, ...patch };
  const revision = (preferenceRevisions.get(movieId) || 0) + 1;
  preferenceRevisions.set(movieId, revision);
  state.preferences[movieId] = desired;
  applyPreferences();

  return enqueuePreferenceTask(movieId, async () => {
    if (!isCurrent()) return;
    try {
      if (userId) {
        await upsertUserPreference(userId, movieId, desired);
      } else {
        saveGuestPreferences({ ...state.preferences, [movieId]: desired });
      }
      if (!isCurrent()) return;
      confirmedPreferences.set(movieId, { epoch, value: desired });
      if (preferenceRevisions.get(movieId) === revision) {
        state.preferences[movieId] = desired;
        applyPreferences();
      }
    } catch (err) {
      if (!isCurrent()) return;
      if (preferenceRevisions.get(movieId) === revision) {
        state.preferences[movieId] = { ...confirmedPreferences.get(movieId).value };
        applyPreferences();
      };
      state.error = 'No se pudieron guardar tus preferencias. Se revirtió el cambio pendiente.';
    }
  });
}

export async function toggleFavorite(movieId) {
  const target = getMovieById(movieId);
  if (!target) return;
  return persistPreference(movieId, { isFavorite: !target.isFavorite });
}

export async function setRating(movieId, rating) {
  const valid = Number.isInteger(rating) && rating >= 0 && rating <= 5 ? rating : 0;
  return persistPreference(movieId, { userRating: valid });
}

export function setNotice(text) {
  state.notice = text;
}

export function dismissError() {
  state.error = null;
}
