// Capa única de acceso a LocalStorage. Nadie más en la app toca localStorage directamente.
// Todas las funciones lanzan StorageError con mensajes pensados para mostrarse al usuario.

export class StorageError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

function getBackend() {
  try {
    const backend = globalThis.localStorage;
    if (!backend) throw new Error('sin almacenamiento');
    return backend;
  } catch (e) {
    throw new StorageError(
      'Tu navegador no permite guardar datos en este dispositivo. Los cambios se perderán al cerrar la página.',
      'unavailable'
    );
  }
}

// Devuelve { found: false } si la clave no existe y { found: true, value } si existe.
export function readJSON(key) {
  const backend = getBackend();
  let raw;
  try {
    raw = backend.getItem(key);
  } catch (e) {
    throw new StorageError('No pudimos leer los datos guardados en este dispositivo.', 'read');
  }
  if (raw === null || raw === undefined) return { found: false, value: null };
  try {
    return { found: true, value: JSON.parse(raw) };
  } catch (e) {
    throw new StorageError('Los datos guardados en este dispositivo están dañados y no pudieron leerse.', 'corrupt');
  }
}

export function writeJSON(key, value) {
  const backend = getBackend();
  try {
    backend.setItem(key, JSON.stringify(value));
  } catch (e) {
    const full = e && (e.name === 'QuotaExceededError' || e.code === 22);
    throw new StorageError(
      full
        ? 'No hay espacio suficiente para guardar los cambios en este dispositivo.'
        : 'No pudimos guardar los cambios en este dispositivo.',
      'write'
    );
  }
}
