// Validaciones personalizadas del formulario de películas y de la newsletter.
// Devuelven un objeto { campo: 'mensaje' }; vacío significa que todo es válido.
import { CATEGORY_IDS } from '../data/categories.js';

export const MIN_YEAR = 1888; // primeras películas filmadas
export const MAX_DURATION = 600;

export function isValidUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch (e) {
    return false;
  }
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

function text(value) {
  return String(value == null ? '' : value).trim();
}

export function validateMovie(form, { posterKeys = [], currentYear = new Date().getFullYear() } = {}) {
  const errors = {};

  const title = text(form.title);
  if (!title) errors.title = 'Escribí el título de la película.';
  else if (title.length < 2) errors.title = 'El título debe tener al menos 2 caracteres.';
  else if (title.length > 100) errors.title = 'El título no puede superar los 100 caracteres.';

  const year = text(form.year);
  const maxYear = currentYear + 3;
  if (!year) errors.year = 'Indicá el año de estreno.';
  else if (!/^\d+$/.test(year)) errors.year = 'El año debe ser un número entero, por ejemplo 1999.';
  else if (Number(year) < MIN_YEAR || Number(year) > maxYear) {
    errors.year = `El año debe estar entre ${MIN_YEAR} y ${maxYear}.`;
  }

  const director = text(form.director);
  if (!director) errors.director = 'Escribí quién dirigió la película.';
  else if (director.length < 3) errors.director = 'La dirección debe tener al menos 3 caracteres.';

  const duration = text(form.duration);
  if (!duration) errors.duration = 'Indicá la duración en minutos.';
  else if (!/^\d+$/.test(duration)) errors.duration = 'La duración debe ser un número entero de minutos.';
  else if (Number(duration) <= 0) errors.duration = 'La duración debe ser mayor que cero.';
  else if (Number(duration) > MAX_DURATION) errors.duration = `La duración no puede superar ${MAX_DURATION} minutos.`;

  const genre = text(form.genre);
  if (!genre) errors.genre = 'Escribí el género, por ejemplo "Comedia romántica".';
  else if (genre.length < 3) errors.genre = 'El género debe tener al menos 3 caracteres.';

  if (!text(form.category)) errors.category = 'Elegí una categoría editorial.';
  else if (!CATEGORY_IDS.includes(form.category)) errors.category = 'Esa categoría no está disponible.';

  if (form.posterMode === 'url') {
    const url = text(form.posterUrl);
    if (!url) errors.poster = 'Pegá la dirección (URL) de la imagen del póster.';
    else if (!isValidUrl(url)) errors.poster = 'La URL no es válida. Debe empezar con http:// o https://.';
  } else if (!posterKeys.includes(form.posterKey)) {
    errors.poster = 'Elegí un póster de la lista.';
  }

  const synopsis = text(form.synopsis);
  if (!synopsis) errors.synopsis = 'Escribí una breve sinopsis.';
  else if (synopsis.length < 20) errors.synopsis = 'La sinopsis debe tener al menos 20 caracteres.';
  else if (synopsis.length > 600) errors.synopsis = 'La sinopsis no puede superar los 600 caracteres.';

  return errors;
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

export function validateEmail(value) {
  const email = text(value);
  if (!email) return 'Escribí tu correo electrónico.';
  if (!isValidEmail(email)) return 'Ese correo no parece válido. Revisá que tenga la forma nombre@dominio.com.';
  return '';
}
