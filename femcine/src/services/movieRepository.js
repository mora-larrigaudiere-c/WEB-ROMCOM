// Repositorio del catálogo: lee y escribe las películas en LocalStorage.
import { readJSON, writeJSON, StorageError } from './storageService.js';
import { SEED_MOVIES } from '../data/seedMovies.js';

export const MOVIES_KEY = 'femcine:movies:v1';
const STORAGE_VERSION = 1;

function cloneSeed() {
  return SEED_MOVIES.map((movie) => ({ ...movie }));
}

function looksLikeMovie(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    item.title.length > 0
  );
}

// Devuelve { movies, error }. "error" es un texto para el usuario o null.
// - Sin catálogo guardado: se siembran las películas de ejemplo (solo esta vez).
// - Catálogo guardado (aunque esté vacío): se respeta tal cual.
// - Datos ilegibles: se muestran las películas de ejemplo SIN reponerlas en LocalStorage hasta que
//   el usuario haga un cambio, y se avisa claramente.
export function loadMovies() {
  try {
    const result = readJSON(MOVIES_KEY);
    if (!result.found) {
      const seed = cloneSeed();
      const saveError = saveMovies(seed);
      return { movies: seed, error: saveError };
    }
    const data = result.value;
    const list = Array.isArray(data) ? data : data && Array.isArray(data.movies) ? data.movies : null;
    if (!list) {
      throw new StorageError('El catálogo guardado tiene un formato que no reconocemos.', 'corrupt');
    }
    return { movies: list.filter(looksLikeMovie), error: null };
  } catch (e) {
    const detail = e instanceof StorageError ? e.message : 'No pudimos cargar el catálogo guardado.';
    return {
      movies: cloneSeed(),
      error: `${detail} Mostramos las películas de ejemplo; si hacés cambios, reemplazarán lo guardado.`
    };
  }
}

// Devuelve null si se guardó bien, o un texto de error para el usuario.
export function saveMovies(movies) {
  try {
    writeJSON(MOVIES_KEY, { version: STORAGE_VERSION, movies });
    return null;
  } catch (e) {
    return e instanceof StorageError ? e.message : 'No pudimos guardar los cambios.';
  }
}

function slugify(text) {
  return String(text || 'pelicula')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'pelicula';
}

// Genera un id legible y único a partir del título.
export function createId(title, existingIds = []) {
  const base = slugify(title);
  const taken = new Set(existingIds);
  // "nueva" está reservado por la ruta /peliculas/nueva.
  let id = base === 'nueva' ? 'nueva-pelicula' : base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}
