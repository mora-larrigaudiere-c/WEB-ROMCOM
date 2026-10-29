// Búsqueda, filtro y ordenamiento del catálogo. Funciones puras (fáciles de probar).
import { CATEGORY_IDS } from '../data/categories.js';

export const SORT_OPTIONS = [
  { value: 'titulo-asc', label: 'Título (A–Z)' },
  { value: 'titulo-desc', label: 'Título (Z–A)' },
  { value: 'anio-desc', label: 'Año (más nuevas primero)' },
  { value: 'anio-asc', label: 'Año (más antiguas primero)' }
];
export const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);
export const DEFAULT_SORT = 'titulo-asc';

// Minúsculas y sin tildes, para que "epoca" encuentre "Época" y "amor" encuentre "AMOR".
export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function compareTitles(a, b) {
  return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
}

export function filterAndSort(movies, { query = '', category = '', sort = DEFAULT_SORT } = {}) {
  const q = normalizeText(query);
  const result = movies.filter((movie) => {
    const matchesText = !q || normalizeText(movie.title).includes(q);
    const matchesCategory = !category || movie.category === category;
    return matchesText && matchesCategory;
  });

  const sorters = {
    'titulo-asc': compareTitles,
    'titulo-desc': (a, b) => compareTitles(b, a),
    'anio-desc': (a, b) => b.year - a.year || compareTitles(a, b),
    'anio-asc': (a, b) => a.year - b.year || compareTitles(a, b)
  };
  return result.sort(sorters[sort] || sorters[DEFAULT_SORT]);
}

// Lee y sanea los filtros que vienen de la URL (?q=...&categoria=...&orden=...).
export function parseFilters(query = {}) {
  const first = (v) => (Array.isArray(v) ? v[0] : v);
  const q = first(query.q);
  const categoria = first(query.categoria);
  const orden = first(query.orden);
  return {
    query: typeof q === 'string' ? q : '',
    category: CATEGORY_IDS.includes(categoria) ? categoria : '',
    sort: SORT_VALUES.includes(orden) ? orden : DEFAULT_SORT
  };
}
