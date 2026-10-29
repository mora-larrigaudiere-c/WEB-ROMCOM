// Consumo de una API externa real con Fetch: Studio Ghibli API (sin clave).
// Documentación: https://ghibliapi.vercel.app
export const GHIBLI_URL = 'https://ghibliapi.vercel.app/films';

export class ApiError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApiError';
  }
}

// Convierte un registro crudo de la API en un objeto simple para las tarjetas.
export function normalizeFilm(raw) {
  const minutes = Number(raw.running_time);
  return {
    id: String(raw.id),
    title: raw.title || '',
    originalTitle: raw.original_title || '',
    image: raw.image || raw.movie_banner || '',
    year: raw.release_date ? String(raw.release_date) : '',
    director: raw.director || '',
    duration: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    description: raw.description || ''
  };
}

export async function fetchGhibliFilms({ signal, fetchImpl, timeoutMs = 10000 } = {}) {
  const doFetch = fetchImpl || globalThis.fetch;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    let response;
    try {
      response = await doFetch(GHIBLI_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        if (timedOut) throw new ApiError('El servicio externo tardó demasiado en responder.');
        throw e; // cancelación pedida por la app: el llamador la ignora
      }
      throw new ApiError('No pudimos conectarnos con el servicio externo. Revisá tu conexión e intentá otra vez.');
    }

    if (!response.ok) {
      throw new ApiError(`El servicio externo respondió con un error (código ${response.status}).`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new ApiError('La respuesta del servicio externo no tiene el formato esperado.');
    }
    if (!Array.isArray(data)) {
      throw new ApiError('La respuesta del servicio externo no tiene el formato esperado.');
    }
    return data.map(normalizeFilm).filter((film) => film.title);
  } finally {
    clearTimeout(timer);
  }
}
