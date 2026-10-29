// Categorías editoriales de FemCine.
// Son colecciones curadas por el sitio; no son los géneros cinematográficos
// (el género es un dato aparte de cada película, p. ej. "Comedia romántica").
export const CATEGORIES = [
  { id: 'romcom', label: 'Romcom' },
  { id: 'musical', label: 'Musical' },
  { id: 'llanto', label: 'Llanto' },
  { id: 'epoca', label: 'Época' },
  { id: 'distopia', label: 'Distopía' },
  { id: 'terror', label: 'Terror' }
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function categoryLabel(id) {
  const found = CATEGORIES.find((c) => c.id === id);
  return found ? found.label : 'Sin categoría';
}
