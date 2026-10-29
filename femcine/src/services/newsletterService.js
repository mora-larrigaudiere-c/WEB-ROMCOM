// Suscripción de demostración: guarda el correo SOLO en este dispositivo (LocalStorage).
// No existe backend ni envío de correos.
import { readJSON, writeJSON } from './storageService.js';

export const NEWSLETTER_KEY = 'femcine:newsletter:v1';

// Devuelve 'added' o 'exists'. Lanza StorageError si no se puede leer o guardar.
export function addSubscriber(email) {
  const clean = String(email).trim().toLowerCase();
  const result = readJSON(NEWSLETTER_KEY);
  const list = result.found && Array.isArray(result.value) ? result.value : [];
  if (list.includes(clean)) return 'exists';
  writeJSON(NEWSLETTER_KEY, [...list, clean]);
  return 'added';
}
