// Estado compartido del catálogo (única fuente de verdad en memoria).
// Las vistas leen "state.movies"; todo cambio pasa por estas funciones, que persisten en LocalStorage.
import { reactive } from 'vue';
import { loadMovies, saveMovies, createId } from '@/services/movieRepository';

export const state = reactive({
  movies: [],
  ready: false,
  error: null, // problema de lectura/escritura en LocalStorage (texto para el usuario)
  notice: null // aviso de éxito (p. ej. "Se eliminó una película")
});

function persist() {
  state.error = saveMovies(state.movies);
}

export function initCatalog() {
  if (state.ready) return;
  const result = loadMovies();
  state.movies = result.movies;
  state.error = result.error;
  state.ready = true;
}

export function getMovieById(id) {
  return state.movies.find((movie) => movie.id === id) || null;
}

export function addMovie(data) {
  const movie = { ...data, id: createId(data.title, state.movies.map((m) => m.id)) };
  state.movies = [...state.movies, movie];
  persist();
  return movie;
}

export function updateMovie(id, data) {
  state.movies = state.movies.map((movie) => (movie.id === id ? { ...data, id } : movie));
  persist();
}

export function removeMovie(id) {
  state.movies = state.movies.filter((movie) => movie.id !== id);
  persist();
}

export function setNotice(text) {
  state.notice = text;
}

export function dismissError() {
  state.error = null;
}
