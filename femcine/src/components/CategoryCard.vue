<template>
  <li class="category-card">
    <router-link class="category-card__link" :to="{ name: 'catalogo', query: { categoria: category.id } }">
      <img class="category-card__img" :src="image" :alt="`Categoría ${category.label}`" loading="lazy" decoding="async" />
      <span class="sr-only">, {{ count }} {{ count === 1 ? 'película' : 'películas' }}</span>
    </router-link>
  </li>
</template>

<script>
export default {
  name: 'CategoryCard',
  props: {
    category: { type: Object, required: true, validator: (c) => !!c.id && !!c.label },
    image: { type: String, required: true },
    count: { type: Number, default: 0 }
  }
};
</script>

<style scoped>
.category-card { list-style: none; }
.category-card__link {
  display: flex; align-items: flex-end; justify-content: center;
  aspect-ratio: 3 / 4; min-height: 44px; text-decoration: none;
}
/* El gráfico original ya incluye el rótulo: se muestra completo y sin deformar. */
.category-card__img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; transition: transform 0.2s ease; }
.category-card__link:hover .category-card__img { transform: scale(1.04) rotate(-1deg); }
</style>
