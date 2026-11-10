// Repositorio de solicitudes de películas en modo local (LocalStorage).
import { readJSON, writeJSON, StorageError } from './storageService.js';

export const REQUESTS_KEY = 'femcine:requests:v1';
const STORAGE_VERSION = 1;

export function normalizeRequest(item) {
  const parsedYear = typeof item.year === 'number'
    ? item.year
    : (typeof item.year === 'string' && /^\d+$/.test(item.year.trim()) ? parseInt(item.year.trim(), 10) : null);

  const year = Number.isInteger(parsedYear) && parsedYear >= 1888 && parsedYear <= 2100 ? parsedYear : null;

  return {
    id: typeof item.id === 'string' && item.id.trim() ? item.id : `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: typeof item.title === 'string' ? item.title.trim() : '',
    category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : 'romcom',
    year,
    reason: typeof item.reason === 'string' ? item.reason.trim() : (typeof item.comment === 'string' ? item.comment.trim() : ''),
    referenceUrl: typeof item.referenceUrl === 'string' ? item.referenceUrl.trim() : '',
    status: typeof item.status === 'string' && item.status.trim() ? item.status.trim() : 'Pendiente',
    createdAt: typeof item.createdAt === 'string' && item.createdAt.trim() ? item.createdAt : new Date().toISOString()
  };
}

export function loadLocalRequests() {
  try {
    const result = readJSON(REQUESTS_KEY);
    if (!result.found) {
      return { requests: [], error: null };
    }
    const data = result.value;
    const list = Array.isArray(data) ? data : data && Array.isArray(data.requests) ? data.requests : [];
    return {
      requests: list.map(normalizeRequest),
      error: null
    };
  } catch (e) {
    const detail = e instanceof StorageError ? e.message : 'No pudimos cargar las solicitudes guardadas.';
    return { requests: [], error: detail };
  }
}

export function saveLocalRequests(requests) {
  try {
    writeJSON(REQUESTS_KEY, { version: STORAGE_VERSION, requests });
    return null;
  } catch (e) {
    return e instanceof StorageError ? e.message : 'No pudimos guardar las solicitudes.';
  }
}
