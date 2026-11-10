// Estado compartido de solicitudes de películas (pedidos al catálogo).
// Funciona en modo local (LocalStorage) o en la nube (Supabase movie_requests).
import { reactive } from 'vue';
import {
  loadLocalRequests,
  saveLocalRequests,
  normalizeRequest
} from '@/services/requestsRepository';
import {
  fetchUserRequests,
  insertUserRequest,
  deleteUserRequest
} from '@/services/cloudCatalogService';

export const requestsState = reactive({
  items: [],
  loading: false,
  error: null,
  isCloud: false,
  cloudUserId: null,
  ready: false
});

function persistLocal() {
  requestsState.error = saveLocalRequests(requestsState.items);
}

export async function initRequests(userId = null) {
  requestsState.loading = true;
  requestsState.error = null;

  if (userId) {
    requestsState.isCloud = true;
    requestsState.cloudUserId = userId;
    requestsState.items = []; // Limpiar memoria para evitar fugas entre cuentas
    try {
      const cloudReqs = await fetchUserRequests(userId);
      requestsState.items = cloudReqs;
    } catch (err) {
      console.warn('[FemCine] Error al cargar solicitudes de la nube:', err);
      requestsState.error = 'No se pudieron sincronizar las solicitudes en la nube.';
      // Fallback a local
      const local = loadLocalRequests();
      requestsState.items = local.requests;
    }
  } else {
    requestsState.isCloud = false;
    requestsState.cloudUserId = null;
    const local = loadLocalRequests();
    requestsState.items = local.requests;
    requestsState.error = local.error;
  }

  requestsState.ready = true;
  requestsState.loading = false;
}

export function resetRequestsToLocal() {
  requestsState.items = [];
  requestsState.isCloud = false;
  requestsState.cloudUserId = null;
  const local = loadLocalRequests();
  requestsState.items = local.requests;
  requestsState.error = local.error;
  requestsState.ready = true;
}

export async function addRequest(data) {
  const normalized = normalizeRequest(data);

  if (requestsState.isCloud && requestsState.cloudUserId) {
    try {
      const saved = await insertUserRequest(requestsState.cloudUserId, normalized);
      requestsState.items = [saved, ...requestsState.items];
      return saved;
    } catch (err) {
      console.error('[FemCine] Error al guardar solicitud en la nube:', err);
      requestsState.error = 'No se pudo registrar la solicitud en la nube.';
      throw err;
    }
  } else {
    requestsState.items = [normalized, ...requestsState.items];
    persistLocal();
    return normalized;
  }
}

export async function deleteRequest(id) {
  if (requestsState.isCloud && requestsState.cloudUserId) {
    try {
      await deleteUserRequest(requestsState.cloudUserId, id);
      requestsState.items = requestsState.items.filter((r) => r.id !== id);
    } catch (err) {
      console.error('[FemCine] Error al eliminar solicitud en la nube:', err);
      requestsState.error = 'No se pudo eliminar la solicitud en la nube.';
      throw err;
    }
  } else {
    requestsState.items = requestsState.items.filter((r) => r.id !== id);
    persistLocal();
  }
}
