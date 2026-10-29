// Conversión entre el registro guardado y el estado del formulario (siempre trabaja sobre copias).
import { isValidUrl } from './validators.js';

export function emptyForm() {
  return {
    title: '',
    year: '',
    director: '',
    duration: '',
    genre: '',
    category: '',
    posterMode: 'manifest',
    posterKey: '',
    posterUrl: '',
    synopsis: ''
  };
}

export function movieToForm(movie, posterKeys = []) {
  if (!movie) return emptyForm();
  const isKey = posterKeys.includes(movie.poster);
  return {
    title: movie.title,
    year: String(movie.year),
    director: movie.director,
    duration: String(movie.duration),
    genre: movie.genre,
    category: movie.category,
    posterMode: isKey ? 'manifest' : 'url',
    posterKey: isKey ? movie.poster : '',
    posterUrl: isKey ? '' : movie.poster || '',
    synopsis: movie.synopsis
  };
}

// Se asume que el formulario ya fue validado.
export function formToMovie(form) {
  return {
    title: form.title.trim(),
    year: Number(form.year),
    director: form.director.trim(),
    duration: Number(form.duration),
    genre: form.genre.trim(),
    category: form.category,
    poster: form.posterMode === 'url' ? form.posterUrl.trim() : form.posterKey,
    synopsis: form.synopsis.trim()
  };
}

export function isUrlPoster(poster) {
  return typeof poster === 'string' && isValidUrl(poster);
}
