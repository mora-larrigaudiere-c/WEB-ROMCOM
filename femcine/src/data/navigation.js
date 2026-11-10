// Ítems de navegación compartidos por la cabecera (escritorio) y barra inferior (móvil).
export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: 'home', exact: true },
  { to: '/peliculas', label: 'Películas', icon: 'film', exact: false },
  { to: '/comunidad', label: 'Comunidad', icon: 'sparkles', exact: false },
  { to: '/nosotras', label: 'Nosotras', icon: 'people', exact: true }
];

export function isNavActive(item, path) {
  return item.exact ? path === item.to : path === item.to || path.startsWith(item.to + '/');
}
