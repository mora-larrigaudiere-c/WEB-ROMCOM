import { POSTERS } from '@/data/assets';

// "poster" puede ser una clave del manifiesto o una URL http(s) escrita por el usuario.
export function resolvePoster(poster) {
  if (poster && POSTERS[poster]) return POSTERS[poster].src;
  return typeof poster === 'string' ? poster : '';
}

export function formatDuration(minutes) {
  return Number.isFinite(Number(minutes)) && Number(minutes) > 0 ? `${minutes} min` : 'Sin dato';
}
